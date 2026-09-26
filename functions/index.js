const functions = require("firebase-functions/v2");
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret, defineString } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { collection, query, where, getDocs, updateDoc } = require("firebase/firestore");
const Stripe = require("stripe");
const util = require('util');
const nodemailer = require('nodemailer');
const paypal = require('@paypal/checkout-server-sdk');
const twilio = require("twilio");

// ========================================================
// SECRETS
// ========================================================
const stripeSecret = defineSecret("STRIPE_SECRET");
const remoSecret = defineSecret('REMO_API_KEY');
const remoCompanyIdSecret = defineSecret('REMO_COMPANY_ID');
const emailUser = defineSecret('EMAIL_USER');
const emailPass = defineSecret('EMAIL_PASS');
const payPalClientId = defineSecret('PAYPAL_CLIENT_ID');
const payPalClientSecret = defineSecret('PAYPAL_SECRET');
const fbPixelId = defineSecret('FB_PIXEL_ID');
const twilioAccountSid = defineSecret("TWILIO_ACCOUNT_SID");
const twilioAuthToken = defineSecret("TWILIO_AUTH_TOKEN");
const twilioVerifyServiceSid = defineSecret("TWILIO_VERIFY_SERVICE_SID");
const twilioPhoneNumber = defineSecret("TWILIO_PHONE_NUMBER");
const klaviyoApiKey = defineSecret("KLAVIYO_API_KEY");
const klaviyoListId = defineSecret("KLAVIYO_LIST_ID");

// ========================================================
// PARAMS – Test Mode Toggle
// ========================================================
const testModeEnabled = defineString("TEST_MODE_ENABLED", {
  default: "false",
  description: "Set to 'true' to bypass Twilio OTP during testing",
});

admin.initializeApp();
// ========================================================
// CONFIG – Web app base URL for SMS links
// ========================================================
const WEB_APP_BASE_URL =
  process.env.WEB_APP_BASE_URL || "https://circuitspeeddating.com";

// ========================================================
// HELPER – Clear latestEventId if it matches the cancelled event
// ========================================================
async function clearLatestEventIdIfNeeded(userId, eventId) {
  try {
    const userRef = admin.firestore().collection('users').doc(userId);
    const userSnap = await userRef.get();
    if (userSnap.exists) {
      const userData = userSnap.data();
      if (userData.latestEventId === eventId) {
        await userRef.update({
          latestEventId: admin.firestore.FieldValue.delete()
        });
        console.log(` Cleared latestEventId for user ${userId} (was ${eventId})`);
      }
    }
  } catch (error) {
    console.error(`Error clearing latestEventId for user ${userId}:`, error);
  }
}
// ========================================================
// HELPER – Create Admin Notification
// ========================================================
async function createAdminNotification({ type, eventId, eventTitle, message, data = {} }) {
  try {
    const notificationRef = admin.firestore().collection('adminNotifications').doc();
    await notificationRef.set({
      id: notificationRef.id,
      type: type, // 'cancellation_promotion', 'expiry_promotion', 'claim_claimed', 'user_cancelled'
      eventId: eventId || null,
      eventTitle: eventTitle || 'Unknown Event',
      message: message || 'Admin notification',
      data: data,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(` Admin notification created: ${type} for event ${eventId}`);
  } catch (error) {
    console.error(" Failed to create admin notification:", error);
  }
}
// ========================================================
// HELPER – Trigger Waitlist Confirmation Email via Klaviyo
// ========================================================
async function triggerWaitlistConfirmationEmail({
  apiKey,
  email,
  eventTitle,
  position,
  eventDate,
  eventTime,
}) {
  if (!apiKey) {
    throw new Error("Klaviyo API key is missing");
  }

  if (!email || !eventTitle) {
    throw new Error("Email and event title are required");
  }

  const response = await fetch(
    "https://a.klaviyo.com/api/events",
    {
      method: "POST",
      headers: {
        Authorization: `Klaviyo-API-Key ${apiKey}`,
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
        revision: "2026-07-15",
      },
      body: JSON.stringify({
        data: {
          type: "event",
          attributes: {
            metric: {
              data: {
                type: "metric",
                attributes: {
                  name: "Joined Waitlist",
                },
              },
            },

            profile: {
              data: {
                type: "profile",
                attributes: {
                  email: email,
                },
              },
            },

            properties: {
              waitlist_event: eventTitle,
              waitlist_position: position || 1,
              waitlist_date: eventDate || "",
              waitlist_time: eventTime || "",
              source: "Circuit_Waitlist",
            },
          },
        },
      }),
    }
  );

  const responseText = await response.text();

  if (!response.ok) {
    console.error(
      " Klaviyo waitlist confirmation error:",
      responseText
    );

    throw new Error(
      `Klaviyo request failed: ${responseText}`
    );
  }

  console.log(
    ` "Joined Waitlist" event sent to Klaviyo for ${email}`
  );

  return {
    success: true,
  };
}

// Helper function to create PayPal client
function getPayPalClient() {
  const environment = new paypal.core.LiveEnvironment(
    payPalClientId.value(),
    payPalClientSecret.value()
  );
  return new paypal.core.PayPalHttpClient(environment);
}
// ========================================================
// HELPER – Generate Round Assignments
// ========================================================
function generateRoundAssignments(attendees, roundDurationSeconds, breakDurationSeconds, eventStartTime) {
  // attendees: array of { id, gender }
  const men = attendees.filter(a => a.gender === 'Male');
  const women = attendees.filter(a => a.gender === 'Female');
  
  // We'll pair men with women, rotating.
  const numRounds = Math.min(men.length, women.length);
  if (numRounds === 0) return { roundStartTimes: [], assignments: {} };

  // Create a round-robin schedule: men fixed, women rotated
  const schedule = [];
  for (let round = 0; round < numRounds; round++) {
    const roundPairs = [];
    for (let i = 0; i < men.length; i++) {
      const womanIndex = (i + round) % women.length;
      roundPairs.push({ man: men[i].id, woman: women[womanIndex].id });
    }
    schedule.push(roundPairs);
  }

  // Build assignment map: attendeeId -> { round: partnerId }
  const assignments = {};
  attendees.forEach(a => { assignments[a.id] = {}; });

  schedule.forEach((roundPairs, roundIndex) => {
    roundPairs.forEach(pair => {
      assignments[pair.man][`round${roundIndex+1}`] = pair.woman;
      assignments[pair.woman][`round${roundIndex+1}`] = pair.man;
    });
  });

  // Calculate round start times
  const roundStartTimes = [];
  let currentTime = eventStartTime;
  for (let i = 0; i < numRounds; i++) {
    roundStartTimes.push(currentTime);
    currentTime += (roundDurationSeconds + breakDurationSeconds) * 1000;
  }

  return { roundStartTimes, assignments };
}
// ========================================================
// HELPER – Create mutual connections using phone numbers
// ========================================================
async function createMutualConnections(matches, eventId, db) {
  const batch = db.batch();
  let connectionsCreated = 0;

  for (const match of matches) {
    const { user1: attendee1Id, user2: attendee2Id } = match;

    // Get attendee data to get the phone numbers (userId field)
    const attendee1Ref = db.collection('events').doc(eventId).collection('signedUpUsers').doc(attendee1Id);
    const attendee2Ref = db.collection('events').doc(eventId).collection('signedUpUsers').doc(attendee2Id);
    const [attendee1Snap, attendee2Snap] = await Promise.all([attendee1Ref.get(), attendee2Ref.get()]);

    if (!attendee1Snap.exists || !attendee2Snap.exists) {
      console.warn(`Skipping match ${attendee1Id}-${attendee2Id}: attendee data missing`);
      continue;
    }

    const attendee1Data = attendee1Snap.data();
    const attendee2Data = attendee2Snap.data();

    //  Use phone number as the user identifier (stored as userId)
    const phone1 = attendee1Data.userId || attendee1Data.phoneNumber;
    const phone2 = attendee2Data.userId || attendee2Data.phoneNumber;

    if (!phone1 || !phone2) {
      console.warn(`Skipping match: missing phone number for ${attendee1Id} or ${attendee2Id}`);
      continue;
    }

    // Create connections under users/{phoneNumber}/connections/{otherPhoneNumber}
    // First, ensure the user documents exist (they should, but we can create them if needed)
    const user1Ref = db.collection('users').doc(phone1);
    const user2Ref = db.collection('users').doc(phone2);

    // Create connection documents
    const conn1Ref = user1Ref.collection('connections').doc(phone2);
    const conn2Ref = user2Ref.collection('connections').doc(phone1);

    batch.set(conn1Ref, {
      userId: phone2,
      attendeeId: attendee2Id,
      eventId: eventId,
      isSpark: true,
      status: 'mutual',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    batch.set(conn2Ref, {
      userId: phone1,
      attendeeId: attendee1Id,
      eventId: eventId,
      isSpark: true,
      status: 'mutual',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    connectionsCreated++;
  }

  if (connectionsCreated > 0) {
    await batch.commit();
    console.log(`Created ${connectionsCreated} mutual connections using phone numbers`);
  }
  return connectionsCreated;
}
// ========================================================
// STRIPE PAYMENT INTENT
// ========================================================
exports.createPaymentIntent = onCall(
  {
    region: "us-central1",
    secrets: [stripeSecret],
    runtime: 'nodejs20',
  },
  async (data, context) => {   
    const amount = Number(data?.data?.amount);
    console.log(" Payload:", data);
    console.log(" Parsed amount:", amount);

    if (isNaN(amount) || amount <= 0) {
      console.error(" Invalid amount passed to createPaymentIntent:", amount);
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

      console.log(" PaymentIntent ID:", paymentIntent.id);
      console.log(" Client Secret:", paymentIntent.client_secret);

      return {
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id,
      };
    } catch (err) {
      console.error(" Stripe error:", err);
      throw new functions.https.HttpsError("internal", "Failed to create PaymentIntent");
    }
  }
);

// ========================================================
// REMO EVENT DATA
// ========================================================
exports.getEventData = onCall(
  {
    region: 'us-central1',
    secrets: [remoSecret, remoCompanyIdSecret],
    runtime: 'nodejs20',
  },
  async (data, context) => {
    console.log('📝 getEventData – received data:', util.inspect(data.data || data, { depth: 3 }));

    const eventId = data?.data?.eventId || data?.data?.eventID || data?.eventId || data?.eventID;
    if (!eventId) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing eventId');
    }

    const url = new URL(`https://live.remo.co/api/v1/events/${eventId}`);
    url.searchParams.set('include', 'registrationQuestions');
    url.searchParams.set('companyId', remoCompanyIdSecret.value());

    try {
      console.log('🔄 Making request to Remo API:', url.toString());
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Token: ${remoSecret.value()}`,
        },
        signal: AbortSignal.timeout(30000),
      });
      console.log('📝 Remo API response status:', response.status);

    if (!response.ok) {
      const err = await response.text();
      console.error('Remo error:', err);
      
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

    const responseData = await response.json();
    console.log('📝 Remo API response:', responseData);
    
    if (!responseData.isSuccess || !responseData.event) {
      console.error(' Invalid Remo response structure:', responseData);
      throw new functions.https.HttpsError('internal', 'Invalid response from Remo API');
    }
    
    const event = responseData.event;
    console.log('📝 Event data:', event);
    
    const eventCode = event.code;
    if (!eventCode) {
      console.error(' No event code found in Remo response:', event);
      throw new functions.https.HttpsError('internal', 'No event code returned from Remo');
    }
    
    return { event };
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Remo API timeout:', error);
      throw new functions.https.HttpsError('deadline-exceeded', 'Remo API timeout - please try again');
    }
    throw error;
  }
  }
);

// ========================================================
// ADD USER TO REMO EVENT
// ========================================================
exports.addUserToRemoEvent = onCall(
  {
    region: 'us-central1',
    secrets: [remoSecret, remoCompanyIdSecret],
    runtime: 'nodejs20',
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
    console.log(' Successfully added user to Remo event:', result);
    
    return { success: true };
  }
);

// ========================================================
// GET EVENT MEMBERS FROM REMO
// ========================================================
exports.getEventMembers = onCall(
  {
    region: 'us-central1',
    secrets: [remoSecret, remoCompanyIdSecret],
    runtime: 'nodejs20',
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
        console.error(' Invalid Remo response structure:', responseData);
        throw new functions.https.HttpsError('internal', 'Invalid response from Remo API');
      }

      const attendees = responseData.attendees;
      console.log('📝 Attendees:', attendees);
      return attendees;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new functions.https.HttpsError('deadline-exceeded', 'Remo API timeout');
      }
      throw error;
    }
  }
);

// ========================================================
// DELETE USER
// ========================================================
exports.deleteUser = onCall({
  region: 'us-central1',
  runtime: 'nodejs20',
}, async (data, context) => {
  const uid = data?.data?.userId || data?.userId;
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing userId');
  }

  const db = admin.firestore();
  const userRef = db.collection('users').doc(uid);

  try {
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? userSnap.data() : {};

    const signedUpEventsSnap = await userRef.collection('signedUpEvents').get();
    const eventOps = signedUpEventsSnap.docs.map(async (evDoc) => {
      const eventId = evDoc.id;
      const eventRef = db.collection('events').doc(eventId);
      await eventRef.collection('signedUpUsers').doc(uid).delete().catch(() => {});
      await evDoc.ref.delete().catch(() => {});
    });

    const connectionsSnap = await userRef.collection('connections').get();
    const connectionUpdates = connectionsSnap.docs.map(async (connDoc) => {
      const otherUid = connDoc.id;
      await db.collection('users').doc(otherUid).collection('connections').doc(uid).delete().catch(() => {});
      await connDoc.ref.delete().catch(() => {});
    });

    const adminRoleDeletion = db.collection('adminUsers').doc(uid).delete().catch(() => {});

    await Promise.all([...eventOps, ...connectionUpdates, adminRoleDeletion]);

    await admin.firestore().recursiveDelete(userRef).catch(() => {});

    await admin.auth().deleteUser(uid).catch(() => {});

    return { success: true };
  } catch (err) {
    console.error(' deleteUser error:', err);
    throw new functions.https.HttpsError('internal', 'Failed to fully delete user');
  }
});

// ========================================================
// CONTACT FORM EMAIL
// ========================================================
exports.sendContactEmail = onCall({
  region: 'us-central1',
  secrets: [emailUser, emailPass],
  runtime: 'nodejs20',
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

// ========================================================
// PAYPAL ORDERS
// ========================================================
exports.createPayPalOrder = onCall(
  {
    region: "us-central1",
    runtime: 'nodejs20',
    secrets: [payPalClientId, payPalClientSecret],
  },
  async (data, context) => {   
    try {
      const amount = Number(data?.data?.amount);
      if (!amount) {
        throw new functions.https.HttpsError('internal', 'Missing amount');
      }

      const client = getPayPalClient();

      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: "CAPTURE",
        purchase_units: [{ amount: { currency_code: "USD", value: amount } }],
      });

      const order = await client.execute(request);
      return { id: order.result.id };
    }catch(error){
      throw new functions.https.HttpsError('internal', 'Some issue in payment initialization');
    }
  });
   
exports.capturePayPalOrder = onCall(
  {
    region: "us-central1",
    runtime: 'nodejs20',
    secrets: [payPalClientId, payPalClientSecret],
  },
  async (data, context) => {
    try{
      const orderId = data?.data.orderId;
      if (!orderId) {
        throw new functions.https.HttpsError('internal', 'Missing orderId');
      }

      const client = getPayPalClient();
      
      const request = new paypal.orders.OrdersCaptureRequest(orderId);
      request.requestBody({});

      const capture = await client.execute(request);

      if (capture?.result?.purchase_units?.[0]?.payments?.captures?.[0]?.status !== "COMPLETED") {
        throw new functions.https.HttpsError('internal', 'Payment was declined or failed.');
      }

      return capture.result;
    }catch(error){
      throw new functions.https.HttpsError('internal', 'Failed to capture order');
    }
  });   

exports.paymentClientId = onCall(
  {
    region: "us-central1",
    secrets: [payPalClientId],
    runtime: 'nodejs20',
  },
  (data, context) => {
    return { clientId: payPalClientId.value() }
  }
);

// ========================================================
// FACEBOOK PIXEL
// ========================================================
exports.getFbPixelId = onCall(
  {
    region: "us-central1",
    secrets: [fbPixelId],
    runtime: 'nodejs20',
  },
  () => ({ pixelId: fbPixelId.value() })
);

exports.markPixelTracked = onCall(
  {
    region: "us-central1",
    runtime: 'nodejs20',
  },
  async (data, context) => {
    const { paymentIntentId } = data.data;
    if (!paymentIntentId) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing paymentIntentId');
    }

    const auth = context.auth;
    if (!auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const paymentsRef = admin.firestore().collection('users').doc(context.auth.uid).collection('payments');
    const q = query(paymentsRef, where('paymentIntentId', '==', paymentIntentId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new functions.https.HttpsError('not-found', 'Payment not found');
    }

    const paymentDoc = snapshot.docs[0];
    await updateDoc(paymentDoc.ref, {
      pixelTracked: true,
      pixelTrackedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
  }
);
//======================================================== 
// TWILIO OTP 
// ======================================================== 
exports.sendOTP = onCall( 
  { 
    region: "us-central1", 
    runtime: "nodejs20", 
    secrets: [ 
      twilioAccountSid, 
      twilioAuthToken, 
      twilioVerifyServiceSid, 
    ], 
  }, 
  async (request) => { 
    const phoneNumber = request.data.phoneNumber; 
 
    if (!phoneNumber) { 
      throw new functions.https.HttpsError( 
        "invalid-argument", 
        "Phone number is required." 
      ); 
    } 
 
    const client = twilio( 
      twilioAccountSid.value(), 
      twilioAuthToken.value() 
    ); 
 
    try { 
      const verification = await client.verify.v2 
        .services(twilioVerifyServiceSid.value()) 
        .verifications.create({ 
          to: phoneNumber, 
          channel: "sms", 
        }); 
 
      return { 
        success: true, 
        status: verification.status, 
      }; 
    } catch (error) { 
      console.error(error); 
 
      throw new functions.https.HttpsError( 
        "internal", 
        error.message 
      ); 
    } 
  } 
); 
exports.loginWithPhone = onCall(
  {
    region: "us-central1",
    runtime: "nodejs20",
    invoker: "public",
    secrets: [
      twilioAccountSid,
      twilioAuthToken,
      twilioVerifyServiceSid,
    ],
  },
  async (request) => {
    const { phoneNumber, code } = request.data || {};

    // --------------------------------------------------
    // 1. Validate inputs
    // --------------------------------------------------
    if (!phoneNumber || typeof phoneNumber !== "string") {
      throw new HttpsError("invalid-argument", "Phone number is required.");
    }
    if (!code || typeof code !== "string") {
      throw new HttpsError("invalid-argument", "Verification code is required.");
    }

    // --------------------------------------------------
    // 2. Normalize phone to E.164
    // --------------------------------------------------
    let normalizedPhone = phoneNumber.replace(/[\s\-().]/g, "");
    if (!normalizedPhone.startsWith("+")) {
      normalizedPhone = "+" + normalizedPhone;
    }
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      throw new HttpsError("invalid-argument", "Invalid phone number format.");
    }

    // --------------------------------------------------
    // 3. Verify OTP via Twilio Verify
    // --------------------------------------------------
    const client = twilio(
      twilioAccountSid.value(),
      twilioAuthToken.value()
    );

    let verification;
    try {
      verification = await client.verify.v2
        .services(twilioVerifyServiceSid.value())
        .verificationChecks.create({
          to: normalizedPhone,
          code,
        });
    } catch (error) {
      console.error("❌ loginWithPhone: Twilio verify error:", error);
      throw new HttpsError("internal", "Unable to verify code. Please try again.");
    }

    if (verification.status !== "approved") {
      return {
        success: false,
        reason: "invalid_code",
        status: verification.status,
      };
    }

    // --------------------------------------------------
    // 4. Try Firebase Auth lookup first
    // --------------------------------------------------
    let authUser = null;
    try {
      authUser = await admin.auth().getUserByPhoneNumber(normalizedPhone);
      console.log(` loginWithPhone: found Auth user for ${normalizedPhone}`);
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        console.log(`ℹ️ loginWithPhone: no Auth user for ${normalizedPhone}, checking Firestore`);
        authUser = null;
      } else {
        console.error("❌ loginWithPhone: getUserByPhoneNumber error:", error);
        throw new HttpsError("internal", "Unable to look up account.");
      }
    }

    // --------------------------------------------------
    // 5. If not in Auth, check Firestore users/{phoneNumber}
    //    (registered guest – they used phone as doc ID)
    // --------------------------------------------------
    let firestoreUserData = null;
    let firestoreUserPhoneKey = null;

    if (!authUser) {
      // Try both formats: +26657142533 and 26657142533
      const phoneVariants = [
        normalizedPhone,                       // +26657142533
        normalizedPhone.replace(/^\+/, ''),    // 26657142533
      ];

      for (const phoneKey of phoneVariants) {
        try {
          const userDoc = await admin.firestore()
            .collection("users")
            .doc(phoneKey)
            .get();
          if (userDoc.exists) {
            firestoreUserData = userDoc.data();
            firestoreUserPhoneKey = phoneKey;
            console.log(` loginWithPhone: found Firestore user for ${phoneKey}`);
            break;
          }
        } catch (err) {
          console.error(`Error reading users/${phoneKey}:`, err);
        }
      }

      if (!firestoreUserData) {
        // Neither Auth nor Firestore → genuine no-account
        console.log(`ℹ️ loginWithPhone: no account for ${normalizedPhone}`);
        return {
          success: false,
          reason: "no_account",
        };
      }

      // --------------------------------------------------
      // 6. Create Firebase Auth user for this guest
      //    Uses phone as identifier, links phone, no password.
      // --------------------------------------------------
      try {
        const newAuthUser = await admin.auth().createUser({
          phoneNumber: normalizedPhone,
          email: firestoreUserData.email || undefined,
          displayName: firestoreUserData.displayName
            || (firestoreUserData.firstName
                ? `${firestoreUserData.firstName} ${firestoreUserData.lastName || ''}`.trim()
                : undefined),
        });
        authUser = newAuthUser;
        console.log(` loginWithPhone: created Auth user ${authUser.uid} for guest ${firestoreUserPhoneKey}`);

        // Optionally copy Firestore data to users/{uid} so dashboard works by uid too.
        // For now, dashboard uses guestUid = phoneNumber, so we don't strictly need this.
      } catch (createError) {
        console.error(" loginWithPhone: createUser error:", createError);
        throw new HttpsError("internal", "Unable to create account for this phone.");
      }
    }

    const uid = authUser.uid;

    // --------------------------------------------------
    // 7. Server-side admin check
    // --------------------------------------------------
    let isAdmin = false;
    try {
      const adminDoc = await admin.firestore()
        .collection("adminUsers")
        .doc(uid)
        .get();
      isAdmin = adminDoc.exists;
    } catch (error) {
      console.error(" loginWithPhone: admin lookup error:", error);
      isAdmin = false;
    }

    // --------------------------------------------------
    // 8. Check if user has signed-up events
    //    Prefer Firestore (phone key), fall back to Auth uid.
    // --------------------------------------------------
    let hasEvents = false;
    try {
      const phoneKeyForEvents = firestoreUserPhoneKey || uid;
      const signedUpSnap = await admin.firestore()
        .collection("users")
        .doc(phoneKeyForEvents)
        .collection("signedUpEvents")
        .limit(1)
        .get();
      hasEvents = !signedUpSnap.empty;

      // Also check under Auth uid as a fallback
      if (!hasEvents && phoneKeyForEvents !== uid) {
        const altSnap = await admin.firestore()
          .collection("users")
          .doc(uid)
          .collection("signedUpEvents")
          .limit(1)
          .get();
        hasEvents = !altSnap.empty;
      }
    } catch (error) {
      console.error(" loginWithPhone: signedUpEvents lookup error:", error);
      hasEvents = false;
    }

    // --------------------------------------------------
    // 9. Mint custom token
    // --------------------------------------------------
    let customToken;
    try {
      customToken = await admin.auth().createCustomToken(uid);
    } catch (error) {
      console.error(" loginWithPhone: createCustomToken error:", error);
      throw new HttpsError("internal", "Unable to complete sign-in.");
    }

    console.log(` loginWithPhone: issued token uid=${uid} isAdmin=${isAdmin} hasEvents=${hasEvents}`);

    return {
      success: true,
      customToken,
      isAdmin,
      hasEvents,
      uid,
      guestUid: firestoreUserPhoneKey || normalizedPhone, // pass phone if we want to reuse guest flow
    };
  }
);

//======================================================== 
// TWILIO OTP 
// ======================================================== 
  exports.verifyOTP = onCall(                                                                                                                                                                          
  {
    region: "us-central1",
    runtime: "nodejs20",
    secrets: [
      twilioAccountSid,
      twilioAuthToken,
      twilioVerifyServiceSid,
    ],
  },
  async (request) => {
    const { phoneNumber, code } = request.data;

    if (!phoneNumber || !code) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Phone number and code are required."
      );
    }

    const client = twilio(
      twilioAccountSid.value(),
      twilioAuthToken.value()
    );

    try {
      const verification = await client.verify.v2
        .services(twilioVerifyServiceSid.value())
        .verificationChecks.create({
          to: phoneNumber,
          code,
        });

      return {
        success: verification.status === "approved",
        status: verification.status,
      };
    } catch (error) {
      console.error(error);

      throw new functions.https.HttpsError(
        "internal",
        error.message
      );
    }
  }
);
       
// ========================================================
// TERMS SMS
// ========================================================
exports.sendTermsSMS = onCall(
  {
    region: "us-central1",
    runtime: "nodejs20",
    secrets: [
      twilioAccountSid,
      twilioAuthToken,
      twilioPhoneNumber,
    ],
  },
  async (request) => {
    const { phoneNumber } = request.data;

    if (!phoneNumber) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Phone number is required."
      );
    }

    const client = twilio(
      twilioAccountSid.value(),
      twilioAuthToken.value()
    );

    const message = `Welcome to Circuit! Please review our Terms of Service: https://circuitspeeddating.com/terms-of-service and Privacy Policy: https://circuitspeeddating.com/privacy-policy`;

    try {
      await client.messages.create({
        body: message,
        to: phoneNumber,
        from: twilioPhoneNumber.value(),
      });
      return { success: true };
    } catch (error) {
      console.error('Terms SMS error:', error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to send Terms SMS"
      );
    }
  }
);

// ========================================================
// PURCHASE CONFIRMATION SMS
// ========================================================
exports.sendPurchaseConfirmation = onCall(
  {
    region: "us-central1",
    runtime: "nodejs20",
    secrets: [
      twilioAccountSid,
      twilioAuthToken,
      twilioPhoneNumber,
    ],
  },
  async (request) => {
    const { phoneNumber, eventTitle, eventDate, venue, city, ticketType } = request.data;

    if (!phoneNumber || !eventTitle) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields"
      );
    }

    const client = twilio(
      twilioAccountSid.value(),
      twilioAuthToken.value()
    );

    const message = `⚡You're registered for ${eventTitle}! 📅 ${eventDate || 'TBD'} at ${venue || 'TBD'}, ${city || ''}. Ticket: ${ticketType || 'General'}'s Ticket. View your dashboard: https://circuitspeeddating.com/dashboard`;

    try {
      await client.messages.create({
        body: message,
        to: phoneNumber,
        from: twilioPhoneNumber.value(),
      });
      return { success: true };
    } catch (error) {
      console.error('Purchase SMS error:', error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to send purchase confirmation SMS"
      );
    }
  }
);
 
// ========================================================
// PAYPAL WEBHOOK
// ========================================================
exports.payPalWebhook = onRequest(
  {
    region: "us-central1",
    runtime: "nodejs20",
    secrets: [payPalClientId, payPalClientSecret],
    maxInstances: 10,
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    try {
      const { event_type, resource } = req.body;
      console.log('📝 PayPal Webhook received:', event_type);

      if (event_type === 'PAYMENT.CAPTURE.COMPLETED' || 
          event_type === 'CHECKOUT.ORDER.APPROVED') {
        
        const orderId = resource.id || resource.order_id;
        const db = admin.firestore();
        let found = false;

        const eventsSnapshot = await db.collection('events').get();
        for (const eventDoc of eventsSnapshot.docs) {
          const attendeesRef = eventDoc.ref.collection('attendees');
          const q = await attendeesRef.where('paymentId', '==', orderId).get();
          
          if (!q.empty) {
            const attendeeDoc = q.docs[0];
            await attendeeDoc.ref.update({
              paymentStatus: 'completed',
              webhookReceived: true,
              webhookReceivedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            found = true;
            break;
          }
        }

        if (!found) {
          console.log(' No matching attendee found for order:', orderId);
        }

        return res.status(200).json({ received: true });
      }

      return res.status(200).json({ received: true });

    } catch (error) {
      console.error(' PayPal webhook error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);
// ========================================================
// WAITLIST – Join Waitlist (No Login Required)
// ========================================================
exports.joinWaitlist = onCall(
  {
    region: "us-central1",
    runtime: "nodejs20",
    secrets: [klaviyoApiKey],
  },

  async (request) => {
    const {
      eventId,
      gender,
      email,
      phoneNumber,
    } = request.data || {};

    // ==================================================
    // 1. NORMALIZE GENDER
    // ==================================================
    let normalizedGender = gender;
    if (normalizedGender === "Women" || normalizedGender === "Woman" || normalizedGender === "women") {
      normalizedGender = "Female";
    } else if (normalizedGender === "Men" || normalizedGender === "Man" || normalizedGender === "men") {
      normalizedGender = "Male";
    }

    // ==================================================
    // 2. VALIDATE INPUT
    // ==================================================
    if (!eventId) {
      throw new HttpsError(
        "invalid-argument",
        "Event ID is required."
      );
    }

    if (!gender) {
      throw new HttpsError(
        "invalid-argument",
        "Gender is required."
      );
    }

    if (!email || typeof email !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "Email address is required."
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (
      !normalizedEmail.includes("@") ||
      !normalizedEmail.includes(".")
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Please enter a valid email address."
      );
    }

    if (!phoneNumber || typeof phoneNumber !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "Phone number is required."
      );
    }

    let normalizedPhone = phoneNumber.replace(/[\s\-()]/g, '');
    if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = '+' + normalizedPhone;
    }

    if (normalizedPhone.length < 10) {
      throw new HttpsError(
        "invalid-argument",
        "Please enter a valid phone number (10+ digits)."
      );
    }

    const db = admin.firestore();
    const eventRef = db.collection("events").doc(eventId);
    const emailKey = normalizedEmail
      .replace(/[^a-zA-Z0-9]/g, "_")
      .toLowerCase();
    const waitlistRef = eventRef
      .collection("waitlist")
      .doc(emailKey);

    try {
      // ==================================================
      // 3. TRANSACTION
      // ==================================================
      const result = await db.runTransaction(
        async (transaction) => {
          const eventSnap =
            await transaction.get(eventRef);

          if (!eventSnap.exists) {
            throw new HttpsError(
              "not-found",
              "The event does not exist."
            );
          }

          const eventData = eventSnap.data();
          const existingSnap =
            await transaction.get(waitlistRef);

          if (existingSnap.exists) {
            const existingData =
              existingSnap.data();

            if (
              existingData.status === "waiting" ||
              existingData.status === "promoted"
            ) {
              throw new HttpsError(
                "already-exists",
                "This email is already on the waitlist for this event."
              );
            }
          }

          // ✅ Store normalized gender
          transaction.set(
            waitlistRef,
            {
              email: normalizedEmail,
              phoneNumber: normalizedPhone,
              gender: normalizedGender, // ← "Female" or "Male"
              status: "waiting",
              joinedAt:
                admin.firestore.FieldValue.serverTimestamp(),
              reminderSent: false,
            },
            { merge: true }
          );

          //  Use normalized gender for counter
          const countField =
            normalizedGender === "Female"
              ? "womenWaitlistCount"
              : "menWaitlistCount";

          transaction.update(
            eventRef,
            {
              [countField]:
                admin.firestore.FieldValue.increment(1),
            }
          );

          return {
            eventData: eventData,
          };
        }
      );

      // ==================================================
      // 4. CALCULATE QUEUE POSITION
      // ==================================================
      const currentQueueSnap =
        await eventRef
          .collection("waitlist")
          .where("gender", "==", normalizedGender)
          .where("status", "==", "waiting")
          .orderBy("joinedAt", "asc")
          .get();

      let currentPosition = 0;
      let index = 1;

      currentQueueSnap.forEach((doc) => {
        const data = doc.data();
        if (data.email === normalizedEmail) {
          currentPosition = index;
        }
        index++;
      });

      if (currentPosition === 0) {
        currentPosition = index;
      }

      // ==================================================
      // 5. KLAVIYO – CREATE PROFILE
      // ==================================================
      const apiKey = klaviyoApiKey.value().trim();
      const eventData = result.eventData;
      const waitlistListId = "TTsAiu";

      // Create Klaviyo profile
      const profileResponse =
        await fetch(
          "https://a.klaviyo.com/api/profiles",
          {
            method: "POST",
            headers: {
              Authorization:
                `Klaviyo-API-Key ${apiKey}`,
              "Content-Type":
                "application/vnd.api+json",
              Accept:
                "application/vnd.api+json",
              revision:
                "2026-07-15",
            },
            body: JSON.stringify({
              data: {
                type: "profile",
                attributes: {
                  email: normalizedEmail,
                  properties: {
                    source:
                      "Circuit_Waitlist",
                    waitlist_event:
                      eventData.title ||
                      "Circuit Event",
                    waitlist_event_id:
                      eventId,
                    waitlist_position:
                      currentPosition,
                    waitlist_gender:
                      normalizedGender,
                    waitlist_status:
                      "waiting",
                    phone_number:
                      normalizedPhone,
                  },
                },
              },
            }),
          }
        );

      const profileText =
        await profileResponse.text();

      let profileResult = null;
      try {
        profileResult = JSON.parse(profileText);
      } catch {
        profileResult = null;
      }

      let profileId = null;

      if (profileResponse.ok) {
        profileId =
          profileResult?.data?.id;
        console.log(
          ` Klaviyo profile created for ${normalizedEmail}`
        );
      } else if (
        profileResponse.status === 409
      ) {
        profileId =
          profileResult
            ?.errors?.[0]
            ?.meta
            ?.duplicate_profile_id;
        console.log(
          `ℹ️ Klaviyo profile already exists for ${normalizedEmail}`
        );
      } else {
        console.error(
          " Klaviyo profile error:",
          profileText
        );
      }

      // ==================================================
      // 6. ADD PROFILE TO WAITLIST LIST
      // ==================================================
      if (profileId) {
        const listResponse =
          await fetch(
            `https://a.klaviyo.com/api/lists/${waitlistListId}/relationships/profiles`,
            {
              method: "POST",
              headers: {
                Authorization:
                  `Klaviyo-API-Key ${apiKey}`,
                "Content-Type":
                  "application/vnd.api+json",
                Accept:
                  "application/vnd.api+json",
                revision:
                  "2026-07-15",
              },
              body: JSON.stringify({
                data: [
                  {
                    type: "profile",
                    id: profileId,
                  },
                ],
              }),
            }
          );

        const listText =
          await listResponse.text();

        if (!listResponse.ok) {
          console.error(
            " Failed to add profile to Circuit – Event Waitlist:",
            listText
          );
        } else {
          console.log(
            ` ${normalizedEmail} added to Circuit – Event Waitlist`
          );
        }
      }

      // ==================================================
      // 7. SEND "JOINED WAITLIST" EVENT TO KLAVIYO
      // ==================================================
      const eventResponse =
        await fetch(
          "https://a.klaviyo.com/api/events",
          {
            method: "POST",
            headers: {
              Authorization:
                `Klaviyo-API-Key ${apiKey}`,
              "Content-Type":
                "application/vnd.api+json",
              Accept:
                "application/vnd.api+json",
              revision:
                "2026-07-15",
            },
            body: JSON.stringify({
              data: {
                type: "event",
                attributes: {
                  metric: {
                    data: {
                      type: "metric",
                      attributes: {
                        name:
                          "Joined Waitlist",
                      },
                    },
                  },
                  profile: {
                    data: {
                      type: "profile",
                      attributes: {
                        email:
                          normalizedEmail,
                      },
                    },
                  },
                  properties: {
                    event_title:
                      eventData.title ||
                      "Circuit Event",
                    event_id:
                      eventId,
                    waitlist_position:
                      currentPosition,
                    gender:
                      normalizedGender,
                    event_date:
                      eventData.date ||
                      eventData.startTime ||
                      "",
                    event_time:
                      eventData.time ||
                      "",
                    phone_number:
                      normalizedPhone,
                    source:
                      "Circuit_Waitlist",
                      // Include phone in event properties
                    phone_number: normalizedPhone,
                  },
                },
              },
            }),
          }
        );

      const eventText =
        await eventResponse.text();

      if (!eventResponse.ok) {
        console.error(
          " Klaviyo waitlist event error:",
          eventText
        );
      } else {
        console.log(
          ` "Joined Waitlist" event sent to Klaviyo for ${normalizedEmail}`
        );
      }

      // ==================================================
      // 8. SUCCESS
      // ==================================================
      return {
        success: true,
        position: currentPosition,
        email: normalizedEmail,
        message: `You have joined the waitlist at position #${currentPosition}.`,
      };

    } catch (error) {
      console.error(
        "Join waitlist error:",
        error
      );

      if (
        error instanceof HttpsError
      ) {
        throw error;
      }

      throw new HttpsError(
        "internal",
        "Unable to join the waitlist. Please try again."
      );
    }
  }
);
// ========================================================
// WAITLIST – Leave Waitlist
// ========================================================
exports.leaveWaitlist = onCall(
  {
    region: "us-central1",
    runtime: "nodejs20",
  },

  async (request) => {
    // Destructure eventId and email from request.data
    const { eventId, email } = request.data || {};

    if (!eventId) {
      throw new HttpsError(
        "invalid-argument",
        "Event ID required."
      );
    }

    if (!email || typeof email !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "Email address required."
      );
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const emailKey =
      normalizedEmail
        .replace(/[^a-zA-Z0-9]/g, "_")
        .toLowerCase();

    const db =
      admin.firestore();

    const eventRef =
      db.collection("events").doc(eventId);

    const waitlistRef =
      eventRef
        .collection("waitlist")
        .doc(emailKey);

    try {

      // --------------------------------------------------
      // Find waitlist entry
      // --------------------------------------------------

      const docSnap =
        await waitlistRef.get();

      if (!docSnap.exists) {

        throw new HttpsError(
          "not-found",
          "This email is not on the waitlist."
        );
      }

      const data =
        docSnap.data();

      // --------------------------------------------------
      // Don't allow leaving after promotion
      // --------------------------------------------------

      if (
        data.status === "promoted"
      ) {

        throw new HttpsError(
          "failed-precondition",
          "This waitlist spot has already been offered to you."
        );
      }

      const gender =
        data.gender;

      // --------------------------------------------------
      // Delete waitlist entry
      // --------------------------------------------------

      await waitlistRef.delete();

      // --------------------------------------------------
      // Update counter
      // --------------------------------------------------

      const countField =
        gender === "Female"
          ? "womenWaitlistCount"
          : "menWaitlistCount";

      await eventRef.update({
        [countField]:
          admin.firestore.FieldValue.increment(-1),
      });

      console.log(
        ` ${normalizedEmail} removed from waitlist for ${eventId}`
      );

      return {
        success: true,
        email: normalizedEmail,
      };

    } catch (error) {

      console.error(
        " Leave waitlist error:",
        error
      );

      if (
        error instanceof HttpsError
      ) {
        throw error;
      }

      throw new HttpsError(
        "internal",
        "Unable to leave the waitlist."
      );
    }
  }
);

// ========================================================
// WAITLIST – Get User's Position (EMAIL + EVENT)
// ========================================================
exports.getWaitlistPosition = onCall(
  {
    region: "us-central1",
    runtime: "nodejs20",
  },

  async (request) => {
    //  Destructure eventId and email from request.data
    const { eventId, email } = request.data || {};

    if (!eventId) {
      throw new HttpsError(
        "invalid-argument",
        "Event ID required."
      );
    }

    if (!email || typeof email !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "Email address required."
      );
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const emailKey =
      normalizedEmail
        .replace(/[^a-zA-Z0-9]/g, "_")
        .toLowerCase();

    const db =
      admin.firestore();

    const waitlistRef =
      db
        .collection("events")
        .doc(eventId)
        .collection("waitlist");

    const userWaitlistRef =
      waitlistRef.doc(emailKey);

    try {

      // --------------------------------------------------
      // Check whether email is on this event
      // --------------------------------------------------

      const docSnap =
        await userWaitlistRef.get();

      if (!docSnap.exists) {

        return {
          onWaitlist: false,
          position: 0,
        };
      }

      const data =
        docSnap.data();

      // --------------------------------------------------
      // If promoted, return promotion status
      // --------------------------------------------------

      if (
        data.status === "promoted"
      ) {

        return {
          onWaitlist: true,
          position: 0,
          email: normalizedEmail,
          gender: data.gender,
          status: "promoted",
        };
      }

      // --------------------------------------------------
      // Get queue for same gender
      // --------------------------------------------------

      const snapshot =
        await waitlistRef
          .where(
            "gender",
            "==",
            data.gender
          )
          .where(
            "status",
            "==",
            "waiting"
          )
          .orderBy(
            "joinedAt",
            "asc"
          )
          .get();

      let position = 0;

      let index = 1;

      snapshot.forEach((doc) => {

        const waitlistData =
          doc.data();

        if (
          waitlistData.email ===
          normalizedEmail
        ) {
          position = index;
        }

        index++;
      });

      return {
        onWaitlist: true,
        position: position,
        email: normalizedEmail,
        gender: data.gender,
        status: data.status || "waiting",
      };

    } catch (error) {

      console.error(
        " Get waitlist position error:",
        error
      );

      throw new HttpsError(
        "internal",
        "Unable to get your waitlist position."
      );
    }
  }
);

// ========================================================
// WAITLIST – Auto-Promote with 48h rule, claim token, 2h window
// ========================================================
exports.promoteFromWaitlist = onDocumentDeleted(
  {
    document: "events/{eventId}/signedUpUsers/{uid}",
    region: "us-central1",
    runtime: "nodejs20",
    // Added secrets so Twilio and Klaviyo work
    secrets: [
      twilioAccountSid,
      twilioAuthToken,
      twilioPhoneNumber,
      klaviyoApiKey,
    ],
  },
  async (event) => {
    const db = admin.firestore();
    const { eventId, uid } = event.params;

    const removedUser = event.data?.data() || {};
    let gender = removedUser.userGender || removedUser.gender || "";

    if (!gender) {
      try {
        const userSnap = await db.collection("users").doc(uid).get();
        gender = userSnap.data()?.gender || "";
      } catch (error) {
        console.log(`Could not fetch user ${uid} data:`, error);
        return;
      }
    }

    if (!gender) {
      console.log(`No gender found for removed user ${uid}; skipping.`);
      return;
    }

    console.log(`Processing promotion for event ${eventId}, removed user ${uid}, gender: ${gender}`);

    const eventRef = db.collection("events").doc(eventId);
    const waitlistRef = eventRef.collection("waitlist");

    try {
      const eventSnap = await eventRef.get();
      if (!eventSnap.exists) {
        console.log(`Event ${eventId} not found; skipping.`);
        return;
      }
      const eventData = eventSnap.data();
      // 48-HOUR CHECK
const eventDate = eventData.date || eventData.startTime;
let hoursUntilEvent = null;

if (eventDate) {
  const eventTime = new Date(eventDate).getTime();
  const now = Date.now();

  hoursUntilEvent =
    (eventTime - now) / (1000 * 60 * 60);

  if (hoursUntilEvent < 48) {
    console.log(
      `Event is in ${hoursUntilEvent} hours - less than 48, skipping promotion`
    );
    return;
  }
}
    // Normalise gender to match waitlist storage
let waitlistGender = gender;
if (waitlistGender === "Women" || waitlistGender === "Woman" || waitlistGender === "women") {
  waitlistGender = "Female";
} else if (waitlistGender === "Men" || waitlistGender === "Man" || waitlistGender === "men") {
  waitlistGender = "Male";
}

console.log(`Looking for waitlist with gender: ${waitlistGender} (original: ${gender})`);

const snapshot = await waitlistRef
  .where("gender", "==", waitlistGender)
  .where("status", "==", "waiting")
  .orderBy("joinedAt", "asc")
  .limit(1)
  .get();

      if (snapshot.empty) {
        console.log(`No waitlisted users found for gender: ${waitlistGender}`);
        return;
      }

      const firstInLine = snapshot.docs[0];
      const promotedEmail = firstInLine.id; // document ID is emailKey
      const waitlistData = firstInLine.data();

      // Get user profile from users collection using email
      const userQuery = await db.collection("users").where("email", "==", waitlistData.email).get();
      let userData = null;
      let userUid = null;
      if (!userQuery.empty) {
        userUid = userQuery.docs[0].id;
        userData = userQuery.docs[0].data();
      } else {
        console.warn(`User with email ${waitlistData.email} not found in users collection.`);
        // Fallback: use the waitlist data
        userData = { phoneNumber: null, email: waitlistData.email };
      }

      const claimToken = Buffer.from(`${eventId}:${promotedEmail}:${Date.now()}`).toString('base64');
      const claimDeadline = new Date(Date.now() + 2 * 60 * 60 * 1000);

      await firstInLine.ref.update({
        status: "promoted",
        offeredAt: admin.firestore.FieldValue.serverTimestamp(),
        claimDeadline: claimDeadline,
        claimToken: claimToken,
      });

      // Use waitlistGender for the count field
      const waitlistCountField = waitlistGender === "Female" ? "womenWaitlistCount" : "menWaitlistCount";
      await eventRef.update({
        [waitlistCountField]: admin.firestore.FieldValue.increment(-1),
        spotsReleasedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(` Promoted user ${promotedEmail} to "promoted" for event ${eventId}`);
      // Add admin notification for cancellation promotion
await createAdminNotification({
  type: 'cancellation_promotion',
  eventId,
  eventTitle: eventData.title || 'Untitled Event',
  message: `User ${waitlistData.email} was promoted from the waitlist for "${eventData.title || 'Untitled Event'}" after user ${uid} cancelled.`,
  data: {
    cancelledUserId: uid,
    cancelledUserName: removedUser.userName || uid,
    promotedEmail: waitlistData.email,
    promotedGender: gender,
    claimToken,
    claimDeadline: claimDeadline.toISOString(),
    hoursUntilEvent: Math.floor(hoursUntilEvent),
  },
});
      // ============================================================
      // 1. SEND SMS (use phone from waitlist)
      // ============================================================
      const promotedPhone = waitlistData.phoneNumber;
      if (promotedPhone) {
        const client = twilio(
          twilioAccountSid.value(),
          twilioAuthToken.value()
        );
        const claimLink = `${WEB_APP_BASE_URL}/claim-spot?token=${claimToken}&email=${encodeURIComponent(waitlistData.email)}`;
        const message = `🎉 Great news! A spot opened for ${eventData.title || 'your event'}. Claim it within 2 hours: ${claimLink}`;
        try {
          await client.messages.create({
            body: message,
            to: promotedPhone,
            from: twilioPhoneNumber.value(),
          });
          console.log(` SMS sent to ${promotedPhone}`);
        } catch (smsError) {
          console.error("SMS notification failed:", smsError);
        }
      } else {
        console.warn(` No phone number for ${waitlistData.email}; SMS not sent.`);
      }

      // ============================================================
      // 2. SEND EMAIL VIA KLAVIYO (NEW)
      // ============================================================
      try {
        const apiKey = klaviyoApiKey.value().trim();
        const email = waitlistData.email;

        // Trigger "Spot Offered" event in Klaviyo
        const response = await fetch("https://a.klaviyo.com/api/events", {
          method: "POST",
          headers: {
            Authorization: `Klaviyo-API-Key ${apiKey}`,
            "Content-Type": "application/vnd.api+json",
            Accept: "application/vnd.api+json",
            revision: "2026-07-15",
          },
          body: JSON.stringify({
            data: {
              type: "event",
              attributes: {
                metric: {
                  data: {
                    type: "metric",
                    attributes: {
                      name: "Spot Offered", // Create this metric in Klaviyo
                    },
                  },
                },
                profile: {
                  data: {
                    type: "profile",
                    attributes: {
                      email: email,
                    },
                  },
                },
                properties: {
  event_title: eventData.title || "Circuit Event",
  event_id: eventId,
  claim_token: claimToken,
  claim_deadline: claimDeadline.getTime(),
  claim_link: `${WEB_APP_BASE_URL}/claim-spot?token=${claimToken}&email=${encodeURIComponent(waitlistData.email)}`,
  gender: gender,
  source: "Circuit_Waitlist_Promotion",
                },
              },
            },
          }),
        });

        const responseText = await response.text();
        if (!response.ok) {
          console.error(" Klaviyo Spot Offered event error:", responseText);
        } else {
          console.log(` "Spot Offered" event sent to Klaviyo for ${email}`);
        }
      } catch (klaviyoError) {
        console.error(" Klaviyo email notification failed:", klaviyoError);
      }

    } catch (error) {
      console.error(`Waitlist promotion error for event ${eventId}:`, error);
    }
  }
);

// ========================================================
// WAITLIST – Cleanup Expired Claims + Promote Next Person
// ========================================================
exports.cleanupExpiredClaims = onSchedule(
  {
    schedule: "every 5 minutes",
    region: "us-central1",
    runtime: "nodejs20",
    // Added secrets so Twilio and Klaviyo work
    secrets: [
      twilioAccountSid,
      twilioAuthToken,
      twilioPhoneNumber,
      klaviyoApiKey,
    ],
  },
  async () => {
    const db = admin.firestore();
    const now = new Date();

    const eventsSnapshot = await db.collection('events').get();
    let count = 0;

    for (const eventDoc of eventsSnapshot.docs) {
      const eventId = eventDoc.id;
      const eventData = eventDoc.data();
      const waitlistRef = eventDoc.ref.collection('waitlist');
      const expiredSnap = await waitlistRef
        .where('status', '==', 'promoted')
        .get();

      for (const doc of expiredSnap.docs) {
        const data = doc.data();
        const claimDeadline = data.claimDeadline?.toDate?.() || data.claimDeadline;

        if (claimDeadline && now > claimDeadline) {
          const gender = data.gender;
          const expiredEmail = doc.id;

          // 1. Delete the expired entry
          await doc.ref.delete();
          count++;

          // 2. Update the event waitlist counter (decrement)
          const countField = gender === 'Female' ? 'womenWaitlistCount' : 'menWaitlistCount';
          await eventDoc.ref.update({
            [countField]: admin.firestore.FieldValue.increment(-1),
          });

          console.log(`Expired claim removed for ${expiredEmail} (event: ${eventId})`);

          // ============================================================
          // 3. FIND THE NEXT PERSON IN LINE
          // ============================================================
          try {
            const nextSnapshot = await waitlistRef
              .where("gender", "==", gender)
              .where("status", "==", "waiting")
              .orderBy("joinedAt", "asc")
              .limit(1)
              .get();

            // --- CASE A: No next person ---
            if (nextSnapshot.empty) {
              console.log(`No more waitlisted users for gender: ${gender} after expiry`);

              // Create "expiry_no_next" notification
              await createAdminNotification({
                type: 'expiry_no_next',
                eventId,
                eventTitle: eventData.title || 'Untitled Event',
                message: `Waitlist spot expired for ${expiredEmail} on "${eventData.title || 'Untitled Event'}". No more users on the waitlist for gender: ${gender}.`,
                data: {
                  expiredEmail,
                  gender,
                },
              });

              continue; // No one to promote
            }

            // --- CASE B: There IS a next person ---
            const nextDoc = nextSnapshot.docs[0];
            const nextData = nextDoc.data();
            const nextEmail = nextDoc.id; // emailKey

            // Get user profile
            const userQuery = await db.collection("users").where("email", "==", nextData.email).get();
            let userData = null;
            let userUid = null;
            if (!userQuery.empty) {
              userUid = userQuery.docs[0].id;
              userData = userQuery.docs[0].data();
            } else {
              console.warn(`User with email ${nextData.email} not found in users collection.`);
              userData = { phoneNumber: null, email: nextData.email };
            }

            // Generate claim token and deadline
            const claimToken = Buffer.from(`${eventId}:${nextEmail}:${Date.now()}`).toString('base64');
            const claimDeadline = new Date(Date.now() + 2 * 60 * 60 * 1000);

            // Update waitlist entry to promoted
            await nextDoc.ref.update({
              status: "promoted",
              offeredAt: admin.firestore.FieldValue.serverTimestamp(),
              claimDeadline: claimDeadline,
              claimToken: claimToken,
            });

            // Decrement waitlist counter for the newly promoted user
            await eventDoc.ref.update({
              [countField]: admin.firestore.FieldValue.increment(-1),
            });

            console.log(`Promoted next user ${nextEmail} after expiry for event ${eventId}`);

            // Create "expiry_promotion" notification (NOW AFTER nextSnapshot IS DEFINED)
            await createAdminNotification({
              type: 'expiry_promotion',
              eventId,
              eventTitle: eventData.title || 'Untitled Event',
              message: `Spot expired for ${expiredEmail} on "${eventData.title || 'Untitled Event'}". Next user ${nextEmail} was promoted.`,
              data: {
                expiredEmail,
                promotedEmail: nextEmail,
                gender,
                claimToken,
                claimDeadline: claimDeadline.toISOString(),
              },
            });
            let promotedPhone = nextData.phoneNumber;
if (promotedPhone && !promotedPhone.startsWith('+')) {
  promotedPhone = '+' + promotedPhone;
  console.log(` Added missing '+' -> ${promotedPhone}`);
}
if (promotedPhone) {
  const client = twilio(
    twilioAccountSid.value(),
    twilioAuthToken.value()
  );
  const claimLink = `${WEB_APP_BASE_URL}/claim-spot?token=${claimToken}&email=${encodeURIComponent(nextData.email)}`;
  const message = `🎉 Great news! A spot opened for ${eventData.title || 'your event'}. Claim it within 2 hours: ${claimLink}`;
  try {
    await client.messages.create({
      body: message,
      to: promotedPhone,
      from: twilioPhoneNumber.value(),
    });
    console.log(` SMS sent to promoted user ${nextEmail} (${promotedPhone})`);
  } catch (smsError) {
    console.error("SMS notification failed:", smsError);
  }
} else {
  console.warn(` No phone number for ${nextData.email}; SMS not sent.`);
}

            // --- Send Klaviyo email ---
            try {
              const apiKey = klaviyoApiKey.value().trim();
              const email = nextData.email;
              const response = await fetch("https://a.klaviyo.com/api/events", {
                method: "POST",
                headers: {
                  Authorization: `Klaviyo-API-Key ${apiKey}`,
                  "Content-Type": "application/vnd.api+json",
                  Accept: "application/vnd.api+json",
                  revision: "2026-07-15",
                },
                 body: JSON.stringify({
  data: {
    type: "event",
    attributes: {
      metric: {
        data: {
          type: "metric",
          attributes: {
            name: "Spot Offered",
          },
        },
      },

      profile: {
        data: {
          type: "profile",
          attributes: {
            email: email,
          },
        },
      },
      properties: {
  event_title: eventData.title || "Circuit Event",
  event_id: eventId,
  claim_token: claimToken,
  claim_deadline: claimDeadline.getTime(),
  claim_link: `${WEB_APP_BASE_URL}/claim-spot?token=${claimToken}&email=${encodeURIComponent(nextData.email)}`,
  gender: gender,
  source: "Circuit_Waitlist_Promotion",
},
      },
    },
  }),
});

              const responseText = await response.text();
              if (!response.ok) {
                console.error(" Klaviyo Spot Offered event error:", responseText);
              } else {
                console.log(` "Spot Offered" event sent to Klaviyo for ${email}`);
              }
            } catch (klaviyoError) {
              console.error(" Klaviyo email notification failed:", klaviyoError);
            }

          } catch (promoteError) {
            console.error(`Error promoting next user after expiry for event ${eventId}:`, promoteError);
          }
        }
      }
    }

    console.log(`Cleaned up ${count} expired claims.`);
  }
);
// ========================================================
// WAITLIST – Send Reminder Email + SMS (30 min before expiry)
// ========================================================
exports.sendWaitlistReminder = onSchedule(
  {
    schedule: "*/15 * * * *",
    region: "us-central1",
    runtime: "nodejs20",
    secrets: [
      klaviyoApiKey,
      twilioAccountSid,
      twilioAuthToken,
      twilioPhoneNumber,
    ],
  },
  async () => {
    const db = admin.firestore();

    const now = admin.firestore.Timestamp.now();

    // Look 30 minutes into the future
    const thirtyMinutesFromNow = admin.firestore.Timestamp.fromMillis(
      Date.now() + 30 * 60 * 1000
    );

    try {
      // Find promoted users whose claim deadline is within the next 30 minutes.
      const reminderQuery = db
        .collectionGroup("waitlist")
        .where("status", "==", "promoted")
        .where("claimDeadline", ">", now)
        .where("claimDeadline", "<=", thirtyMinutesFromNow);

      const snapshot = await reminderQuery.get();

      if (snapshot.empty) {
        console.log(" No waitlist reminders needed.");
        return null;
      }

      const apiKey = klaviyoApiKey.value().trim();

      // Twilio client (if needed for SMS)
      const twilioClient = twilio(
        twilioAccountSid.value(),
        twilioAuthToken.value()
      );
      const twilioFrom = twilioPhoneNumber.value();

      let sentCount = 0;

      for (const waitlistDoc of snapshot.docs) {
        try {
          const waitlistData = waitlistDoc.data();

          // Get parent event
          const eventRef = waitlistDoc.ref.parent.parent;
          if (!eventRef) {
            console.warn(`Could not determine event for waitlist entry`);
            continue;
          }

          const eventSnap = await eventRef.get();
          if (!eventSnap.exists) {
            console.warn(`Event ${eventRef.id} does not exist.`);
            continue;
          }

          const eventData = eventSnap.data();
          const email = waitlistData.email;
          const phoneNumber = waitlistData.phoneNumber;
          const claimToken = waitlistData.claimToken || "";
          const deadline = waitlistData.claimDeadline;

          if (!deadline) {
            console.warn(`No claimDeadline found.`);
            continue;
          }

          const deadlineMillis = deadline.toMillis();
          const minutesRemaining = Math.max(
            1,
            Math.ceil((deadlineMillis - Date.now()) / 60000)
          );

          // ============================================================
          // 1. SEND EMAIL REMINDER (via Klaviyo) – only if not sent
          // ============================================================
          if (waitlistData.reminderSent !== true && email) {
            const response = await fetch("https://a.klaviyo.com/api/events", {
              method: "POST",
              headers: {
                Authorization: `Klaviyo-API-Key ${apiKey}`,
                "Content-Type": "application/vnd.api+json",
                Accept: "application/vnd.api+json",
                revision: "2026-07-15",
              },
              body: JSON.stringify({
                data: {
                  type: "event",
                  attributes: {
                    metric: {
                      data: {
                        type: "metric",
                        attributes: {
                          name: "Waitlist Expiry Reminder",
                        },
                      },
                    },
                    profile: {
                      data: {
                        type: "profile",
                        attributes: {
                          email: email,
                        },
                      },
                    },
                    properties: {
                      event_title: eventData.title || "Circuit Event",
                      event_id: eventRef.id,
                      minutes_remaining: minutesRemaining,
                      claim_deadline: deadline.toDate().toISOString(),
                      claim_token: claimToken,
                      source: "Circuit_Waitlist_Reminder",
                    },
                  },
                },
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error(` Klaviyo reminder failed for ${email}:`, errorText);
            } else {
              console.log(`Waitlist reminder email triggered for ${email} — ${minutesRemaining} minutes remaining.`);
            }
          }

          // ============================================================
          // 2. SEND SMS REMINDER – only if not sent and phone exists
          // ============================================================
          if (waitlistData.smsReminderSent !== true && phoneNumber) {
            // Ensure phone number has '+'
            let normalizedPhone = phoneNumber;
            if (!normalizedPhone.startsWith('+')) {
              normalizedPhone = '+' + normalizedPhone;
            }

            const claimLink = `${WEB_APP_BASE_URL}/claim-spot?token=${claimToken}&email=${encodeURIComponent(email)}`;
            const smsMessage = `⏰ Reminder: Your spot for ${eventData.title || 'your event'} expires in ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''}. Claim it now: ${claimLink}`;

            try {
              await twilioClient.messages.create({
                body: smsMessage,
                to: normalizedPhone,
                from: twilioFrom,
              });
              console.log(` Waitlist reminder SMS sent to ${normalizedPhone} — ${minutesRemaining} minutes remaining.`);
            } catch (smsError) {
              console.error(` SMS reminder failed for ${normalizedPhone}:`, smsError);
            }

            // Mark SMS as sent (even if it failed, we don't want to retry on every run)
            await waitlistDoc.ref.update({
              smsReminderSent: true,
              smsReminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }

          // Mark email reminder as sent (if not already)
          if (waitlistData.reminderSent !== true && email) {
            await waitlistDoc.ref.update({
              reminderSent: true,
              reminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }

          sentCount++;

        } catch (userError) {
          console.error(` Error processing waitlist reminder:`, userError);
        }
      }

      console.log(`Waitlist reminder job complete. ${sentCount} reminder(s) processed.`);
      return null;
    } catch (error) {
      console.error(" Error running sendWaitlistReminder:", error);
      return null;
    }
  }
);
// ========================================================
// SEND 12-HOUR REMINDER SMS – 12 hours after event ends
// ========================================================
exports.send12HourReminder = onSchedule(
  {
    schedule: "every 30 minutes",
    region: "us-central1",
    runtime: "nodejs20",
    secrets: [twilioAccountSid, twilioAuthToken, twilioPhoneNumber],
  },
  async () => {
    const db = admin.firestore();
    const now = Date.now();
    const TWELVE_HOURS = 12 * 60 * 60 * 1000;
    const WINDOW = 30 * 60 * 1000; // 30 min window

    const eventsSnapshot = await db
      .collection('events')
      .where('status', '==', 'complete')
      .get();

    let sentCount = 0;
    for (const eventDoc of eventsSnapshot.docs) {
      const eventData = eventDoc.data();

      // Skip if already sent
      if (eventData.reminder12hSent) continue;

      // Determine event end time
      const endTime =
        eventData.endTime ||
        (eventData.startTime ? eventData.startTime + 90 * 60 * 1000 : null);
      if (!endTime) continue;

      // Check if 12 hours have passed (with 30‑minute window)
      const elapsed = now - endTime;
      if (elapsed < TWELVE_HOURS || elapsed > TWELVE_HOURS + WINDOW) continue;

      // Get attendees who haven't submitted selections
      const attendeesSnap = await eventDoc.ref.collection('signedUpUsers').get();
      if (attendeesSnap.empty) continue;

      const client = twilio(
        twilioAccountSid.value(),
        twilioAuthToken.value()
      );
      const fromNumber = twilioPhoneNumber.value();
      const baseUrl = WEB_APP_BASE_URL;

      for (const attendeeDoc of attendeesSnap.docs) {
        const a = attendeeDoc.data();

        // Skip if they already submitted selections
        if (a.selectionSubmitted === true) continue;

        const phone = a.phoneNumber || a.userId;
        if (!phone) continue;

        const claimLink = `${baseUrl}/event/${eventDoc.id}/selections/${encodeURIComponent(phone)}`;
        const msg = `Don't forget! 12 hours left to make your Circuit selections: ${claimLink}`;

        try {
          await client.messages.create({
            body: msg,
            to: phone,
            from: fromNumber,
          });
          console.log(`✅ 12h reminder sent to ${phone}`);
        } catch (err) {
          console.error(`❌ 12h reminder failed for ${phone}:`, err);
        }
      }

      await eventDoc.ref.update({
        reminder12hSent: true,
        reminder12hSentAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      sentCount++;
    }

    console.log(` send12HourReminder complete. ${sentCount} events processed.`);
    return null;
  }
);
// ========================================================
// KLAVIYO – Add Subscriber to Newsletter
// ========================================================
exports.addSubscriberToKlaviyo = onCall(
  {
    region: "us-central1",
    runtime: "nodejs20",
    secrets: [klaviyoApiKey, klaviyoListId],
  },
  async (request) => {
    const {
      email,
      city,
      preference,
      ageGroup,
      birthday,
    } = request.data || {};

    // ========================================================
    // 1. VALIDATE EMAIL
    // ========================================================
    if (!email || typeof email !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "Email is required."
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.includes("@")) {
      throw new HttpsError(
        "invalid-argument",
        "Please enter a valid email address."
      );
    }

    const apiKey = klaviyoApiKey.value().trim();
    const listId = klaviyoListId.value().trim();

    if (!apiKey || !listId) {
      console.error(" Klaviyo API key or List ID is missing.");

      throw new HttpsError(
        "failed-precondition",
        "Newsletter service is not configured correctly."
      );
    }

    try {
      // ========================================================
      // 2. CHECK IF EMAIL IS ALREADY ON CIRCUIT NEWSLETTER LIST
      // ========================================================
      const encodedFilter = encodeURIComponent(
        `equals(email,"${normalizedEmail}")`
      );

      const existingListResponse = await fetch(
        `https://a.klaviyo.com/api/lists/${listId}/profiles?filter=${encodedFilter}&page[size]=1`,
        {
          method: "GET",
          headers: {
            Authorization: `Klaviyo-API-Key ${apiKey}`,
            Accept: "application/vnd.api+json",
            revision: "2026-07-15",
          },
        }
      );

      const existingListText =
        await existingListResponse.text();

      if (!existingListResponse.ok) {
        console.error(
          "Failed checking newsletter list:",
          existingListText
        );

        throw new HttpsError(
          "internal",
          "Unable to check newsletter subscription."
        );
      }

      let existingListResult;

      try {
        existingListResult = JSON.parse(existingListText);
      } catch (parseError) {
        console.error(
          " Failed parsing Klaviyo list response:",
          existingListText
        );

        throw new HttpsError(
          "internal",
          "Invalid response from newsletter service."
        );
      }

      // ========================================================
      // 3. ALREADY SUBSCRIBED
      // ========================================================
      if (
        existingListResult.data &&
        existingListResult.data.length > 0
      ) {
        console.log(
          `ℹ️ ${normalizedEmail} is already subscribed to the Circuit newsletter.`
        );

        return {
          success: true,
          alreadySubscribed: true,
          message:
            "You're already on the list! We'll keep you updated about upcoming Circuit events.",
        };
      }

      // ========================================================
      // 4. FIND EXISTING KLAVIYO PROFILE
      // ========================================================
      const profileFilter = encodeURIComponent(
        `equals(email,"${normalizedEmail}")`
      );

      const profileSearchResponse = await fetch(
        `https://a.klaviyo.com/api/profiles?filter=${profileFilter}&page[size]=1`,
        {
          method: "GET",
          headers: {
            Authorization: `Klaviyo-API-Key ${apiKey}`,
            Accept: "application/vnd.api+json",
            revision: "2026-07-15",
          },
        }
      );

      const profileSearchText =
        await profileSearchResponse.text();

      if (!profileSearchResponse.ok) {
        console.error(
          " Failed searching Klaviyo profiles:",
          profileSearchText
        );

        throw new HttpsError(
          "internal",
          "Unable to check existing newsletter profile."
        );
      }

      let profileSearchResult;

      try {
        profileSearchResult = JSON.parse(profileSearchText);
      } catch (parseError) {
        console.error(
          " Failed parsing Klaviyo profile search:",
          profileSearchText
        );

        throw new HttpsError(
          "internal",
          "Invalid response from newsletter service."
        );
      }

      let profileId = null;

      if (
        profileSearchResult.data &&
        profileSearchResult.data.length > 0
      ) {
        // ========================================================
        // EXISTING KLAVIYO PROFILE FOUND
        // ========================================================
        profileId = profileSearchResult.data[0].id;

        console.log(
          `ℹ️ Existing Klaviyo profile found: ${profileId}`
        );

        // Update the existing profile with the latest information
        const updateProfileResponse = await fetch(
          `https://a.klaviyo.com/api/profiles/${profileId}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Klaviyo-API-Key ${apiKey}`,
              "Content-Type":
                "application/vnd.api+json",
              Accept: "application/vnd.api+json",
              revision: "2026-07-15",
            },
            body: JSON.stringify({
              data: {
                type: "profile",
                id: profileId,
                attributes: {
                  email: normalizedEmail,
                  properties: {
                    city: city || "",
                    preference: preference || "",
                    age_group: ageGroup || "",
                    birthday: birthday || "",
                    source: "Circuit_Newsletter",
                  },
                },
              },
            }),
          }
        );

        const updateProfileText =
          await updateProfileResponse.text();

        if (!updateProfileResponse.ok) {
          console.error(
            " Failed updating existing Klaviyo profile:",
            updateProfileText
          );

          throw new HttpsError(
            "internal",
            "Unable to update your newsletter profile."
          );
        }

        console.log(
          ` Existing Klaviyo profile updated: ${profileId}`
        );
      } else {
        // ========================================================
        // 5. CREATE NEW KLAVIYO PROFILE
        // ========================================================
        const createProfileResponse = await fetch(
          "https://a.klaviyo.com/api/profiles",
          {
            method: "POST",
            headers: {
              Authorization: `Klaviyo-API-Key ${apiKey}`,
              "Content-Type":
                "application/vnd.api+json",
              Accept: "application/vnd.api+json",
              revision: "2026-07-15",
            },
            body: JSON.stringify({
              data: {
                type: "profile",
                attributes: {
                  email: normalizedEmail,
                  properties: {
                    city: city || "",
                    preference: preference || "",
                    age_group: ageGroup || "",
                    birthday: birthday || "",
                    source: "Circuit_Newsletter",
                  },
                },
              },
            }),
          }
        );

        const createProfileText =
          await createProfileResponse.text();

        // ========================================================
        // HANDLE KLAVIYO DUPLICATE PROFILE SAFELY
        // ========================================================
        if (!createProfileResponse.ok) {
          let createError;

          try {
            createError = JSON.parse(createProfileText);
          } catch (parseError) {
            createError = null;
          }

          const isDuplicate =
            createProfileResponse.status === 409 ||
            createError?.errors?.some(
              (err) =>
                err.code === "duplicate_profile"
            );

          if (isDuplicate) {
            console.log(
              `ℹ️ Klaviyo reports existing profile for ${normalizedEmail}.`
            );

            const duplicateProfileId =
              createError?.errors?.[0]?.meta
                ?.duplicate_profile_id;

            if (duplicateProfileId) {
              profileId = duplicateProfileId;
            } else {
              throw new HttpsError(
                "internal",
                "An existing newsletter profile was found, but its ID could not be retrieved."
              );
            }
          } else {
            console.error(
              " Klaviyo profile creation error:",
              createProfileText
            );

            throw new HttpsError(
              "internal",
              `Klaviyo profile failed: ${createProfileText}`
            );
          }
        } else {
          let profileResult;

          try {
            profileResult = JSON.parse(
              createProfileText
            );
          } catch (parseError) {
            console.error(
              "Failed parsing Klaviyo profile creation response:",
              createProfileText
            );

            throw new HttpsError(
              "internal",
              "Invalid response from newsletter service."
            );
          }

          profileId = profileResult?.data?.id;

          if (!profileId) {
            throw new HttpsError(
              "internal",
              "Klaviyo did not return a profile ID."
            );
          }

          console.log(
            ` New Klaviyo profile created: ${profileId}`
          );
        }
      }

      // ========================================================
      // 6. ADD PROFILE TO CIRCUIT NEWSLETTER LIST
      // ========================================================
      const listResponse = await fetch(
        `https://a.klaviyo.com/api/lists/${listId}/relationships/profiles`,
        {
          method: "POST",
          headers: {
            Authorization: `Klaviyo-API-Key ${apiKey}`,
            "Content-Type":
              "application/vnd.api+json",
            Accept: "application/vnd.api+json",
            revision: "2026-07-15",
          },
          body: JSON.stringify({
            data: [
              {
                type: "profile",
                id: profileId,
              },
            ],
          }),
        }
      );

      const listText = await listResponse.text();

      if (!listResponse.ok) {
        console.error(
          " Klaviyo list error:",
          listText
        );

        throw new HttpsError(
          "internal",
          `Klaviyo list failed: ${listText}`
        );
      }

      // ========================================================
      // 7. SUCCESS
      // ========================================================
      console.log(
        ` ${normalizedEmail} successfully added to Circuit newsletter list.`
      );

      return {
        success: true,
        alreadySubscribed: false,
        message:
          "You're on the list! We'll notify you about upcoming Circuit events.",
      };
    } catch (error) {
      console.error(
        " addSubscriberToKlaviyo error:",
        error
      );

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        "internal",
        "Unable to complete newsletter signup. Please try again."
      );
    }
  }
);
// ========================================================
// HELPER: Create admin notification
// ========================================================
async function createAdminNotification({ type, eventId, eventTitle, message, data }) {
  try {
    const db = admin.firestore();
    await db.collection('adminNotifications').add({
      type,
      eventId,
      eventTitle,
      message,
      data: data || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
    });
    console.log(` Admin notification created: ${type}`);
  } catch (err) {
    console.error('Failed to create admin notification:', err);
  }
}
// ========================================================
// HELPER: Clear latestEventId if it matches
// ========================================================
async function clearLatestEventIdIfNeeded(userId, eventId) {
  const db = admin.firestore();
  const userRef = db.collection('users').doc(userId);
  const userSnap = await userRef.get();
  if (userSnap.exists && userSnap.data()?.latestEventId === eventId) {
    await userRef.update({ latestEventId: null });
    console.log(`Cleared latestEventId for user ${userId}`);
  }
}
// ========================================================
// CANCEL EVENT REGISTRATION (guest + auth friendly)
// ========================================================
exports.cancelEventRegistration = onCall(
  {
    region: "us-central1",
    runtime: "nodejs20",
  },
  async (request) => {
    const db = admin.firestore();

  const {
  eventId,
  userId,
  userEmail,
  email,
  userPhone,
  phoneNumber,
  userPhoneNumber,
  phone,
} = request.data || {};

    if (!eventId) {
      throw new HttpsError("invalid-argument", "Event ID is required.");
    }

    const eventRef = db.collection("events").doc(eventId);

    try {
      // ============================================================
      // BUILD IDENTIFIERS
      // ============================================================
      const identifiers = new Set();

if (userId) identifiers.add(String(userId).trim());
if (userEmail) identifiers.add(String(userEmail).trim().toLowerCase());
if (email) identifiers.add(String(email).trim().toLowerCase());
if (userPhone) identifiers.add(String(userPhone).trim());
if (phoneNumber) identifiers.add(String(phoneNumber).trim());
if (userPhoneNumber) identifiers.add(String(userPhoneNumber).trim());
if (phone) identifiers.add(String(phone).trim());

//  Add phone with and without the leading '+'
// (Firestore may store either form)
const phoneCandidates = [userPhone, phoneNumber, userPhoneNumber, phone]
  .filter(Boolean)
  .map(p => String(p).trim());

phoneCandidates.forEach(p => {
  identifiers.add(p);
  if (p.startsWith('+')) {
    identifiers.add(p.substring(1)); // without '+'
  } else if (/^\d+$/.test(p)) {
    identifiers.add('+' + p); // with '+'
  }
});
      // Try to find the user's profile
      let userProfile = null;

      if (userId) {
        const userSnap = await db.collection("users").doc(userId).get();

        if (userSnap.exists) {
          userProfile = userSnap.data();
        }
      }

      if (!userProfile && userEmail) {
        const userQuery = await db
          .collection("users")
          .where("email", "==", userEmail)
          .limit(1)
          .get();

        if (!userQuery.empty) {
          userProfile = userQuery.docs[0].data();
        }
      }

      if (userProfile) {
        if (userProfile.phoneNumber) {
          identifiers.add(String(userProfile.phoneNumber).trim());
        }

        if (userProfile.email) {
          identifiers.add(String(userProfile.email).trim().toLowerCase());
        }

        if (userProfile.userId) {
          identifiers.add(String(userProfile.userId).trim());
        }

        if (userProfile.uid) {
          identifiers.add(String(userProfile.uid).trim());
        }
      }

      const identifierArray = [...identifiers];

      console.log(
        `Cancellation identifiers for ${eventId}:`,
        identifierArray
      );

      // ============================================================
      // FIND SIGNED-UP USER
      // ============================================================
      const signedUpUsersRef = eventRef.collection("signedUpUsers");

      const signedUpMatches = new Map();

      // 1. Check document IDs directly
      for (const identifier of identifierArray) {
        const directRef = signedUpUsersRef.doc(identifier);
        const directSnap = await directRef.get();

        if (directSnap.exists) {
          signedUpMatches.set(directSnap.id, directSnap);
        }
      }

      // 2. Search all possible field names
      const signedUpFields = [
        "userId",
        "userID",
        "phoneNumber",
        "userPhoneNumber",
        "userPhone",
        "userEmail",
        "email",
      ];

      for (const field of signedUpFields) {
        for (const identifier of identifierArray) {
          const querySnap = await signedUpUsersRef
            .where(field, "==", identifier)
            .get();

          querySnap.forEach((docSnap) => {
            signedUpMatches.set(docSnap.id, docSnap);
          });
        }
      }

      // ============================================================
      // FIND ATTENDEE RECORDS
      // ============================================================
      const attendeesRef = eventRef.collection("attendees");
      const attendeeMatches = new Map();

      // Check document IDs
      for (const identifier of identifierArray) {
        const directRef = attendeesRef.doc(identifier);
        const directSnap = await directRef.get();

        if (directSnap.exists) {
          attendeeMatches.set(directSnap.id, directSnap);
        }
      }

      // Search possible attendee fields
      const attendeeFields = [
        "userId",
        "userID",
        "phoneNumber",
        "userPhoneNumber",
        "userPhone",
        "email",
        "userEmail",
      ];

      for (const field of attendeeFields) {
        for (const identifier of identifierArray) {
          const querySnap = await attendeesRef
            .where(field, "==", identifier)
            .get();

          querySnap.forEach((docSnap) => {
            attendeeMatches.set(docSnap.id, docSnap);
          });
        }
      }

      console.log(
        `Found ${signedUpMatches.size} signedUpUsers record(s) and ${attendeeMatches.size} attendee record(s) to remove.`
      );

      // ============================================================
      // DETERMINE GENDER BEFORE DELETING
      // ============================================================
      let cancelledGender = "";

      for (const docSnap of signedUpMatches.values()) {
        const data = docSnap.data();

        cancelledGender =
          data.userGender ||
          data.gender ||
          data.user_gender ||
          "";

        if (cancelledGender) break;
      }

      if (!cancelledGender) {
        for (const docSnap of attendeeMatches.values()) {
          const data = docSnap.data();

          cancelledGender =
            data.userGender ||
            data.gender ||
            data.user_gender ||
            "";

          if (cancelledGender) break;
        }
      }

      if (!cancelledGender && userProfile) {
        cancelledGender = userProfile.gender || "";
      }

      console.log(
        `Cancelled user's gender for ${eventId}: ${cancelledGender}`
      );

      // ============================================================
      // DELETE REGISTRATION RECORDS
      // ============================================================
      const batch = db.batch();

      for (const docSnap of signedUpMatches.values()) {
        batch.delete(docSnap.ref);
        console.log(
          `Deleting signedUpUsers/${docSnap.id}`
        );
      }

      for (const docSnap of attendeeMatches.values()) {
        batch.delete(docSnap.ref);
        console.log(
          `Deleting attendees/${docSnap.id}`
        );
      }

      // ============================================================
      // UPDATE EVENT COUNTS
      // ============================================================
      const eventSnap = await eventRef.get();

      if (!eventSnap.exists) {
        throw new HttpsError("not-found", "Event not found.");
      }

      const updates = {};

      const g = String(cancelledGender).toLowerCase();

      if (g === "female" || g === "women" || g === "woman") {
        updates.womenSpots = admin.firestore.FieldValue.increment(1);
        updates.womenSignupCount = admin.firestore.FieldValue.increment(-1);
      } else if (g === "male" || g === "men" || g === "man") {
        updates.menSpots = admin.firestore.FieldValue.increment(1);
        updates.menSignupCount = admin.firestore.FieldValue.increment(-1);
      }

      if (Object.keys(updates).length > 0) {
        batch.update(eventRef, updates);
      }

      await batch.commit();

      console.log(
        `Cancellation completed for event ${eventId}.`
      );

      // ============================================================
      // REMOVE USER'S SIGNED-UP EVENT RECORD
      // ============================================================
      if (userId) {
        try {
          await db
            .collection("users")
            .doc(userId)
            .collection("signedUpEvents")
            .doc(eventId)
            .delete();
        } catch (cleanupError) {
          console.warn(
            "Could not remove signedUpEvents record:",
            cleanupError
          );
        }

        try {
          await db
            .collection("users")
            .doc(userId)
            .update({
              latestEventId: admin.firestore.FieldValue.delete(),
            });
        } catch (cleanupError) {
          console.warn(
            "Could not clear latestEventId:",
            cleanupError
          );
        }
      }

      return {
        success: true,
        eventId,
        cancelledGender,
        deletedSignedUpUsers: signedUpMatches.size,
        deletedAttendees: attendeeMatches.size,
        message: "Event registration cancelled successfully.",
      };

    } catch (error) {
      console.error(
        `Error cancelling registration for event ${eventId}:`,
        error
      );

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        "internal",
        "Failed to cancel event registration."
      );
    }
  }
);

//======================================================
//   claimWaitlistSpot     
//======================================================
exports.claimWaitlistSpot = onCall(
  {
    region: "us-central1",
    runtime: "nodejs20",
    secrets: [
      twilioAccountSid,
      twilioAuthToken,
      twilioPhoneNumber,
    ],
  },
  async (request) => {
    const { eventId, email, token } = request.data;

    if (!eventId || !email || !token) {
      throw new HttpsError('invalid-argument', 'Missing required fields');
    }

    const db = admin.firestore();
    const emailKey = email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');

    const eventRef = db.collection('events').doc(eventId);
    const waitlistRef = eventRef.collection('waitlist').doc(emailKey);

    try {
      // ==================================================
      // 1. Load and validate waitlist entry + event
      // ==================================================
      const [waitlistSnap, eventSnap] = await Promise.all([
        waitlistRef.get(),
        eventRef.get(),
      ]);

      if (!waitlistSnap.exists) {
        throw new HttpsError('not-found', 'Waitlist entry not found');
      }
      if (!eventSnap.exists) {
        throw new HttpsError('not-found', 'Event not found');
      }

      const data = waitlistSnap.data();
      const eventData = eventSnap.data();

      // Verify token
      if (data.claimToken !== token) {
        throw new HttpsError('permission-denied', 'Invalid token');
      }

      // Already claimed?
      if (data.status === 'claimed') {
        throw new HttpsError('already-exists', 'This spot has already been claimed');
      }

      // Deadline check
      const deadline = data.claimDeadline?.toDate?.() || data.claimDeadline;
      if (deadline && new Date() > new Date(deadline)) {
        throw new HttpsError('deadline-exceeded', 'Claim window has expired');
      }

      // ==================================================
      // 2. Mark waitlist entry as claimed
      // ==================================================
      await waitlistRef.update({
        status: 'claimed',
        claimedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // ==================================================
      // 3. Decrement spots + increment signup count on event
      //    (this makes the spot disappear from the events page)
      // ==================================================
      const gender = (data.gender || '').toLowerCase();
      const updateData = {};

      if (gender === 'female' || gender === 'women') {
        updateData.womenSpots = admin.firestore.FieldValue.increment(-1);
        updateData.womenSignupCount = admin.firestore.FieldValue.increment(1);
      } else if (gender === 'male' || gender === 'men') {
        updateData.menSpots = admin.firestore.FieldValue.increment(-1);
        updateData.menSignupCount = admin.firestore.FieldValue.increment(1);
      } else if (
        gender === 'queer men' ||
        gender === 'queer women' ||
        gender === 'queer'
      ) {
        // Queer event – both sides are stored as the same total
        updateData.menSpots = admin.firestore.FieldValue.increment(-1);
        updateData.womenSpots = admin.firestore.FieldValue.increment(-1);
        updateData.menSignupCount = admin.firestore.FieldValue.increment(1);
        updateData.womenSignupCount = admin.firestore.FieldValue.increment(1);
      } else {
        // Fallback
        updateData.spotsRemaining = admin.firestore.FieldValue.increment(-1);
      }

      await eventRef.update(updateData);

      // ==================================================
      // 4. Send SMS notifications
      //    - Welcome / Terms
      //    - Purchase confirmation
      // ==================================================
      const phoneNumber = data.phoneNumber;
      if (phoneNumber) {
        const client = twilio(
          twilioAccountSid.value(),
          twilioAuthToken.value()
        );

        // 4a. Welcome + Terms SMS
        try {
          const welcomeMessage = `Welcome to Circuit! Please review our Terms of Service: https://circuitspeeddating.com/terms-of-service and Privacy Policy: https://circuitspeeddating.com/privacy-policy`;
          await client.messages.create({
            body: welcomeMessage,
            to: phoneNumber,
            from: twilioPhoneNumber.value(),
          });
          console.log(`✅ Welcome/Terms SMS sent to ${phoneNumber}`);
        } catch (smsErr) {
          console.error('Welcome SMS failed (non-blocking):', smsErr);
        }

        // 4b. Purchase confirmation SMS
        try {
          const eventTitle = eventData.title || eventData.eventName || 'your event';
          const eventDateStr = eventData.date || '';
          const venue = eventData.venue || 'TBD';
          const city = eventData.location || '';

          const confirmMessage = `⚡You're registered for ${eventTitle}! 📅 ${eventDateStr || 'TBD'} at ${venue}, ${city}. Ticket: ${data.gender || 'General'}'s Ticket. View your dashboard: https://circuitspeeddating.com/dashboard`;

          await client.messages.create({
            body: confirmMessage,
            to: phoneNumber,
            from: twilioPhoneNumber.value(),
          });
          console.log(`✅ Purchase confirmation SMS sent to ${phoneNumber}`);
        } catch (smsErr) {
          console.error('Purchase confirmation SMS failed (non-blocking):', smsErr);
        }
      } else {
        console.warn('No phone number on waitlist entry; SMS skipped.');
      }

      return { success: true };
    } catch (error) {
      console.error('❌ claimWaitlistSpot error:', error);
      if (error instanceof HttpsError) throw error;
      throw new HttpsError('internal', error.message);
    }
  }
);

exports.generateRounds = onRequest(
  {
    region: "us-central1",
    runtime: "nodejs20",
    maxInstances: 10,
  },
  async (req, res) => {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', 'https://circuitspeeddating.com');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).send({ error: 'Method not allowed' });
      return;
    }

    try {
      const { eventId } = req.body;
      if (!eventId) {
        res.status(400).send({ error: 'eventId required' });
        return;
      }

      const db = admin.firestore();
      const eventRef = db.collection('events').doc(eventId);
      const eventSnap = await eventRef.get();
      if (!eventSnap.exists) {
        res.status(404).send({ error: 'Event not found' });
        return;
      }
      const eventData = eventSnap.data();

      const signedUpSnap = await eventRef.collection('signedUpUsers').get();

      //  FIX: Map attendees with correct gender field and normalise values
      const attendees = signedUpSnap.docs.map(doc => {
        const data = doc.data();
        let gender = data.gender || data.userGender || 'Unknown';
        // Normalise: "Men" → "Male", "Women" → "Female"
        if (gender === 'Men') gender = 'Male';
        else if (gender === 'Women') gender = 'Female';
        return {
          id: doc.id,
          gender: gender,
        };
      });

      if (attendees.length === 0) {
        res.status(200).send({
          success: false,
          message: 'No attendees found. Please wait for sign-ups before generating rounds.',
          roundsGenerated: 0,
        });
        return;
      }

      let startTime = eventData.startTime;
      if (startTime && typeof startTime === 'object' && startTime.toMillis) {
        startTime = startTime.toMillis();
      } else if (typeof startTime !== 'number') {
        console.warn(`Event ${eventId} has no valid startTime, using now + 60s`);
        startTime = Date.now() + 60000;
      }

      const roundDuration = eventData.roundDurationSeconds || 360;
      const breakDuration = eventData.breakDurationSeconds || 240;

      const { roundStartTimes, assignments } = generateRoundAssignments(
        attendees,
        roundDuration,
        breakDuration,
        startTime
      );

      const timestampArray = roundStartTimes.map(ts => admin.firestore.Timestamp.fromMillis(ts));

      await eventRef.update({
        roundStartTimes: timestampArray,
        status: 'live',
      });

      const batch = db.batch();
      for (const [attendeeId, rounds] of Object.entries(assignments)) {
        const attendeeRef = eventRef.collection('signedUpUsers').doc(attendeeId);
        batch.update(attendeeRef, { roundAssignments: rounds });
      }
      await batch.commit();

      res.status(200).send({
        success: true,
        message: `Rounds generated for ${attendees.length} attendees.`,
        roundsGenerated: roundStartTimes.length,
      });
    } catch (error) {
      console.error(' generateRounds error:', error);
      res.status(500).send({
        error: error.message || 'Internal server error',
      });
    }
  }
);
// ========================================================
// MATCHMAKING – Compute Mutual Sparks (Callable + Public)
// ========================================================
exports.computeMatches = onCall(
  {
    region: "us-central1",
    runtime: "nodejs20",
    invoker: "public",
    secrets: [
      twilioAccountSid,
      twilioAuthToken,
      twilioPhoneNumber,
    ],
  },
  async (request) => {
    const { eventId } = request.data;
    if (!eventId) {
      throw new HttpsError('invalid-argument', 'eventId is required');
    }

    const db = admin.firestore();
    const eventRef = db.collection('events').doc(eventId);

    const eventSnap = await eventRef.get();
    if (!eventSnap.exists) {
      throw new HttpsError('not-found', 'Event not found');
    }

    const attendeesSnap = await eventRef
      .collection('signedUpUsers')
      .where('selectionSubmitted', '==', true)
      .get();

    if (attendeesSnap.empty) {
      return { success: true, matches: 0, message: 'No selections submitted yet' };
    }

    const attendeeSelections = {};
    const allIds = [];
    attendeesSnap.docs.forEach(doc => {
      const data = doc.data();
      attendeeSelections[doc.id] = data.selections || [];
      allIds.push(doc.id);
    });

    const mutualMatches = [];
    for (let i = 0; i < allIds.length; i++) {
      const idA = allIds[i];
      const selectionsA = attendeeSelections[idA] || [];
      for (let j = i + 1; j < allIds.length; j++) {
        const idB = allIds[j];
        const selectionsB = attendeeSelections[idB] || [];
        if (selectionsA.includes(idB) && selectionsB.includes(idA)) {
          mutualMatches.push({ user1: idA, user2: idB });
        }
      }
    }

    if (mutualMatches.length === 0) {
      await eventRef.update({ matchesComputed: true });
      return { success: true, matches: 0, message: 'No mutual matches found' };
    }

    const batch = db.batch();
    for (const match of mutualMatches) {
      const sparkId = `${match.user1}_${match.user2}`;
      const sparkRef = eventRef.collection('sparks').doc(sparkId);
      batch.set(sparkRef, {
        user1: match.user1,
        user2: match.user2,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        eventId: eventId,
        mutual: true,
      });
      const user1Ref = eventRef.collection('signedUpUsers').doc(match.user1);
      const user2Ref = eventRef.collection('signedUpUsers').doc(match.user2);
      batch.update(user1Ref, {
        sparks: admin.firestore.FieldValue.arrayUnion(match.user2),
      });
      batch.update(user2Ref, {
        sparks: admin.firestore.FieldValue.arrayUnion(match.user1),
      });
    }
    await batch.commit();

    const connectionsCreated = await createMutualConnections(mutualMatches, eventId, db);

    // Send spark match SMS
    const twilioClient = twilio(twilioAccountSid.value(), twilioAuthToken.value());
    const twilioFrom = twilioPhoneNumber.value();
    const baseUrl = WEB_APP_BASE_URL;

    for (const match of mutualMatches) {
      try {
        const a1Snap = await eventRef.collection('signedUpUsers').doc(match.user1).get();
        const a2Snap = await eventRef.collection('signedUpUsers').doc(match.user2).get();
        if (!a1Snap.exists || !a2Snap.exists) continue;

        const a1 = a1Snap.data();
        const a2 = a2Snap.data();

        const phone1 = a1.phoneNumber || a1.userId;
        const phone2 = a2.phoneNumber || a2.userId;

        const name1 = a1.firstName ? `${a1.firstName} ${(a1.lastName || '').charAt(0)}.` : (a1.userName || 'Your match');
        const name2 = a2.firstName ? `${a2.firstName} ${(a2.lastName || '').charAt(0)}.` : (a2.userName || 'Your match');

        if (phone1) {
          try {
            await twilioClient.messages.create({
              body: `You have a Spark with ${name2}! Send them a message: ${baseUrl}/dashboard/messages/${phone2}/${eventId}`,
              to: phone1,
              from: twilioFrom,
            });
            console.log(` Spark SMS sent to ${phone1}`);
          } catch (err) { console.error(` Spark SMS failed for ${phone1}:`, err); }
        }

        if (phone2) {
          try {
            await twilioClient.messages.create({
              body: `You have a Spark with ${name1}! Send them a message: ${baseUrl}/dashboard/messages/${phone1}/${eventId}`,
              to: phone2,
              from: twilioFrom,
            });
            console.log(` Spark SMS sent to ${phone2}`);
          } catch (err) { console.error(`Spark SMS failed for ${phone2}:`, err); }
        }
      } catch (err) {
        console.error('Spark SMS block error:', err);
      }
    }

    await eventRef.update({
      matchesComputed: true,
      matchesComputedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(` Computed ${mutualMatches.length} matches for event ${eventId}, ${connectionsCreated} connections`);
    return { success: true, matches: mutualMatches.length, connections: connectionsCreated };
  }
);
// ========================================================
// AUTO COMPUTE MATCHES – runs every hour
// ========================================================
exports.autoComputeMatches = onSchedule(
  {
    schedule: "0 * * * *",
    region: "us-central1",
    runtime: "nodejs20",
    secrets: [
      twilioAccountSid,
      twilioAuthToken,
      twilioPhoneNumber,
    ],
  },
  async () => {
    const db = admin.firestore();

    try {
      const eventsSnapshot = await db
        .collection('events')
        .where('status', '==', 'complete')
        .where('matchesComputed', '!=', true)
        .get();

      if (eventsSnapshot.empty) {
        console.log(' No completed events waiting for matches.');
        return null;
      }

      let computedCount = 0;
      for (const eventDoc of eventsSnapshot.docs) {
        const eventId = eventDoc.id;

        try {
          const attendeesSnap = await eventDoc.ref
            .collection('signedUpUsers')
            .where('selectionSubmitted', '==', true)
            .get();

          if (attendeesSnap.empty) {
            await eventDoc.ref.update({ matchesComputed: true });
            continue;
          }

          const attendeeSelections = {};
          const allIds = [];
          attendeesSnap.docs.forEach(doc => {
            const data = doc.data();
            const selections = data.selections || [];
            attendeeSelections[doc.id] = selections;
            allIds.push(doc.id);
          });

          const mutualMatches = [];
          for (let i = 0; i < allIds.length; i++) {
            const idA = allIds[i];
            const selectionsA = attendeeSelections[idA] || [];
            for (let j = i + 1; j < allIds.length; j++) {
              const idB = allIds[j];
              const selectionsB = attendeeSelections[idB] || [];
              if (selectionsA.includes(idB) && selectionsB.includes(idA)) {
                mutualMatches.push({ user1: idA, user2: idB });
              }
            }
          }

          if (mutualMatches.length === 0) {
            await eventDoc.ref.update({ matchesComputed: true });
            continue;
          }

          // Write sparks
          const batch = db.batch();
          for (const match of mutualMatches) {
            const sparkId = `${match.user1}_${match.user2}`;
            const sparkRef = eventDoc.ref.collection('sparks').doc(sparkId);
            batch.set(sparkRef, {
              user1: match.user1,
              user2: match.user2,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              eventId: eventId,
              mutual: true,
            });
            const user1Ref = eventDoc.ref.collection('signedUpUsers').doc(match.user1);
            const user2Ref = eventDoc.ref.collection('signedUpUsers').doc(match.user2);
            batch.update(user1Ref, {
              sparks: admin.firestore.FieldValue.arrayUnion(match.user2),
            });
            batch.update(user2Ref, {
              sparks: admin.firestore.FieldValue.arrayUnion(match.user1),
            });
          }

          // Create connections using the helper
          const connectionsCreated = await createMutualConnections(mutualMatches, eventId, db);

          // Mark event as computed
          batch.update(eventDoc.ref, {
            matchesComputed: true,
            matchesComputedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          await batch.commit();
          computedCount++;
          console.log(` Computed ${mutualMatches.length} matches for event ${eventId}, created ${connectionsCreated} connections`);
        } catch (innerError) {
          console.error(` Error computing matches for event ${eventId}:`, innerError);
        }
      }

      console.log(`Auto compute completed. ${computedCount} events processed.`);
      return null;
    } catch (error) {
      console.error(' Error in autoComputeMatches:', error);
      return null;
    }
  }
);

// ========================================================
// SEND EVENT SMS – with duplicate prevention, rich content
// ========================================================
exports.sendEventSMS = onCall(
  {
    region: "us-central1",
    runtime: "nodejs20",
    secrets: [
      twilioAccountSid,
      twilioAuthToken,
      twilioPhoneNumber,
      klaviyoApiKey,
    ],
  },
  async (request) => {
    const { type, attendeeId, eventId, roundNum, partnerName, partnerOutfit, icebreaker, eta, messageContent } = request.data;

    if (!eventId || !attendeeId) {
      throw new HttpsError('invalid-argument', 'eventId and attendeeId are required');
    }

    const db = admin.firestore();
    const eventRef = db.collection('events').doc(eventId);
    const attendeeRef = eventRef.collection('signedUpUsers').doc(attendeeId);

    // Get attendee data
    const attendeeSnap = await attendeeRef.get();
    if (!attendeeSnap.exists) {
      throw new HttpsError('not-found', 'Attendee not found');
    }
    const attendeeData = attendeeSnap.data();
    const phoneNumber = attendeeData.phoneNumber || attendeeData.userId;
    if (!phoneNumber) {
      console.warn(`No phone number for attendee ${attendeeId}`);
      return { success: false, message: 'No phone number' };
    }

    // Get event data
    const eventSnap = await eventRef.get();
    if (!eventSnap.exists) {
      throw new HttpsError('not-found', 'Event not found');
    }
    const eventData = eventSnap.data();
    const eventTitle = eventData.title || 'Circuit Event';

    // Determine SMS flag key
    let flagKey = type;
    if (type === 'roundStart') {
      flagKey = `round${roundNum}`;
    } else if (type === 'nextRound') {
      flagKey = `nextRound${roundNum}`;
    }

    // Check if SMS already sent for this type
    const smsSent = attendeeData.smsSent || {};
    if (smsSent[flagKey]) {
      console.log(`SMS type ${type} already sent to ${phoneNumber}, skipping.`);
      return { success: true, message: 'Already sent' };
    }

    // Build message and link
    const baseUrl = WEB_APP_BASE_URL;
    let smsBody = '';
    let link = `${baseUrl}/event/${eventId}/night/${attendeeId}`;
    let roundStartTimeStr = '';
    if (roundNum && eventData.roundStartTimes && eventData.roundStartTimes[roundNum - 1]) {
      const ts = eventData.roundStartTimes[roundNum - 1];
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      roundStartTimeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' });
    }

    switch (type) {
      case 'dayOf':
        smsBody = `Tonight’s the night! Circuit ${eventData.ageRange || ''} starts at ${eventData.time || 'scheduled time'} at ${eventData.venue || 'venue'}. Tap here to enter your outfit description: ${baseUrl}/outfit/${eventId}/${attendeeId}`;
        break;
      case 'roundStart':
        smsBody = `Round ${roundNum} starts at ${roundStartTimeStr} — ${partnerName}${partnerOutfit ? ', ' + partnerOutfit : ''}. Prompt: ${icebreaker || 'Say hello!'} Timer + notes: ${link}`;
        break;
      case 'late':
        const etaStr = eta ? (eta.toDate ? eta.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' }) : 'soon') : 'soon';
        smsBody = `${partnerName} will arrive a few minutes late. ETA: ${etaStr}. Please wait — thank you for your patience! ${link}`;
        break;
      case 'noShow':
        const nextRoundNum = roundNum + 1;
        const nextStart = eventData.roundStartTimes && eventData.roundStartTimes[nextRoundNum - 1];
        const nextStartStr = nextStart ? (nextStart.toDate ? nextStart.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' }) : 'soon') : 'soon';
        const noShowBreakMinutes = Math.round((eventData.noShowBreakSeconds || 600) / 60);
        smsBody = `Your Round ${roundNum} date hasn’t confirmed attendance. You’ve got a ${noShowBreakMinutes}-minute break — sit tight! Next round starts at ${nextStartStr}. ${link}`;
        break;
      case 'roundEnd':
        smsBody = `Round ${roundNum} has ended — please wrap up now and take notes using your web link: ${link}`;
        break;
      case 'nextRound':
        const nextRoundNumVal = roundNum;
        const nextStartTime = eventData.roundStartTimes && eventData.roundStartTimes[nextRoundNumVal - 1];
        const nextStartStr2 = nextStartTime ? (nextStartTime.toDate ? nextStartTime.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' }) : 'soon') : 'soon';
        smsBody = `Next round starts at ${nextStartStr2} — ${partnerName}${partnerOutfit ? ', ' + partnerOutfit : ''}. Prompt: ${icebreaker || 'Say hello!'} ${link}`;
        break;
      case 'eventEnd':
        smsBody = `That’s a wrap! You have 24 hours to make your top 3 Circuit selections. Tap here: ${baseUrl}/event/${eventId}/selections/${attendeeId}`;
        break;
      default:
        throw new HttpsError('invalid-argument', 'Unknown SMS type');
    }

    // Send SMS
    const client = twilio(
      twilioAccountSid.value(),
      twilioAuthToken.value()
    );
    try {
      await client.messages.create({
        body: smsBody,
        to: phoneNumber,
        from: twilioPhoneNumber.value(),
      });
      console.log(` SMS sent to ${phoneNumber} for type: ${type}`);
    } catch (smsError) {
      console.error(' SMS send error:', smsError);
      return { success: false, error: smsError.message };
    }

    // Update SMS sent flag
    await attendeeRef.update({
      [`smsSent.${flagKey}`]: true,
    });

    // ---- Klaviyo event for "New Message Received" (unchanged) ----
    if (type === 'newMessage') {
      try {
        const apiKey = klaviyoApiKey.value().trim();
        const email = attendeeData.email;
        if (email) {
          const response = await fetch('https://a.klaviyo.com/api/events', {
            method: 'POST',
            headers: {
              Authorization: `Klaviyo-API-Key ${apiKey}`,
              'Content-Type': 'application/vnd.api+json',
              Accept: 'application/vnd.api+json',
              revision: '2026-07-15',
            },
            body: JSON.stringify({
              data: {
                type: 'event',
                attributes: {
                  metric: {
                    data: {
                      type: 'metric',
                      attributes: { name: 'New Message Received' },
                    },
                  },
                  profile: {
                    data: {
                      type: 'profile',
                      attributes: { email: email },
                    },
                  },
                  properties: {
                    from_name: partnerName,
                    message_preview: messageContent,
                    event_title: eventTitle,
                    event_id: eventId,
                    source: 'Circuit_Event',
                  },
                },
              },
            }),
          });
          if (!response.ok) {
            console.error(' Klaviyo event error:', await response.text());
          } else {
            console.log(` Klaviyo event sent for ${email}`);
          }
        }
      } catch (klaviyoError) {
        console.error('Klaviyo error (non-critical):', klaviyoError);
      }
    }

    return { success: true };
  }
);
// ========================================================
// AUTO MARK NO‑SHOW – runs every minute
// ========================================================
exports.autoMarkNoShow = onSchedule(
  {
    schedule: "*/1 * * * *",
    region: "us-central1",
    runtime: "nodejs20",
    secrets: [], // no secrets needed
  },
  async () => {
    const db = admin.firestore();
    const now = Date.now();

    // Find all live events
    const eventsSnapshot = await db.collection('events').where('status', '==', 'live').get();

    for (const eventDoc of eventsSnapshot.docs) {
      const eventData = eventDoc.data();
      const roundStartTimes = eventData.roundStartTimes || [];
      if (roundStartTimes.length === 0) continue;

      // For each round, check if it has started and mark no‑shows
      for (let i = 0; i < roundStartTimes.length; i++) {
        const startTs = roundStartTimes[i];
        const startMillis = startTs.toMillis ? startTs.toMillis() : startTs;
        if (now >= startMillis) {
          // Round i+1 has started
          const roundKey = `round${i + 1}`;

          // Get all attendees who have this round assignment
          const attendeesSnap = await eventDoc.ref.collection('signedUpUsers').get();
          const batch = db.batch();

          for (const attendeeDoc of attendeesSnap.docs) {
            const attendeeData = attendeeDoc.data();
            const assignments = attendeeData.roundAssignments || {};
            // If this attendee is assigned to this round
            if (assignments[roundKey]) {
              const checkInStatus = attendeeData.checkInStatus;
              // If not checked in (or not 'onTime'/'late') and not already 'noShow'
              if (!checkInStatus || (checkInStatus !== 'onTime' && checkInStatus !== 'late' && checkInStatus !== 'noShow')) {
                // Mark as noShow
                batch.update(attendeeDoc.ref, {
                  checkInStatus: 'noShow',
                  eta: null,
                });
                console.log(`Auto marked attendee ${attendeeDoc.id} as noShow for round ${i+1}`);
              }
            }
          }

          await batch.commit();
        }
      }
    }

    return null;
  }
);

// ========================================================
// SEND DAY-OF SMS – scheduled 3 hours before event start
// ========================================================
exports.sendDayOfSMS = onSchedule(
  {
    schedule: "*/30 * * * *",   
    region: "us-central1",
    runtime: "nodejs20",
    secrets: [twilioAccountSid, twilioAuthToken, twilioPhoneNumber],
  },
  async () => {
    const db = admin.firestore();
    const now = Date.now();
    const threeHoursLater = now + 3 * 60 * 60 * 1000;
    const startWindow = 15 * 60 * 1000;
    const lowerBound = threeHoursLater - startWindow;
    const upperBound = threeHoursLater + startWindow;

    const eventsSnapshot = await db
      .collection('events')
      .where('status', 'in', ['upcoming', 'live'])
      .get();

    console.log(`🔍 Found ${eventsSnapshot.size} events.`);

    let count = 0;
    for (const eventDoc of eventsSnapshot.docs) {
      const eventData = eventDoc.data();
      const startTime = eventData.startTime?.toMillis?.() || eventData.startTime;
      if (!startTime) {
        console.log(`⏭️ Event ${eventDoc.id} missing startTime`);
        continue;
      }

      console.log(`📅 Event ${eventDoc.id}: startTime=${new Date(startTime).toISOString()}, now=${new Date(now).toISOString()}, window: ${new Date(lowerBound).toISOString()} - ${new Date(upperBound).toISOString()}`);

      if (startTime >= lowerBound && startTime <= upperBound) {
        if (eventData.dayOfSMSSent) {
          console.log(`⏭️ Event ${eventDoc.id} already sent`);
          continue;
        }

        const attendeesSnap = await eventDoc.ref.collection('signedUpUsers').get();
        console.log(`👥 Event ${eventDoc.id} has ${attendeesSnap.size} attendees.`);

        if (attendeesSnap.empty) continue;

        const client = twilio(
          twilioAccountSid.value(),
          twilioAuthToken.value()
        );
        const fromNumber = twilioPhoneNumber.value();
        console.log(` Twilio from number: ${fromNumber}`);

        for (const attendeeDoc of attendeesSnap.docs) {
          const attendeeData = attendeeDoc.data();
          const phone = attendeeData.phoneNumber || attendeeData.userId;
          if (!phone) {
            console.log(`⚠️ Attendee ${attendeeDoc.id} has no phone`);
            continue;
          }
          console.log(`📱 Sending SMS to ${phone}`);
          const message = `Tonight's the night! Circuit ${eventData.ageGroup || ''} starts at ${eventData.time || 'scheduled time'} at ${eventData.venue || 'venue'}. Tap here to enter your outfit description: ${WEB_APP_BASE_URL}/outfit/${eventDoc.id}/${attendeeDoc.id}`;
          try {
            const result = await client.messages.create({
              body: message,
              to: phone,
              from: fromNumber,
            });
            console.log(`SMS sent to ${phone}, SID: ${result.sid}`);
          } catch (err) {
            console.error(` Failed to send SMS to ${phone}:`, err);
          }
        }

        await eventDoc.ref.update({ dayOfSMSSent: true, dayOfSMSSentAt: admin.firestore.FieldValue.serverTimestamp() });
        count++;
      } else {
        console.log(`⏭️ Event ${eventDoc.id} not in time window (${new Date(startTime).toISOString()})`);
      }
    }

    console.log(`sendDayOfSMS completed. ${count} events processed.`);
  }
);