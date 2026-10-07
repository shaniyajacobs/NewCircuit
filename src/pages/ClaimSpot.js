import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db, functions } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import styles from './ClaimSpot.module.css';
import { buildEventSlug } from '../utils/slugUtils';

const ClaimSpot = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [eventData, setEventData] = useState(null);
  const [userGender, setUserGender] = useState('All');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState(''); 
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [eventId, setEventId] = useState('');

  useEffect(() => {
    if (!token || !email) {
      setError('Invalid claim link. Missing token or email.');
      setLoading(false);
      return;
    }

    const validateToken = async () => {
      try {
        const decoded = atob(token);
        const [decodedEventId, decodedEmail, timestamp] = decoded.split(':');

        const normalizedEmail = email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
        if (decodedEmail !== normalizedEmail) {
          setError('This claim link is not associated with this email address.');
          setLoading(false);
          return;
        }

        setUserEmail(email);
        setEventId(decodedEventId);

        const emailKey = normalizedEmail;
        const waitlistRef = doc(db, 'events', decodedEventId, 'waitlist', emailKey);
        const waitlistSnap = await getDoc(waitlistRef);

        if (!waitlistSnap.exists()) {
          setError('You are not on the waitlist for this event.');
          setLoading(false);
          return;
        }

        const waitlistData = waitlistSnap.data();

        // Store phone number from waitlist
        if (waitlistData.phoneNumber) {
          setUserPhone(waitlistData.phoneNumber);
        }

        if (waitlistData.status !== 'promoted') {
          setError('This spot has already been claimed, declined, or expired.');
          setLoading(false);
          return;
        }

        if (waitlistData.gender) {
          setUserGender(waitlistData.gender);
        }

        const deadline = waitlistData.claimDeadline?.toDate?.() || waitlistData.claimDeadline;
        if (deadline && new Date() > new Date(deadline)) {
          setError('⏰ Your claim window has expired. This offer is no longer available.');
          setLoading(false);
          return;
        }

        if (deadline) {
          const deadlineMs = new Date(deadline).getTime();
          const diff = Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000));
          setTimeRemaining(diff);
        }

        const eventSnap = await getDoc(doc(db, 'events', decodedEventId));
        if (eventSnap.exists()) {
          const data = eventSnap.data();
          let eventDateDisplay = 'TBD';
          let eventTimeDisplay = '';

          if (data.startTime) {
            const date = new Date(data.startTime);
            if (!isNaN(date.getTime())) {
              eventDateDisplay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              eventTimeDisplay = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            }
          } else if (data.date) {
            eventDateDisplay = data.date;
            if (data.time) eventTimeDisplay = data.time;
          }

          setEventData({
            id: decodedEventId,
            title: data.title || 'Circuit Event',
            price: data.price || 28,
            city: data.location || 'TBD',
            venue: data.venue || 'TBD',
            date: eventDateDisplay,
            time: eventTimeDisplay,
            ageRange: data.ageRange || data.ageGroup || 'All',
          });
        }

        setLoading(false);
      } catch (err) {
        console.error('Error validating token:', err);
        setError('Invalid or corrupted claim link.');
        setLoading(false);
      }
    };

    validateToken();
  }, [token, email]);

  useEffect(() => {
    if (timeRemaining <= 0) return;
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setError('⏰ Your claim window has expired. This offer is no longer available.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeRemaining]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}h ${m}m ${s}s`;
  };

  const handleClaim = async () => {
    if (!eventData) return;
    setActionLoading(true);
    setError('');

    try {
      const claimWaitlistSpot = httpsCallable(functions, 'claimWaitlistSpot');
      await claimWaitlistSpot({
        eventId: eventData.id,
        email: userEmail,
        token: token,
      });
        const slug = buildEventSlug(
        {
          location: eventData.city,
          ageRange: eventData.ageRange,
          date: eventData.date,
          time: eventData.time,
        },
        userGender
      );

      //  Fixed: use userEmail instead of undefined 'entry'
      navigate('/event-profile', {
        state: {
          eventId: eventData.id,
          eventTitle: eventData.title,
          selectedGender: userGender,
          price: eventData.price,
          city: eventData.city,
          venue: eventData.venue,
          date: eventData.date,
          time: eventData.time,
          ageRange: eventData.ageRange,
          phoneNumber: userPhone,
          email: userEmail,                    
          waitlistEmail: userEmail,            
          userAccountEmail: userEmail,         
          token: token,
          isClaim: true,
          phoneVerified: true,
          slug,
        },
      });
    } catch (err) {
      console.error('Error claiming spot:', err);
      setError(err.message || 'Failed to claim your spot. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!eventData) return;
    setActionLoading(true);

    try {
      const normalizedEmail = userEmail.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
      const waitlistRef = doc(db, 'events', eventData.id, 'waitlist', normalizedEmail);
      await updateDoc(waitlistRef, {
        status: 'declined',
        declinedAt: new Date(),
      });

      try {
        const promoteNextInLine = httpsCallable(functions, 'promoteNextInLine');
        await promoteNextInLine({ eventId: eventData.id, gender: userGender });
      } catch (promoteErr) {
        console.warn('Could not promote next in line:', promoteErr);
      }

      navigate('/events');
    } catch (err) {
      console.error('Error declining spot:', err);
      setError('Failed to decline spot. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <p>Checking your spot availability...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.errorIcon}>⚠️</div>
          <h1 className={styles.title}>Claim Spot</h1>
          <p className={styles.error}>{error}</p>
          <button onClick={() => navigate('/events')} className={styles.btn}>
            Browse Other Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.successIcon}>⚡</div>
        <h1 className={styles.title}>You've Been Promoted!</h1>
        <p className={styles.subtitle}>
          A spot opened up for <strong>{eventData?.title}</strong>
        </p>

        <div className={styles.eventInfo}>
          <div className={styles.infoRow}>
            <span>📅 Date:</span>
            <span>{eventData?.date} {eventData?.time && `at ${eventData?.time}`}</span>
          </div>
          <div className={styles.infoRow}>
            <span>📍 Venue:</span>
            <span>{eventData?.venue} ({eventData?.city})</span>
          </div>
          <div className={styles.infoRow}>
            <span>💳 Price:</span>
            <span>${eventData?.price}</span>
          </div>
          <div className={styles.infoRow}>
            <span>📧 Email:</span>
            <span>{userEmail}</span>
          </div>
        </div>

        <div className={styles.timerSection}>
          <div className={styles.timerLabel}>⏰ Time remaining to claim your spot:</div>
          <div className={styles.timer}>{formatTime(timeRemaining)}</div>
        </div>

        <button
          onClick={handleClaim}
          disabled={actionLoading}
          className={styles.claimBtn}
        >
          {actionLoading ? 'Claiming...' : `🎯 Claim My Spot – $${eventData?.price}`}
        </button>

        <button
          onClick={handleDecline}
          disabled={actionLoading}
          className={styles.secondaryBtn}
        >
          {actionLoading ? 'Processing...' : 'Decline Spot'}
        </button>
      </div>
    </div>
  );
};

export default ClaimSpot;