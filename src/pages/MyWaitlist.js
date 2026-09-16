import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth, db, functions } from '../firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import styles from './MyWaitlist.module.css';

const MyWaitlist = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get('email');

  const [waitlistEntries, setWaitlistEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = auth.currentUser;

    if (!user && !emailFromUrl) {
      navigate('/login');
      return;
    }

    const fetchWaitlist = async () => {
      try {
        setLoading(true);
        setError('');

        const userEmail = emailFromUrl || user?.email?.toLowerCase().trim();
        const userId = user?.uid;

        console.log('🔍 User email:', userEmail);
        console.log('🔍 User ID:', userId);

        if (!userEmail) {
          setError('No email found.');
          setLoading(false);
          return;
        }

        const eventsRef = collection(db, 'events');
        const eventsSnapshot = await getDocs(eventsRef);

        const entries = [];

        const getPosition = httpsCallable(functions, 'getWaitlistPosition');

        for (const eventDoc of eventsSnapshot.docs) {
          const waitlistRef = collection(eventDoc.ref, 'waitlist');

          // Query by email (primary key)
          const emailQuery = query(waitlistRef, where('email', '==', userEmail));
          let waitlistSnapshot = await getDocs(emailQuery);

          // Fallback to userId if email not found
          if (waitlistSnapshot.empty && userId) {
            console.log('⚠️ No entries found by email, trying userId...');
            const userIdQuery = query(waitlistRef, where('userId', '==', userId));
            waitlistSnapshot = await getDocs(userIdQuery);
          }

          if (waitlistSnapshot.empty) {
            continue;
          }

          const waitlistDoc = waitlistSnapshot.docs[0];
          const data = waitlistDoc.data();

          console.log('🔍 Waitlist entry found for event:', eventDoc.id);
          console.log('🔍 Waitlist email from document:', data.email);
          console.log('🔍 Waitlist userId from document:', data.userId);

          const eventData = eventDoc.data();

          // Calculate position
          let position = 0;

          if (data.status === 'waiting') {
            try {
              const result = await getPosition({
                eventId: eventDoc.id,
                email: data.email || userEmail,
              });
              position = result.data?.position || 0;
            } catch (positionError) {
              console.warn(`Could not get position for ${eventDoc.id}:`, positionError);
              // Fallback: calculate manually
              try {
                const gender = data.gender;
                if (gender) {
                  const allWaitlistSnapshot = await getDocs(
                    query(
                      waitlistRef,
                      where('gender', '==', gender),
                      where('status', '==', 'waiting')
                    )
                  );
                  const waitingEntries = allWaitlistSnapshot.docs
                    .map((doc) => ({ id: doc.id, ...doc.data() }))
                    .filter((entry) => entry.joinedAt)
                    .sort((a, b) => {
                      const aTime = a.joinedAt?.toMillis?.() || 0;
                      const bTime = b.joinedAt?.toMillis?.() || 0;
                      return aTime - bTime;
                    });
                  const userIndex = waitingEntries.findIndex(
                    (entry) => entry.email === userEmail || (userId && entry.userId === userId)
                  );
                  if (userIndex !== -1) {
                    position = userIndex + 1;
                  }
                }
              } catch (fallbackError) {
                console.warn('Fallback position calculation failed:', fallbackError);
              }
            }
          }

          // Check claim deadline
          let claimDeadline = null;
          if (data.claimDeadline?.toDate) {
            claimDeadline = data.claimDeadline.toDate();
          } else if (data.claimDeadline) {
            claimDeadline = new Date(data.claimDeadline);
          }

          const isClaimValid =
            data.status === 'promoted' &&
            claimDeadline &&
            new Date() < claimDeadline;

          // Format event date/time
          let eventDateDisplay = 'TBD';
          let eventTimeDisplay = '';

          if (eventData.startTime) {
            const date = new Date(eventData.startTime);
            if (!isNaN(date.getTime())) {
              eventDateDisplay = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              eventTimeDisplay = date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              });
            }
          } else if (eventData.date) {
            const date = new Date(eventData.date);
            if (!isNaN(date.getTime())) {
              eventDateDisplay = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
            }
            if (eventData.time) {
              eventTimeDisplay = eventData.time;
            }
          }

          let joinedAt = new Date();
          if (data.joinedAt?.toDate) {
            joinedAt = data.joinedAt.toDate();
          } else if (data.joinedAt) {
            const parsedJoinedAt = new Date(data.joinedAt);
            if (!isNaN(parsedJoinedAt.getTime())) {
              joinedAt = parsedJoinedAt;
            }
          }

          // ==========================================================
          // 🔥 NEW: Build ticket label from gender
          // ==========================================================
          const getTicketLabel = (gender) => {
            if (!gender) return 'Ticket';
            const g = gender.toLowerCase();
            if (g === 'male' || g === 'men') return "Men's Ticket";
            if (g === 'female' || g === 'women') return "Women's Ticket";
            return `${gender} Ticket`;
          };

          entries.push({
            eventId: eventDoc.id,
            eventTitle: eventData.title || 'Untitled Event',
            eventDate: eventDateDisplay,
            eventTime: eventTimeDisplay,
            email: data.email || userEmail,
            phoneNumber: data.phoneNumber || 'Not provided', // 🔥 added phone
            gender: data.gender || '',
            ticketLabel: getTicketLabel(data.gender), // 🔥 new field
            position: position,
            status: data.status || 'waiting',
            joinedAt: joinedAt,
            claimDeadline: claimDeadline,
            claimToken: data.claimToken || null,
            isClaimValid: isClaimValid,
          });
        }

        entries.sort((a, b) => b.joinedAt.getTime() - a.joinedAt.getTime());

        console.log('✅ My Waitlist entries:', entries);
        setWaitlistEntries(entries);

      } catch (err) {
        console.error('❌ Error fetching waitlist:', err);
        setError('Failed to load your waitlist. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchWaitlist();

  }, [navigate, emailFromUrl]);

  // ======================================================
  // LEAVE WAITLIST
  // ======================================================
  const handleLeaveWaitlist = async (eventId, email) => {
    const confirmed = window.confirm('Are you sure you want to leave this waitlist?');
    if (!confirmed) return;

    try {
      const leaveWaitlist = httpsCallable(functions, 'leaveWaitlist');
      await leaveWaitlist({ eventId: eventId, email: email });
      setWaitlistEntries((prev) => prev.filter((entry) => entry.eventId !== eventId));
      alert('You have left the waitlist.');
    } catch (err) {
      console.error('❌ Error leaving waitlist:', err);
      if (err?.code === 'functions/not-found') {
        alert('You are no longer on this waitlist.');
        setWaitlistEntries((prev) => prev.filter((entry) => entry.eventId !== eventId));
      } else {
        alert('Failed to leave the waitlist. Please try again.');
      }
    }
  };

  // ======================================================
  // CLAIM SPOT
  // ======================================================
  const handleClaimSpot = (entry) => {
    if (!entry.claimToken) return;
    navigate(
      `/claim-spot?token=${encodeURIComponent(entry.claimToken)}&email=${encodeURIComponent(entry.email)}`
    );
  };

  // ======================================================
  // STATUS DISPLAY
  // ======================================================
  const getStatusDisplay = (entry) => {
    if (entry.status === 'waiting') {
      return <span className={styles.statusWaiting}>Waiting</span>;
    }
    if (entry.status === 'promoted' && entry.isClaimValid) {
      return <span className={styles.statusPromoted}>🎉 Claim Now!</span>;
    }
    if (entry.status === 'promoted' && !entry.isClaimValid) {
      return <span className={styles.statusExpired}>⏰ Expired</span>;
    }
    if (entry.status === 'expired') {
      return <span className={styles.statusExpired}>⏰ Expired</span>;
    }
    if (entry.status === 'claimed') {
      return <span className={styles.statusPromoted}>✓ Claimed</span>;
    }
    return <span className={styles.statusWaiting}>{entry.status}</span>;
  };

  // ======================================================
  // LOADING
  // ======================================================
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingSpinner}>Loading your waitlist...</div>
      </div>
    );
  }

  // ======================================================
  // PAGE
  // ======================================================
  return (
    <div className={styles.container}>
      <button onClick={() => navigate('/events')} className={styles.backBtn}>
        ← Back to Events
      </button>

      <h1 className={styles.title}>My Waitlist</h1>

      {error && <div className={styles.error}>{error}</div>}

      {waitlistEntries.length === 0 ? (
        <div className={styles.empty}>
          <p>You're not on any waitlists.</p>
          <button onClick={() => navigate('/events')} className={styles.claimBtn}>
            Browse Events
          </button>
        </div>
      ) : (
        <div className={styles.list}>
          {waitlistEntries.map((entry) => (
            <div key={entry.eventId} className={styles.card}>
              <h3>{entry.eventTitle}</h3>
              <p>
                <strong>Email:</strong> {entry.email}
              </p>
              <p>
                <strong>Phone:</strong> {entry.phoneNumber}
              </p>
              <p>
                <strong>Ticket Type:</strong> {entry.ticketLabel}
              </p>
              <p>
                <strong>Date:</strong> {entry.eventDate}
                {entry.eventTime && ` at ${entry.eventTime}`}
              </p>
              {entry.status === 'waiting' && entry.position > 0 && (
                <p>
                  <strong>Position:</strong> #{entry.position}
                </p>
              )}
              <p>
                <strong>Status:</strong> {getStatusDisplay(entry)}
              </p>
              <p>
                <strong>Joined:</strong>{' '}
                {entry.joinedAt.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>

              {entry.status === 'promoted' && entry.isClaimValid && entry.claimToken && (
                <button onClick={() => handleClaimSpot(entry)} className={styles.claimBtn}>
                  🎉 Claim Your Spot
                </button>
              )}

              {entry.status === 'waiting' && (
                <button
                  onClick={() => handleLeaveWaitlist(entry.eventId, entry.email)}
                  className={styles.leaveBtn}
                >
                  Leave Waitlist
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyWaitlist;