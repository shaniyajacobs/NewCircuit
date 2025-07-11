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

exports.getRemoJoinUrl = onCall(
  {
    region: 'us-central1',
    secrets: [remoSecret, remoCompanyIdSecret],
  },
  async (data, context) => {
    // Log only the payload the client sent. data.data contains the body for v2 callable
    console.log('📝 getRemoJoinUrl – received data:', util.inspect(data.data || data, { depth: 3 }));

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

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        // Remo expects "Authorization: Token <key>" (note no extra colon after Token)
        Authorization: `Token ${remoSecret.value()}`,
      },
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Remo error:', err);
      throw new functions.https.HttpsError('internal', 'Remo API failed');
    }

    // Typical Remo payload includes "event_url" and/or "registration_url"
    const { event_url, registration_url } = await response.json();
    const joinUrl = registration_url || event_url;
    if (!joinUrl) {
      throw new functions.https.HttpsError('internal', 'No join URL returned');
    }

    return { joinUrl };          // <- sent back to the client
  }
);

