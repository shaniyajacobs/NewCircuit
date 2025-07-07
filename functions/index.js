const functions = require("firebase-functions/v2");
const { onCall } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const Stripe = require("stripe");

const stripeSecret = defineSecret("STRIPE_SECRET");
const remoSecret = defineSecret('REMO_API_KEY');

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
    secrets: [remoSecret],
  },
  async (data, context) => {
    const eventId = data?.eventId;
    if (!eventId) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing eventId');
    }

    // Hit the Remo endpoint that returns the launch link
    // Docs: GET /v1/events/{eventId}
    const response = await fetch(`https://live.remo.co/api/v1/events/${eventId}`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Token: ${remoSecret.value()}`,
      },
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Remo error:', err);
      throw new functions.https.HttpsError('internal', 'Remo API failed');
    }

    // Typical Remo payload looks like { … , "event_url": "https://live.remo.co/e/abc-123" }
    const { event_url: joinUrl } = await response.json();
    if (!joinUrl) {
      throw new functions.https.HttpsError('internal', 'No join URL returned');
    }

    return { joinUrl };          // <- sent back to the client
  }
);

