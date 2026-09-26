import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth, db, functions } from '../firebaseConfig';
import {
  collection,
  collectionGroup,
  query,
  where,
  getDocs,
  getDoc,
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

        // ==========================================================
        // 🔥 FAST: One collectionGroup query for ALL waitlist entries
        // for this email, across every event
        // ==========================================================
        const waitlistGroupQuery = query(
          collectionGroup(db, 'waitlist'),
          where('email', '==', userEmail)
        );

        let waitlistSnapshot;
        try {
          waitlistSnapshot = await getDocs(waitlistGroupQuery);
        } catch (cgErr) {
          console.warn('collectionGroup query failed, falling back to per-event scan', cgErr);
          waitlistSnapshot = null;
        }

        // If collectionGroup returned no results, try userId fallback
        let userIdSnapshot = null;
        if ((!waitlistSnapshot || waitlistSnapshot.empty) && userId) {
          try {
            const userGroupQuery = query(
              collectionGroup(db, 'waitlist'),
              where('userId', '==', userId)
            );
            userIdSnapshot = await getDocs(userGroupQuery);
          } catch (cgErr) {
            console.warn('collectionGroup by userId failed:', cgErr);
          }
        }

        // ==========================================================
        // 🔥 FALLBACK: If collectionGroup isn't available (no index)
        // fall back to the old per-event loop so the page still works
        // ==========================================================
        if (!waitlistSnapshot && !userIdSnapshot) {
          console.log('⚠️ collectionGroup unavailable, falling back to per-event scan');

          const eventsRef = collection(db, 'events');
          const eventsSnapshot = await getDocs(eventsRef);

          const getPositionCF = httpsCallable(functions, 'getWaitlistPosition');
          const eventFetches = eventsSnapshot.docs.map(async (eventDoc) => {
            const waitlistRef = collection(eventDoc.ref, 'waitlist');

            const emailQuery = query(waitlistRef, where('email', '==', userEmail));
            let waitlistSnapLocal = await getDocs(emailQuery);

            if (waitlistSnapLocal.empty && userId) {
              const userIdQuery = query(waitlistRef, where('userId', '==', userId));
              waitlistSnapLocal = await getDocs(userIdQuery);
            }

            if (waitlistSnapLocal.empty) return null;

            const waitlistDoc = waitlistSnapLocal.docs[0];
            const data = waitlistDoc.data();
            const eventData = eventDoc.data();

            // Position
            let position = 0;
            if (data.status === 'waiting') {
              try {
                const result = await getPositionCF({
                  eventId: eventDoc.id,
                  email: data.email || userEmail,
                });
                position = result.data?.position || 0;
              } catch (posErr) {
                console.warn(`Position fetch failed for ${eventDoc.id}:`, posErr);
              }
            }

            // Claim deadline
            let claimDeadline = null;
            if (data.claimDeadline?.toDate) claimDeadline = data.claimDeadline.toDate();
            else if (data.claimDeadline) claimDeadline = new Date(data.claimDeadline);

            const isClaimValid =
              data.status === 'promoted' &&
              claimDeadline &&
              new Date() < claimDeadline;

            // Date/time display
            let eventDateDisplay = 'TBD';
            let eventTimeDisplay = '';
            if (eventData.startTime) {
              const date = new Date(eventData.startTime);
              if (!isNaN(date.getTime())) {
                eventDateDisplay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                eventTimeDisplay = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
              }
            } else if (eventData.date) {
              const date = new Date(eventData.date);
              if (!isNaN(date.getTime())) {
                eventDateDisplay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              }
              if (eventData.time) eventTimeDisplay = eventData.time;
            }

            let joinedAt = new Date();
            if (data.joinedAt?.toDate) joinedAt = data.joinedAt.toDate();
            else if (data.joinedAt) {
              const parsed = new Date(data.joinedAt);
              if (!isNaN(parsed.getTime())) joinedAt = parsed;
            }

            // Ticket label
            const getTicketLabel = (gender) => {
              if (!gender) return 'Ticket';
              const g = gender.toLowerCase();
              if (g === 'male' || g === 'men') return "Men's Ticket";
              if (g === 'female' || g === 'women') return "Women's Ticket";
              if (g === 'queer men') return "Queer Men's Ticket";
              if (g === 'queer women') return "Queer Women's Ticket";
              if (g === 'queer') return "Queer Ticket";
              return `${gender} Ticket`;
            };

            return {
              eventId: eventDoc.id,
              eventTitle: eventData.title || 'Untitled Event',
              eventDate: eventDateDisplay,
              eventTime: eventTimeDisplay,
              email: data.email || userEmail,
              phoneNumber: data.phoneNumber || 'Not provided',
              gender: data.gender || '',
              ticketLabel: getTicketLabel(data.gender),
              position: position,
              status: data.status || 'waiting',
              joinedAt: joinedAt,
              claimDeadline: claimDeadline,
              claimToken: data.claimToken || null,
              isClaimValid: isClaimValid,
            };
          });

          const results = await Promise.all(eventFetches);
          const entries = results.filter(Boolean);
          entries.sort((a, b) => b.joinedAt.getTime() - a.joinedAt.getTime());

          console.log('✅ My Waitlist entries (fallback):', entries);
          setWaitlistEntries(entries);
          return;
        }

        // ==========================================================
        // ✅ FAST PATH: We got a collectionGroup snapshot
        // Combine email + userId results if both exist
        // ==========================================================
        const docsById = new Map();

        if (waitlistSnapshot) {
          waitlistSnapshot.docs.forEach((d) => docsById.set(d.ref.path, d));
        }
        if (userIdSnapshot) {
          userIdSnapshot.docs.forEach((d) => docsById.set(d.ref.path, d));
        }

        const allDocs = Array.from(docsById.values());

        const getPositionCF = httpsCallable(functions, 'getWaitlistPosition');

        const eventFetches = allDocs.map(async (waitlistDoc) => {
          const data = waitlistDoc.data();
          const eventRef = waitlistDoc.ref.parent.parent;
          if (!eventRef) return null;
          const eventId = eventRef.id;

          // 🔥 Parallel: fetch event doc + compute position at same time
          const [eventSnap, positionResult] = await Promise.all([
            getDoc(eventRef),
            data.status === 'waiting'
              ? getPositionCF({ eventId, email: data.email || userEmail })
                  .catch((posErr) => {
                    console.warn(`Position fetch failed for ${eventId}:`, posErr);
                    return { data: { position: 0 } };
                  })
              : Promise.resolve({ data: { position: 0 } }),
          ]);

          if (!eventSnap.exists()) return null;
          const eventData = eventSnap.data();

          const position = positionResult?.data?.position || 0;

          // Claim deadline
          let claimDeadline = null;
          if (data.claimDeadline?.toDate) claimDeadline = data.claimDeadline.toDate();
          else if (data.claimDeadline) claimDeadline = new Date(data.claimDeadline);

          const isClaimValid =
            data.status === 'promoted' &&
            claimDeadline &&
            new Date() < claimDeadline;

          // Date/time display
          let eventDateDisplay = 'TBD';
          let eventTimeDisplay = '';
          if (eventData.startTime) {
            const date = new Date(eventData.startTime);
            if (!isNaN(date.getTime())) {
              eventDateDisplay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              eventTimeDisplay = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            }
          } else if (eventData.date) {
            const date = new Date(eventData.date);
            if (!isNaN(date.getTime())) {
              eventDateDisplay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }
            if (eventData.time) eventTimeDisplay = eventData.time;
          }

          let joinedAt = new Date();
          if (data.joinedAt?.toDate) joinedAt = data.joinedAt.toDate();
          else if (data.joinedAt) {
            const parsed = new Date(data.joinedAt);
            if (!isNaN(parsed.getTime())) joinedAt = parsed;
          }

          // Ticket label
          const getTicketLabel = (gender) => {
            if (!gender) return 'Ticket';
            const g = gender.toLowerCase();
            if (g === 'male' || g === 'men') return "Men's Ticket";
            if (g === 'female' || g === 'women') return "Women's Ticket";
            if (g === 'queer men') return "Queer Men's Ticket";
            if (g === 'queer women') return "Queer Women's Ticket";
            if (g === 'queer') return "Queer Ticket";
            return `${gender} Ticket`;
          };

          return {
            eventId,
            eventTitle: eventData.title || 'Untitled Event',
            eventDate: eventDateDisplay,
            eventTime: eventTimeDisplay,
            email: data.email || userEmail,
            phoneNumber: data.phoneNumber || 'Not provided',
            gender: data.gender || '',
            ticketLabel: getTicketLabel(data.gender),
            position: position,
            status: data.status || 'waiting',
            joinedAt: joinedAt,
            claimDeadline: claimDeadline,
            claimToken: data.claimToken || null,
            isClaimValid: isClaimValid,
          };
        });

        const results = await Promise.all(eventFetches);
        const entries = results.filter(Boolean);
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