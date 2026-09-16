import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { doc, setDoc, updateDoc, increment, collection, query, where, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebaseConfig';
import { auth } from '../firebaseConfig';
import styles from './Checkout.module.css';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    eventId,
    eventTitle,
    selectedGender,
    price,
    city,
    phoneNumber,
    venue,
    date,
    time,
    ageRange,
    token,
    email,
    isClaim,
    uid,
    firstName,
    lastName,
  } = location.state || {};

  const [savedUserId, setSavedUserId] = useState(null);

  const userPhone = phoneNumber || (uid && uid.startsWith('+') ? uid : '');

  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountError, setDiscountError] = useState('');
  const [discountId, setDiscountId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // ✅ PayPal client ID fetched from Firebase secret via Cloud Function
  const [paypalClientId, setPaypalClientId] = useState(null);

  const finalPrice = Math.max(0, (price || 28) - discountAmount);
  const isFree = finalPrice === 0;

  // Redirect if no event selected
  useEffect(() => {
    if (!eventId) {
      navigate('/events');
    }
  }, [eventId, navigate]);

  // ✅ Fetch PayPal Client ID from Cloud Function (uses Firebase secret)
  useEffect(() => {
    const cached = localStorage.getItem('paypalClientId');
    if (cached) {
      setPaypalClientId(cached);
      return;
    }

    const fetchClientId = async () => {
      try {
        const getClientId = httpsCallable(functions, 'paymentClientId');
        const res = await getClientId();
        if (res.data?.clientId) {
          setPaypalClientId(res.data.clientId);
          localStorage.setItem('paypalClientId', res.data.clientId);
        } else {
          console.error('No PayPal client ID returned');
        }
      } catch (err) {
        console.error('Failed to fetch PayPal client ID:', err);
      }
    };

    fetchClientId();
  }, []);

  const formatEventDate = () => {
    if (!date) return 'Date TBD';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // =============================================================
  // Discount code validation
  // =============================================================
  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountError('Please enter a discount code');
      return;
    }

    setDiscountError('');
    setLoading(true);

    try {
      const codeToLookup = discountCode.trim().toUpperCase();
      const discountsRef = collection(db, 'discounts');
      const q = query(discountsRef, where('code', '==', codeToLookup));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const discountDoc = querySnapshot.docs[0];
        const data = discountDoc.data();

        if (data.isActive === false) {
          setDiscountError('This discount is no longer active');
          setDiscountAmount(0);
          setDiscountApplied(false);
          setLoading(false);
          return;
        }

        const now = new Date();
        const validUntil = data.validUntil ? new Date(data.validUntil) : null;
        if (validUntil && now > validUntil) {
          setDiscountError('This discount has expired');
          setDiscountAmount(0);
          setDiscountApplied(false);
          setLoading(false);
          return;
        }

        if (data.usageLimit && data.usageCount >= data.usageLimit) {
          setDiscountError('This discount has reached its maximum usage');
          setDiscountAmount(0);
          setDiscountApplied(false);
          setLoading(false);
          return;
        }

        const discountValue = data.value || 0;
        if (data.type === 'percentage') {
          const discountAmountCalculated = (price || 28) * (discountValue / 100);
          const roundedDiscount = Math.round(discountAmountCalculated * 100) / 100;
          setDiscountAmount(roundedDiscount);
          setDiscountApplied(true);
          setDiscountId(discountDoc.id);
          setDiscountError('');
        } else {
          setDiscountAmount(discountValue);
          setDiscountApplied(true);
          setDiscountId(discountDoc.id);
          setDiscountError('');
        }
      } else {
        setDiscountError('Invalid discount code');
        setDiscountAmount(0);
        setDiscountApplied(false);
      }
    } catch (err) {
      console.error('Error validating discount:', err);
      setDiscountError('Failed to validate discount');
    } finally {
      setLoading(false);
    }
  };

  // =============================================================
  // Payment success handler (PayPal + free ticket + waitlist claim)
  // =============================================================
  const handlePaymentSuccess = async (details) => {
    setLoading(true);
    setError('');

    const authUser = auth.currentUser;
    const userId = uid || authUser?.uid;

    if (!userId) {
      setError('User not authenticated. Please log in again.');
      setLoading(false);
      navigate('/login');
      return;
    }

    try {
      // Waitlist claim (if applicable)
      if (isClaim && token && email) {
        try {
          const functionsInst = getFunctions();
          const claimFn = httpsCallable(functionsInst, 'claimWaitlistSpot');
          await claimFn({
            eventId,
            email,
            token,
          });
          console.log('✅ Waitlist spot claimed successfully');
        } catch (claimErr) {
          console.error('❌ Claim error:', claimErr);
          setError('Failed to claim your waitlist spot. Please contact support.');
          setLoading(false);
          return;
        }
      }

      // Increment discount usage
      if (discountApplied && discountId) {
        try {
          const discountDocRef = doc(db, 'discounts', discountId);
          await updateDoc(discountDocRef, {
            usageCount: increment(1),
            lastUsedAt: new Date(),
            lastUsedBy: userId,
          });
        } catch (discountUpdateError) {
          console.error('Failed to update discount usage:', discountUpdateError);
        }
      }

      // Create attendee record
      const attendeeRef = doc(db, 'events', eventId, 'attendees', userId);
      await setDoc(attendeeRef, {
        userId: userId,
        email: email || authUser?.email || '',
        phoneNumber: userPhone || authUser?.phoneNumber || '',
        firstName: firstName || authUser?.displayName || '',
        lastName: lastName || '',
        gender: selectedGender || 'Unknown',
        ticketType: selectedGender || 'Unknown',
        paymentId: details.id || (isClaim ? 'claimed_waitlist' : 'free_ticket'),
        paymentStatus: details.id ? 'completed' : (isClaim ? 'claimed' : 'free'),
        purchaseDate: new Date(),
        checkedIn: false,
        status: 'registered',
        discountApplied: discountApplied,
        discountCode: discountApplied ? discountCode : null,
        discountAmount: discountAmount,
        finalPrice: finalPrice,
        venue: venue || 'TBD',
        eventDate: date || null,
        claimedFromWaitlist: isClaim || false,
      });

      // Add to signedUpUsers subcollection
      const signedUpUserRef = doc(db, 'events', eventId, 'signedUpUsers', userId);
      await setDoc(signedUpUserRef, {
        userId: userId,
        userEmail: email || authUser?.email || '',
        userName: firstName ? `${firstName} ${lastName || ''}`.trim() : authUser?.displayName || '',
        userGender: selectedGender || 'Unknown',
        signUpTime: new Date(),
        phoneNumber: userPhone || authUser?.phoneNumber || '',
      });

      // Update event spot counts (only if not a waitlist claim)
      if (!isClaim) {
        const eventRef = doc(db, 'events', eventId);
        const updateData = {};
        const genderLower = selectedGender?.toLowerCase();

        if (genderLower === 'female' || genderLower === 'women') {
          updateData.womenSpots = increment(-1);
          updateData.womenSignupCount = increment(1);
        } else if (genderLower === 'male' || genderLower === 'men') {
          updateData.menSpots = increment(-1);
          updateData.menSignupCount = increment(1);
        } else {
          updateData.spotsRemaining = increment(-1);
        }
        await updateDoc(eventRef, updateData);
      }

      // Update user document
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        eventsAttended: increment(1),
        latestEventId: eventId,
        phoneNumber: userPhone || authUser?.phoneNumber || '',
        preferencesComplete: true,
        quizComplete: true,
        locationSet: true,
        displayName: firstName ? `${firstName} ${lastName || ''}`.trim() : authUser?.displayName || '',
        email: email || authUser?.email || '',
        gender: selectedGender || 'Unknown',
      }, { merge: true });

      // Add to user's signedUpEvents subcollection
      const signedUpEventRef = doc(db, 'users', userId, 'signedUpEvents', eventId);
      await setDoc(signedUpEventRef, {
        eventID: eventId,
        signUpTime: new Date(),
        eventTitle: eventTitle || 'Event',
        eventDate: date ? new Date(date).toISOString().split('T')[0] : null,
        eventTime: time || null,
        eventLocation: city || 'TBD',
        eventAgeRange: ageRange || 'All',
        eventType: selectedGender ? selectedGender + "'s Ticket" : 'General',
        claimedFromWaitlist: isClaim || false,
      }, { merge: true });

      console.log('✅ Event added to signedUpEvents:', eventId);
      // 🔥 Terms of Service SMS (non-blocking)
try {
  const sendTerms = httpsCallable(functions, 'sendTermsSMS');
  await sendTerms({ phoneNumber: userPhone || authUser?.phoneNumber || '' });
  console.log('✅ Terms SMS sent successfully');
} catch (termsError) {
  console.error('Terms SMS failed (non-blocking):', termsError);
}
      // Send SMS confirmation (non-blocking)
      try {
        const sendConfirmation = httpsCallable(functions, 'sendPurchaseConfirmation');
        await sendConfirmation({
          phoneNumber: userPhone || authUser?.phoneNumber || '',
          eventTitle: eventTitle,
          eventDate: formatEventDate(),
          venue: venue || 'TBD',
          city: city || 'TBD',
          ticketType: selectedGender || 'General',
          discountApplied: discountApplied,
          discountAmount: discountAmount,
        });
        console.log('✅ Purchase SMS sent successfully');
      } catch (smsError) {
        console.error('Purchase SMS failed (non-blocking):', smsError);
      }

      setSavedUserId(userId);
      setSuccess(true);
    } catch (err) {
      console.error('Error processing payment:', err);
      setError(err.message || 'Payment confirmed but failed to update records.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (err) => {
    console.error('PayPal error:', err);
    setError('Payment failed. Please try again.');
  };

  // =============================================================
  // Success screen
  // =============================================================
  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.successTitle}>🎉 Purchase Confirmed!</h2>
          <p className={styles.successText}>You are now registered for <strong>{eventTitle}</strong>.</p>
          <p className={styles.successText}><strong>Ticket Type:</strong> {selectedGender}'s Ticket</p>
          {discountApplied && (
            <p className={styles.successText}><strong>Discount Applied:</strong> ${discountAmount} off</p>
          )}
          {isFree && <p className={styles.successText}><strong>This ticket was FREE!</strong></p>}
          {isClaim && <p className={styles.successText}><strong>🎫 You claimed your waitlist spot!</strong></p>}
          <p className={styles.successText}><strong>Venue:</strong> {venue || 'TBD'}</p>
          <p className={styles.successText}><strong>Date:</strong> {formatEventDate()}</p>
          <p className={styles.successText}>A confirmation SMS has been sent to your phone.</p>
          <button
            onClick={() => {
              localStorage.setItem('guestUid', savedUserId);
              navigate('/dashboard', { state: { guestUid: savedUserId } });
            }}
            className={styles.primaryBtn}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // =============================================================
  // Main render
  // =============================================================
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Checkout</h1>

        <div className={styles.summary}>
          <h3>Order Summary</h3>
          <div className={styles.summaryRow}>
            <span>Event:</span>
            <span>{eventTitle}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Ticket Type:</span>
            <span>{selectedGender}'s Ticket</span>
          </div>
          <div className={styles.summaryRow}>
            <span>City:</span>
            <span>{city || 'TBD'}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Venue:</span>
            <span>{venue || 'TBD'}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Date:</span>
            <span>{formatEventDate()}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Price:</span>
            <span>${price || 28}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Phone:</span>
            <span>{userPhone || 'Not provided'}</span>
          </div>

          {isClaim && (
            <div className={styles.claimBadge}>
              🎫 You are claiming a waitlist spot! Email: <strong>{email}</strong>
            </div>
          )}

          {/* Discount section */}
          <div className={styles.discountSection}>
            <div className={styles.discountInputGroup}>
              <input
                type="text"
                placeholder="Enter discount code"
                className={styles.discountInput}
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                disabled={discountApplied || loading}
              />
              <button
                onClick={handleApplyDiscount}
                className={styles.applyBtn}
                disabled={discountApplied || !discountCode.trim() || loading}
              >
                {loading ? 'Checking...' : discountApplied ? 'Applied ✓' : 'Apply'}
              </button>
            </div>
            {discountError && <div className={styles.discountError}>{discountError}</div>}
            {discountApplied && (
              <div className={styles.discountSuccess}>
                ✅ ${discountAmount} off applied!
              </div>
            )}
          </div>

          <hr className={styles.divider} />
          <div className={`${styles.summaryRow} ${styles.total}`}>
            <span>Total:</span>
            <span>${finalPrice}</span>
          </div>
          {discountApplied && (
            <div className={styles.savingsText}>
              You saved ${discountAmount}!
            </div>
          )}
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {/* Payment section */}
        {isFree ? (
          <div className={styles.freeTicketSection}>
            <p className={styles.freeTicketText}>
              🎉 Your ticket is <strong>FREE</strong> after discount!
            </p>
            <button
              onClick={() => handlePaymentSuccess({ id: 'free_ticket' })}
              disabled={loading}
              className={styles.confirmFreeBtn}
            >
              {loading ? 'Confirming...' : 'Confirm Free Ticket'}
            </button>
          </div>
        ) : (
          <div className={styles.paypalContainer}>
            {paypalClientId ? (
              <PayPalScriptProvider options={{ clientId: paypalClientId, currency: 'USD' }}>
                <PayPalButtons
                  style={{ layout: 'vertical', color: 'black', shape: 'rect', label: 'pay' }}
                  createOrder={(data, actions) => {
                    return actions.order.create({
                      purchase_units: [
                        {
                          description: `${selectedGender}'s Ticket for ${eventTitle}`,
                          amount: {
                            value: finalPrice.toFixed(2),
                            currency_code: 'USD',
                          },
                        },
                      ],
                    });
                  }}
                  onApprove={async (data, actions) => {
                    const details = await actions.order.capture();
                    await handlePaymentSuccess(details);
                  }}
                  onError={handlePaymentError}
                />
              </PayPalScriptProvider>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                Loading PayPal...
              </div>
            )}
          </div>
        )}

        <button onClick={() => navigate(-1)} className={styles.secondaryBtn}>
          Back to Event
        </button>
      </div>
    </div>
  );
};

export default Checkout;