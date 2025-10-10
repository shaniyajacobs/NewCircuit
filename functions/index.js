const functions = require("firebase-functions/v2");
const { onCall } = require("firebase-functions/v2/https");
const { onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const Stripe = require("stripe");
const util = require('util');
const nodemailer = require('nodemailer');
const paypal = require('@paypal/checkout-server-sdk');

const stripeSecret = defineSecret("STRIPE_SECRET");
const remoSecret = defineSecret('REMO_API_KEY');
const remoCompanyIdSecret = defineSecret('REMO_COMPANY_ID');
const emailUser = defineSecret('EMAIL_USER');
const emailPass = defineSecret('EMAIL_PASS');
const payPalClientId = defineSecret('PAYPAL_CLIENT_ID');
const payPalClientSecret = defineSecret('PAYPAL_SECRET');

admin.initializeApp();

const client = new paypal.core.PayPalHttpClient(
  new paypal.core.SandboxEnvironment(
    payPalClientId, 
    payPalClientSecret
  )
);

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


    const signedUpEventsSnap = await userRef.collection('signedUpEvents').get();
    const eventOps = signedUpEventsSnap.docs.map(async (evDoc) => {
      const eventId = evDoc.id; // event firestoreID
      const eventRef = db.collection('events').doc(eventId);
      await eventRef.collection('signedUpUsers').doc(uid).delete().catch(() => {});
      await evDoc.ref.delete().catch(() => {});
    });

    // 2️⃣  Remove connections (both sides)
    const connectionsSnap = await userRef.collection('connections').get();
    const connectionUpdates = connectionsSnap.docs.map(async (connDoc) => {
      const otherUid = connDoc.id;
      await db.collection('users').doc(otherUid).collection('connections').doc(uid).delete().catch(() => {});
      await connDoc.ref.delete().catch(() => {});
    });

    //adding comm

    // 3️⃣  Remove admin role record if present
    const adminRoleDeletion = db.collection('adminUsers').doc(uid).delete().catch(() => {});

    // 4️⃣  Wait for all parallel deletions
    await Promise.all([...eventOps, ...connectionUpdates, adminRoleDeletion]);

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


// 🆕 Automatically promote from waitlist when a signup is removed (transactional)
exports.promoteFromWaitlist = onDocumentDeleted(
  "events/{eventId}/signedUpUsers/{uid}",
  async (event) => {
    console.log('[promoteFromWaitlist] Event object:', JSON.stringify(event, null, 2));
    const db = admin.firestore();
    const { eventId, uid } = event.params;

    // In v2, deleted doc's data is available on event.data
    const removedUser = event.data?.data() || {};
    console.log('[promoteFromWaitlist] Deleted document data:', removedUser);
    let gender = removedUser.userGender || '';

    // Fallback: if gender wasn't on the signup doc, try user profile
    if (!gender) {
      try {
        const userSnap = await db.collection('users').doc(uid).get();
        gender = userSnap.data()?.gender || '';
      } catch (error) {
        console.log(`[promoteFromWaitlist] Could not fetch user ${uid} data:`, error);
        return;
      }
    }
    
    if (!gender) {
      console.log(`[promoteFromWaitlist] No gender found for removed user ${uid}; skipping.`);
      return;
    }
    
    console.log(`[promoteFromWaitlist] Processing promotion for event ${eventId}, user ${uid}, gender: ${gender}`);

    const eventRef = db.collection("events").doc(eventId);

    let promotedUidOut = null;

    try {
      await db.runTransaction(async (tx) => {
        // 1) READ: Get event document
        const eventDoc = await tx.get(eventRef);
        if (!eventDoc.exists) {
          console.log(`[promoteFromWaitlist] Event ${eventId} not found, skipping`);
          return;
        }

        const data = eventDoc.data() || {};
        const spotsField = gender === "Male" ? "menSpots" : "womenSpots";
        const countField = gender === "Male" ? "menSignupCount" : "womenSignupCount";

        const spots = Number(data[spotsField] || 0);
        const currentCount = Number(data[countField] || 0);

        // 2) Calculate what the count will be after removal
        const afterRemoval = Math.max(currentCount - 1, 0);

        // 3) If no spot opened, stop here
        const open = spots - afterRemoval;
        if (open <= 0) {
          console.log(`[promoteFromWaitlist] No spots available for promotion (${spots} total, ${afterRemoval} current)`);
          return;
        }
        
        console.log(`[promoteFromWaitlist] ${open} spots available for promotion`);

        // 4) READ: Find earliest waitlisted user of the same gender
        const waitlistRef = eventRef.collection("waitlist");
        console.log(`[promoteFromWaitlist] Looking for waitlisted users with gender: ${gender}`);

        // First try normalized equality query
        let q = waitlistRef
          .where("userGender", "==", gender)
          .orderBy("signUpTime", "asc")
          .limit(1);
        let snap = await tx.get(q);
        
        if (snap.empty) {
          console.log(`[promoteFromWaitlist] No waitlisted users found with exact gender match: ${gender}`);
        } else {
          console.log(`[promoteFromWaitlist] Found ${snap.docs.length} waitlisted users with gender: ${gender}`);
        }

        // Fallback: scan earliest N and pick first case-insensitive match
        if (snap.empty) {
          console.log(`[promoteFromWaitlist] No exact gender match found, trying fallback scan`);
          const scan = await tx.get(waitlistRef.orderBy("signUpTime", "asc").limit(25));
          const firstMatch = scan.docs.find(d => (d.data().userGender || '') === gender);
          if (!firstMatch) {
            console.log(`[promoteFromWaitlist] No waitlisted users found for gender: ${gender}`);
            return;
          }

          // All reads are done, now do all writes
          const promotedUid = firstMatch.id;
          promotedUidOut = promotedUid;
          const firstInLine = firstMatch.data() || {};
          console.log(`[promoteFromWaitlist] Promoting user ${promotedUid} from waitlist (fallback scan)`);

          const suRef = eventRef.collection("signedUpUsers").doc(promotedUid);
          tx.set(suRef, {
            ...firstInLine,
            userID: promotedUid, // 👈 ensure exact key & present in this branch too
            signUpTime: admin.firestore.FieldValue.serverTimestamp(),
          });
          tx.update(eventRef, { [countField]: afterRemoval + 1 });
          tx.delete(firstMatch.ref);
          console.log(`[promoteFromWaitlist] Successfully promoted user ${promotedUid} from waitlist`);
          return;
        }

        // All reads are done, now do all writes
        const firstInLineDoc = snap.docs[0];
        const promotedUid = firstInLineDoc.id; // ✅ same name everywhere
        promotedUidOut = promotedUid;
        const firstInLine = firstInLineDoc.data() || {};
        console.log(`[promoteFromWaitlist] Promoting user ${promotedUid} from waitlist (normal query)`);

        const suRef = eventRef.collection("signedUpUsers").doc(promotedUid);
        tx.set(suRef, {
          ...firstInLine,
          userID: promotedUid, // ensure userID field is set
          signUpTime: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 5) Update event count and remove from waitlist
        tx.update(eventRef, { [countField]: afterRemoval + 1 });
        tx.delete(firstInLineDoc.ref);
        console.log(`[promoteFromWaitlist] Successfully promoted user ${promotedUid} from waitlist`);
      });
    } catch (error) {
      console.error(`[promoteFromWaitlist] Error in promoteFromWaitlist for event ${eventId}:`, error);
    }
    
    // Post-transaction: mirror to users/{uid}/signedUpEvents/{eventId}
    try {
      if (!promotedUidOut) {
        console.log('[promoteFromWaitlist] No promoted user to mirror; done.');
        return;
      }

      const evSnap = await db.collection('events').doc(eventId).get();
      if (!evSnap.exists) return;

      const e = evSnap.data() || {};
      const payload = {
        eventID: e.eventID || eventId, // Remo ID or fallback to Firestore doc id
        signUpTime: admin.firestore.FieldValue.serverTimestamp(),
        eventTitle: e.title || e.eventName || null,
        eventDate: e.date || null,
        eventTime: e.time || null,
        eventLocation: e.location || null,
        eventAgeRange: e.ageRange || null,
        eventType: e.eventType || e.type || null,
      };

      await db.collection('users').doc(promotedUidOut)
        .collection('signedUpEvents').doc(eventId) // use Firestore event doc id
        .set(payload, { merge: true });

      // optional: keep latestEventId up to date
      await db.collection('users').doc(promotedUidOut)
        .set({ latestEventId: payload.eventID }, { merge: true });

      console.log(`[promoteFromWaitlist] Mirrored to users/${promotedUidOut}/signedUpEvents/${eventId}`);
    } catch (err) {
      console.error('[promoteFromWaitlist] post-tx mirror error:', err);
    }
  }
);

exports.createPayPalOrder = onCall(
  {
    region: "us-central1",
    runtime: 'nodejs18',
  },
  async (data, context) => {   
    const amount = Number(data?.data?.amount);
    if (!amount) {
      return data?.data.status(400).json({ error: "Missing amount" });
    }
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [{ amount: { currency_code: "USD", value: amount } }],
    });

    const order = await client.execute(request);

    return { id: order.result.id };
  });
   
exports.capturePayPalOrder = onCall(
  {
    region: "us-central1",
    runtime: 'nodejs18',
  },
  async (data, context) => {
    try{
      const orderId = data?.data.orderId;
      if (!orderId) {
        return { error: "Missing orderId" };
      }

      const request = new paypal.orders.OrdersCaptureRequest(orderId);
      request.requestBody({});

      const capture = await client.execute(request);
      return capture.result;
    }catch(error){
      console.error("❌ capturePayPalOrder error:", error);
      return { error: "Failed to capture order" };
    }
  });   

exports.paymentClientId = onCall(
  {
    region: "us-central1",
    secrets: [payPalClientId],
    runtime: 'nodejs18',
  },
  (data, context) => {
    return { clientId: payPalClientId.value() }
  }
);