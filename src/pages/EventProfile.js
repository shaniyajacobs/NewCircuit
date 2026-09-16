import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import styles from './EventProfile.module.css';

const EventProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    phoneNumber,
    eventId,
    eventTitle,
    selectedGender,
    price,
    city,
    venue,
    date,
    time,
    ageRange,
    phoneVerified,
    isClaim,
    email,
  } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
  });

  // --------------------------------------------------
  // Helpers
  // --------------------------------------------------
  const formatEventDate = () => {
    if (!date) return 'Date TBD';
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const year = d.getFullYear();
    return `${dayName} ${month}/${day}/${year}`;
  };

  const formatEventTime = () => {
    if (!time) return 'Time TBD';
    if (typeof time === 'string' && (time.includes('p') || time.includes('P') || time.includes('a') || time.includes('A'))) {
      return time;
    }
    try {
      const t = new Date(`2000-01-01T${time}`);
      if (!isNaN(t.getTime())) {
        const formatted = t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        return formatted.replace(' AM', 'a').replace(' PM', 'p');
      }
    } catch (e) {
      console.log('Time parsing error:', e);
    }
    return time;
  };

  // 🔥 Fix 1: Format gender for display – "Male" → "Men", "Female" → "Women"
  const formatGender = (gender) => {
    if (gender === 'Male') return 'Men';
    if (gender === 'Female') return 'Women';
    return gender;
  };

  // --------------------------------------------------
  // Effects & handlers
  // --------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserData(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  // Pre‑fill email from waitlist claim – runs once on mount
  useEffect(() => {
    if (isClaim && email) {
      setFormData((prev) => ({ ...prev, email }));
    }
  }, [isClaim, email]);

  const fetchUserData = async (userId) => {
    if (!userId) return;
    try {
      const userRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userRef);
      if (docSnap && docSnap.exists()) {
        const data = docSnap.data();
        if (data) {
          setFormData((prev) => ({
            ...prev,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            // ✅ Fix 2: Do NOT override email if we are in a claim flow (pre‑filled from waitlist)
            ...(isClaim ? {} : { email: data.email || '' }),
            dateOfBirth: data.birthDate || '',
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { firstName, lastName, email: formEmail, dateOfBirth } = formData;

    if (!firstName || !lastName || !formEmail || !dateOfBirth) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    try {
      // 🔥 FIX: Always use the phone number as userId
      const userId = phoneNumber;

      if (!userId) {
        setError('Missing phone number. Please go back and restart.');
        setLoading(false);
        return;
      }

      // If userId is still missing (fallback for claims)
      if (!userId && isClaim && email) {
        try {
          const emailKey = email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
          const waitlistRef = doc(db, 'events', eventId, 'waitlist', emailKey);
          const waitlistSnap = await getDoc(waitlistRef);
          if (waitlistSnap.exists()) {
            const waitlistData = waitlistSnap.data();
            if (waitlistData.phoneNumber) {
              userId = waitlistData.phoneNumber;
            }
          }
        } catch (err) {
          console.error('Could not fetch waitlist phone:', err);
        }
      }

      if (!userId) {
        setError('Missing user identifier. Please go back and restart.');
        setLoading(false);
        return;
      }

      const userRef = doc(db, 'users', userId);
      const userData = {
        firstName,
        lastName,
        email: formEmail,
        birthDate: dateOfBirth,
        phoneNumber,
        phoneVerified: true,
        updatedAt: new Date(),
      };

      if (!auth.currentUser) {
        userData.createdAt = new Date();
        userData.gender = selectedGender || '';
        userData.location = city || '';
        userData.datesRemaining = 0;
      }

      await setDoc(userRef, userData, { merge: true });

      navigate('/checkout', {
        state: {
          eventId,
          eventTitle,
          selectedGender,
          price,
          city,
          venue,
          date,
          time,
          ageRange,
          phoneNumber,
          uid: userId,
          email: formEmail,
          firstName,
          lastName,
          isClaim: isClaim || false,
        },
      });
    } catch (err) {
      console.error('Error:', err);
      setError(err?.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Complete Your Profile</h1>

        {/* 🔥 Fixed gender labels */}
        <p className={styles.subtitle}>
          You're registering for <strong>{eventTitle || 'Event'}</strong> as a{' '}
          <strong>{formatGender(selectedGender) || 'General'}</strong> attendee.
          {!isClaim && phoneVerified && (
            <span style={{ display: 'block', marginTop: '8px', color: '#22c55e' }}>
              ✅ Phone number verified
            </span>
          )}
          {isClaim && (
            <span style={{ display: 'block', marginTop: '8px', color: '#f59e0b' }}>
              🎫 You claimed a waitlist spot! Proceed to checkout.
            </span>
          )}
        </p>

        <div className={styles.eventInfoMini}>
          <span>📅 {formatEventDate()}</span>
          <span>🕐 {formatEventTime()}</span>
          <span>📍 {venue || 'TBD'}</span>
          {phoneNumber && <span>📱 {phoneNumber}</span>}
          {price && <span>💰 ${price}</span>}
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>First Name *</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Enter your first name"
              className={styles.input}
              required
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Last Name *</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Enter your last name"
              className={styles.input}
              required
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Email Address *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={styles.input}
              required
              disabled={loading || isClaim}
            />
            {isClaim && (
              <span style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Email pre-filled from your waitlist registration
              </span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label>Date of Birth *</label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className={styles.input}
              required
              disabled={loading}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className={styles.submitBtn}
          >
            {loading ? 'Saving...' : 'Continue to Checkout'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EventProfile;