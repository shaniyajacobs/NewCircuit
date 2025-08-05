const functions = require("firebase-functions/v2");
const { onCall } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const Stripe = require("stripe");
const util = require('util');
const nodemailer = require('nodemailer');

const stripeSecret = defineSecret("STRIPE_SECRET");
const remoSecret = defineSecret('REMO_API_KEY');
const remoCompanyIdSecret = defineSecret('REMO_COMPANY_ID');
const emailUser = defineSecret('EMAIL_USER');
const emailPass = defineSecret('EMAIL_PASS');

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
    console.log('eventId', eventId);
    if (!eventId) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing eventId');
    }

    const url = new URL(`https://live.remo.co/api/v1/events/${eventId}/attendees`);
    url.searchParams.set('include', 'attendance');
    url.searchParams.set('role', 'attendee');

    try {
      console.log('Request to Remo API:', url.toString());
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Token: ${remoSecret.value()}`,
        },
        signal: AbortSignal.timeout(30000),
      });
      console.log('Remo API response status:', response.status);

      if (!response.ok) {
        const errText = await response.text();
        console.error('Remo members fetch error:', errText);
        throw new functions.https.HttpsError('internal', 'Failed to fetch members');
      }
      
      const responseData = await response.json();
      console.log('Remo API response:', responseData);

      if (!responseData.isSuccess || !responseData.attendees) {
        console.error('❌ Invalid Remo response structure:', responseData);
        throw new functions.https.HttpsError('internal', 'Invalid response from Remo API');
      }

      const attendees = responseData.attendees;
      console.log('📝 Attendees:', attendees);
      return attendees; // returns the list of hashes of the attendees

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new functions.https.HttpsError('deadline-exceeded', 'Remo API timeout');
      }
      throw error;
    }
  }
);

// 🔥 Callable to completely delete a user and all related Firestore traces
exports.deleteUser = onCall({
  region: 'us-central1',
  runtime: 'nodejs18',
}, async (data, context) => {
  const uid = data?.data?.userId || data?.userId;
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing userId');
  }

  const db = admin.firestore();
  const userRef = db.collection('users').doc(uid);

  try {
    // Fetch user doc to retrieve gender for signup count adjustments
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? userSnap.data() : {};
    const gender = (userData.gender || '').toLowerCase();

    // 1️⃣  Handle event sign-ups
    const signedUpEventsSnap = await userRef.collection('signedUpEvents').get();
    const eventUpdates = signedUpEventsSnap.docs.map(async (evDoc) => {
      const eventId = evDoc.id; // firestoreID of the event
      const eventRef = db.collection('events').doc(eventId);

      // Remove from event's signedUpUsers sub-collection
      await eventRef.collection('signedUpUsers').doc(uid).delete().catch(() => {});

      // Decrement gender-specific signup count
      let fieldName = null;
      if (gender === 'male') fieldName = 'menSignupCount';
      else if (gender === 'female') fieldName = 'womenSignupCount';

      if (fieldName) {
        await eventRef.update({
          [fieldName]: admin.firestore.FieldValue.increment(-1),
        }).catch(() => {});
      }

      // Delete the signedUpEvents document under the user
      await evDoc.ref.delete().catch(() => {});

      // Check waitlist for this event after user is removed
      try {
        const waitlistRef = eventRef.collection('waitlist');
        const waitlistSnap = await waitlistRef.get();
        
        // Find the first person on waitlist for this gender
        const waitlistEntries = waitlistSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(entry => entry.userGender?.toLowerCase() === gender)
          .sort((a, b) => a.joinTime?.toDate() - b.joinTime?.toDate()); // Sort by join time
        
        if (waitlistEntries.length > 0) {
          const firstInLine = waitlistEntries[0];
          
          // Remove from waitlist
          await waitlistRef.doc(firstInLine.id).delete();
          
          // Get event data for Remo integration
          const eventDoc = await eventRef.get();
          if (eventDoc.exists()) {
            const eventData = eventDoc.data();
            
            // Add user to signed up events
            const userToEnrollRef = db.collection('users').doc(firstInLine.userID);
            await userToEnrollRef.collection('signedUpEvents').doc(eventId).set({
              eventID: eventData.eventID,
              signUpTime: admin.firestore.FieldValue.serverTimestamp(),
              eventTitle: eventData.title || eventData.eventName,
              eventDate: eventData.date,
              eventTime: eventData.time,
              eventLocation: eventData.location,
              eventAgeRange: eventData.ageRange,
              eventType: eventData.eventType,
              fromWaitlist: true, // Mark that this signup came from waitlist
            });
            
            // Add user to event's signed up users
            await eventRef.collection('signedUpUsers').doc(firstInLine.userID).set({
              userID: firstInLine.userID,
              userName: firstInLine.userName || 'Waitlist User',
              userEmail: firstInLine.userEmail,
              userPhoneNumber: firstInLine.userPhoneNumber,
              userGender: firstInLine.userGender,
              userLocation: firstInLine.userLocation,
              signUpTime: admin.firestore.FieldValue.serverTimestamp(),
              fromWaitlist: true,
            });
            
            // Update event signup count (increment back since we decremented above)
            if (firstInLine.userGender?.toLowerCase() === 'male') {
              await eventRef.update({ menSignupCount: admin.firestore.FieldValue.increment(1) });
            } else if (firstInLine.userGender?.toLowerCase() === 'female') {
              await eventRef.update({ womenSignupCount: admin.firestore.FieldValue.increment(1) });
            }

            // Add user to Remo event
            try {
              const userProfileDoc = await userToEnrollRef.get();
              const userEmail = userProfileDoc.exists ? userProfileDoc.data().email : null;
              
              if (userEmail && eventData.eventID) {
                // Call Remo API to add user to event
                const url = `https://live.remo.co/api/v1/events/${eventData.eventID}/members`;
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
                  console.error('Failed to add user to Remo event:', await response.text());
                } else {
                  console.log(`Successfully added user ${firstInLine.userID} to Remo event ${eventData.eventID} from waitlist`);
                }
              } else {
                console.warn(`Missing email for user ${firstInLine.userID} or eventID for event ${eventId}`);
              }
            } catch (remoError) {
              console.error('Error adding user to Remo event:', remoError);
              // Don't fail the entire process if Remo fails
            }
          }
          
          console.log(`User ${firstInLine.userID} has been automatically enrolled in event ${eventId} from waitlist after account deletion`);
        }
      } catch (waitlistError) {
        console.error('Error checking waitlist during account deletion:', waitlistError);
        // Don't fail the entire deletion if waitlist check fails
      }
    });

    // 2️⃣  Remove connections (both sides)
    const connectionsSnap = await userRef.collection('connections').get();
    const connectionUpdates = connectionsSnap.docs.map(async (connDoc) => {
      const otherUid = connDoc.id;
      await db.collection('users').doc(otherUid).collection('connections').doc(uid).delete().catch(() => {});
      await connDoc.ref.delete().catch(() => {});
    });

    // 3️⃣  Remove admin role record if present
    const adminRoleDeletion = db.collection('adminUsers').doc(uid).delete().catch(() => {});

    // 4️⃣  Wait for all parallel deletions
    await Promise.all([...eventUpdates, ...connectionUpdates, adminRoleDeletion]);

    // 5️⃣  Finally, recursively delete the user document (clears remaining sub-collections)
    await admin.firestore().recursiveDelete(userRef).catch(() => {});

    // 6️⃣  Remove from Firebase Authentication
    await admin.auth().deleteUser(uid).catch(() => {});

    return { success: true };
  } catch (err) {
    console.error('❌ deleteUser error:', err);
    throw new functions.https.HttpsError('internal', 'Failed to fully delete user');
  }
});

// ⭐️ Contact form email sender
exports.sendContactEmail = onCall({
  region: 'us-central1',
  secrets: [emailUser, emailPass],
  runtime: 'nodejs18',
}, async (data, context) => {
  const { name, email, phone, message } = data?.data || data;

  if (!name || !email || !message) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser.value(),
      pass: emailPass.value(),
    },
  });

  const mailOptions = {
    from: `Circuit Website <${emailUser.value()}>`,
    to: 'michael.guerrero0704@gmail.com',
    subject: 'New Contact Form Submission',
    text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\n\nMessage:\n${message}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (err) {
    console.error('sendContactEmail error:', err);
    throw new functions.https.HttpsError('internal', 'Failed to send email');
  }
});

