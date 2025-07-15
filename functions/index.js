const functions = require("firebase-functions/v2");
const { onCall } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const Stripe = require("stripe");
const util = require('util');

const stripeSecret = defineSecret("STRIPE_SECRET");
const remoSecret = defineSecret('REMO_API_KEY');
const remoCompanyIdSecret = defineSecret('REMO_COMPANY_ID');

admin.initializeApp();

exports.createPaymentIntent = onCall(
  {
    region: "us-central1",
    secrets: [stripeSecret],
    runtime: 'nodejs18',
  },
  async (data, context) => {   
    const amount = Number(data?.data?.amount);
    console.log("🔥 Payload:", data);
    console.log("🔥 Parsed amount:", amount);



    if (isNaN(amount) || amount <= 0) {
      console.error("❌ Invalid amount passed to createPaymentIntent:", amount);
      throw new functions.https.HttpsError("invalid-argument", "Invalid amount");
    }

    try {
      const stripe = new Stripe(stripeSecret.value(), {
        apiVersion: "2022-11-15",
      });

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        automatic_payment_methods: { enabled: true },
      });

      console.log("✅ PaymentIntent ID:", paymentIntent.id);
      console.log("✅ Client Secret:", paymentIntent.client_secret);

      return {
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id,
      };
    } catch (err) {
      console.error("❌ Stripe error:", err); // full error for debugging
      throw new functions.https.HttpsError("internal", "Failed to create PaymentIntent");
    }
  }
);

exports.getEventData = onCall(
  {
    region: 'us-central1',
    secrets: [remoSecret, remoCompanyIdSecret],
    runtime: 'nodejs18',
  },
  async (data, context) => {
    // Log only the payload the client sent. data.data contains the body for v2 callable
    console.log('📝 getEventData – received data:', util.inspect(data.data || data, { depth: 3 }));

    // Prefer eventId from data.data, then fallback to data
    const eventId = data?.data?.eventId || data?.data?.eventID || data?.eventId || data?.eventID;
    if (!eventId) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing eventId');
    }

    // Hit the Remo endpoint that returns the launch link
    // Docs: GET /v1/events/{eventId}
    // Build request URL with optional include parameter for extra data (e.g. registrationQuestions)
    const url = new URL(`https://live.remo.co/api/v1/events/${eventId}`);
    url.searchParams.set('include', 'registrationQuestions');
    url.searchParams.set('companyId', remoCompanyIdSecret.value());

    try {
      console.log('🔄 Making request to Remo API:', url.toString());
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          // Remo expects "Authorization: Token <key>" (note no extra colon after Token)
          Authorization: `Token: ${remoSecret.value()}`,
        },
        // Add timeout to prevent 504 Gateway Timeout
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });
      console.log('📝 Remo API response status:', response.status);

    if (!response.ok) {
      const err = await response.text();
      console.error('Remo error:', err);
      
      // Handle different error types
      if (response.status === 504) {
        throw new functions.https.HttpsError('deadline-exceeded', 'Remo API timeout - please try again');
      } else if (response.status === 404) {
        throw new functions.https.HttpsError('not-found', 'Event not found in Remo');
      } else if (response.status === 401) {
        throw new functions.https.HttpsError('unauthenticated', 'Invalid Remo API credentials');
      } else {
        throw new functions.https.HttpsError('internal', `Remo API failed with status ${response.status}`);
      }
    }

    // Parse the Remo API response
    const responseData = await response.json();
    console.log('📝 Remo API response:', responseData);
    
    // Check if the response has the expected structure
    if (!responseData.isSuccess || !responseData.event) {
      console.error('❌ Invalid Remo response structure:', responseData);
      throw new functions.https.HttpsError('internal', 'Invalid response from Remo API');
    }
    
    // The event data is nested in responseData.event
    const event = responseData.event;
    console.log('📝 Event data:', event);
    
    // For Remo events, we need to construct the join URL
    // Format: https://live.remo.co/e/{eventCode}
    const eventCode = event.code;
    if (!eventCode) {
      console.error('❌ No event code found in Remo response:', event);
      throw new functions.https.HttpsError('internal', 'No event code returned from Remo');
    }
    
    // Return the raw event object; client will construct the join URL
    return { event };
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Remo API timeout:', error);
      throw new functions.https.HttpsError('deadline-exceeded', 'Remo API timeout - please try again');
    }
    throw error; // Re-throw other errors
  }
  }
);

exports.addUserToRemoEvent = onCall(
  {
    region: 'us-central1',
    secrets: [remoSecret, remoCompanyIdSecret],
    runtime: 'nodejs18',
  },
  async (data, context) => {
    console.log('📝 addUserToRemoEvent – received data:', util.inspect(data.data || data, { depth: 3 }));

    const { eventId, userEmail } = data.data || data;
    
    if (!eventId) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing eventId');
    }
    
    if (!userEmail) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing userEmail');
    }

    // Call Remo API to add member to event
    // Docs: POST /v1/events/{eventId}/members
    // Remo API just needs email addresses and sends out email invites automatically
    const url = `https://live.remo.co/api/v1/events/${eventId}/members`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Token: ${remoSecret.value()}`,
      },
      body: JSON.stringify({
        emails: [userEmail],
        role: 'attendee'
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Remo add member error:', err);
      throw new functions.https.HttpsError('internal', 'Failed to add user to Remo event');
    }

    const result = await response.json();
    console.log('✅ Successfully added user to Remo event:', result);
    
    return { success: true };
  }
);

exports.getEventMembers = onCall(
  {
    region: 'us-central1',
    secrets: [remoSecret, remoCompanyIdSecret],
    runtime: 'nodejs18',
  },
  async (data, context) => {
    const eventId = data?.data?.eventId || data?.data?.eventID || data?.eventId || data?.eventID;
    if (!eventId) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing eventId');
    }

    const url = `https://live.remo.co/api/v1/events/${eventId}/attendees`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Token: ${remoSecret.value()}`,
        },
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Remo members fetch error:', errText);
        throw new functions.https.HttpsError('internal', 'Failed to fetch members');
      }
      
      const dataJson = await response.json();
      return dataJson; // full object with isSuccess, attendees, etc.
      
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new functions.https.HttpsError('deadline-exceeded', 'Remo API timeout');
      }
      throw error;
    }
  }
);

