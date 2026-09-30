import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, auth, functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { IoChevronBack, IoLocationSharp } from 'react-icons/io5';
import styles from './EventsPage.module.css';
import { buildEventSlug } from '../utils/slugUtils';

const EventsPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('All');

  const [cities, setCities] = useState(['All']);
  const ageGroups = ['All', '25-34', '35-44', '45-55'];

  // Modal state for general feedback (e.g., already on waitlist)
  const [modal, setModal] = useState({
    show: false,
    title: '',
    message: '',
    redirectTo: null,
    showWaitlistButton: false,
    email: '',
  });

  // Waitlist pop-up states
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistPhone, setWaitlistPhone] = useState('');
  const [selectedEventForWaitlist, setSelectedEventForWaitlist] = useState(null);
  const [selectedGenderForWaitlist, setSelectedGenderForWaitlist] = useState('');
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistPosition, setWaitlistPosition] = useState(null);
  const [error, setError] = useState('');

  // Country code for phone input
  const [countryCode, setCountryCode] = useState('+1');
  const countryCodes = [
    { code: '+1', label: '🇺🇸 +1' },
    { code: '+266', label: '🇱🇸 +266' },
  ];

  // Auto-close modal and redirect after 3 seconds
  useEffect(() => {
    if (modal.show && modal.redirectTo) {
      const timer = setTimeout(() => {
        setModal({ show: false, title: '', message: '', redirectTo: null, showWaitlistButton: false, email: '' });
        navigate(modal.redirectTo);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [modal.show, modal.redirectTo, navigate]);

  // Fetch events
  useEffect(() => {
    const eventsRef = collection(db, 'events');
    const unsubscribe = onSnapshot(eventsRef, (snapshot) => {
      const eventsData = [];
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      snapshot.forEach((doc) => {
        const event = { id: doc.id, ...doc.data() };
        let eventDate = null;
        if (event.startTime) eventDate = new Date(event.startTime);
        else if (event.date) eventDate = new Date(event.date);

        if (eventDate) {
          const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
          if (eventDay >= today) eventsData.push(event);
        } else {
          eventsData.push(event);
        }
      });

      setEvents(eventsData);
      setLoading(false);
      const citySet = new Set(eventsData.map(e => e.location).filter(Boolean));
      setCities(['All', ...Array.from(citySet)]);
    }, (error) => {
      console.error('Error fetching events:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Helper to convert audience codes
  const getAudienceLabel = (code) => {
    const map = {
      'men-women': 'Men & Women',
      'queer-women': 'Queer Women',
      'queer-men': 'Queer Men',
      'queer-men-women': 'Queer Men & Women'
    };
    return map[code] || code;
  };

  // 🔥 NEW: Queer audience detection
  const isQueerAudience = (audience) => {
    return audience && (audience === 'Queer Women' || audience === 'Queer Men' || audience === 'Queer Men & Women');
  };

  // 🔥 NEW: Get button label for queer events
  const getQueerLabel = (audience) => {
    if (audience === 'Queer Women') return 'Queer Women';
    if (audience === 'Queer Men') return 'Queer Men';
    if (audience === 'Queer Men & Women') return 'Queer';
    return 'Queer';
  };

  const filteredEvents = events.filter(event => {
    const cityMatch = selectedCity === 'All' || event.location === selectedCity;
    const ageMatch = selectedAgeGroup === 'All' || event.ageRange === selectedAgeGroup || event.ageGroup === selectedAgeGroup;
    return cityMatch && ageMatch;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const dateA = a.startTime ? new Date(a.startTime) : new Date(a.date || '9999-12-31');
    const dateB = b.startTime ? new Date(b.startTime) : new Date(b.date || '9999-12-31');
    return dateA - dateB;
  });
 const handleBuyTicket = (event, selectedGender) => {
  let formattedTime = null;
  if (event.time) formattedTime = event.time;
  else if (event.startTime) {
    const date = new Date(event.startTime);
    if (!isNaN(date.getTime())) {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'p' : 'a';
      const hour12 = hours % 12 || 12;
      formattedTime = `${hour12}:${minutes.toString().padStart(2, '0')}${ampm}`;
    }
  }
  if (!formattedTime) formattedTime = 'Time TBD';

  const slug = buildEventSlug(event, selectedGender);

  navigate(`/register/${slug}?eventId=${encodeURIComponent(event.id)}&gender=${encodeURIComponent(selectedGender)}`, {
    state: {
      eventId: event.id,
      eventTitle: event.title || 'Event',
      selectedGender,
      price: event.price || 28,
      city: event.location || 'Unknown',
      venue: event.venue || 'TBD',
      date: event.date || event.startTime || null,
      time: formattedTime,
      ageRange: event.ageRange || event.ageGroup || 'All',
    },
  });
};
  const handleWaitlistSubmit = async () => {
    if (!waitlistEmail || !waitlistEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    const phoneDigits = waitlistPhone.replace(/\D/g, '');
    if (phoneDigits.length < 8) {
      setError('Please enter a valid phone number (at least 10 digits)');
      return;
    }

    const fullPhoneNumber = countryCode + phoneDigits;

    setWaitlistLoading(true);
    setError('');

    try {
      const joinWaitlist = httpsCallable(functions, 'joinWaitlist');
      const result = await joinWaitlist({
        eventId: selectedEventForWaitlist,
        gender: selectedGenderForWaitlist,
        email: waitlistEmail,
        phoneNumber: fullPhoneNumber,
      });

      if (result.data.success) {
        const position = result.data.position || '?';
        setWaitlistPosition(position);
        setWaitlistSuccess(true);
      }
    } catch (err) {
      console.error('Error joining waitlist:', err);

      const errorCode = err.code || '';
      const errorMessage = err.message || '';

      if (errorCode === 'already-exists' || 
          errorMessage.toLowerCase().includes('already on waitlist') ||
          errorMessage.toLowerCase().includes('already on the waitlist')) {
        setShowWaitlistModal(false);
        setWaitlistEmail('');
        setError('');
        setWaitlistLoading(false);
        
        const event = events.find(e => e.id === selectedEventForWaitlist);
        const eventTitle = event?.title || 'this event';
        setModal({
          show: true,
          title: 'Already on waitlist',
          message: `You are already on the waitlist for "${eventTitle}". Check your position in "My Waitlist".`,
          redirectTo: null,
          showWaitlistButton: true,
          email: waitlistEmail,
        });
        return;
      }

      setError('Failed to join waitlist. Please try again later.');
    } finally {
      setWaitlistLoading(false);
    }
  };

  const formatEventDate = (event) => {
    if (event.startTime) {
      const date = new Date(event.startTime);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    if (event.date) {
      const date = new Date(event.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return 'Date TBD';
  };

  const formatEventTime = (event) => {
    if (event.startTime) {
      const date = new Date(event.startTime);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    if (event.time) return event.time;
    return 'Time TBD';
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
          <div style={{ fontSize: '18px', color: '#52525b' }}>Loading events...</div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className={styles.container}>
        <button onClick={() => navigate('/')} className={styles.backBtn}>
          <IoChevronBack size={24} />
          <span>Back to Home</span>
        </button>
        <h1 className={styles.title}>Upcoming Events</h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
          <div style={{ fontSize: '18px', color: '#52525b' }}>No upcoming events available at the moment. Check back later!</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button onClick={() => navigate('/')} className={styles.backBtn}>
        <IoChevronBack size={24} />
        <span>Back to Home</span>
      </button>

      <h1 className={styles.title}>Upcoming Events</h1>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>City</label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className={styles.filterSelect}
          >
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Age Group</label>
          <select
            value={selectedAgeGroup}
            onChange={(e) => setSelectedAgeGroup(e.target.value)}
            className={styles.filterSelect}
          >
            {ageGroups.map(age => (
              <option key={age} value={age}>{age}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.eventsGrid}>
        {sortedEvents.map((event) => {
          const womenSpots = event.womenSpots || 0;
          const menSpots = event.menSpots || 0;

          return (
            <div key={event.id} className={styles.eventCard}>
              {event.recurring && (
                <div className={styles.recurringBadge}>Recurring</div>
              )}

              <div className={styles.cardHeader}>
                <span className={styles.eventTitleText}>{event.title || 'Untitled Event'}</span>
                <span className={styles.divider}>|</span>
                <span className={styles.eventInfo}>{formatEventDate(event)}</span>
                <span className={styles.divider}>|</span>
                <span className={styles.eventInfo}>{formatEventTime(event)}</span>
              </div>

              <div className={styles.cardSubHeader}>
                <IoLocationSharp size={16} />
                <span>{event.location || 'TBD'}</span>
                <span className={styles.divider}>|</span>
                <span>{event.venue || 'TBD'}</span>
              </div>

              <div className={styles.ageInfo}>
                Ages: {event.ageRange || event.ageGroup || 'All'} 
                {event.audience && (
                  <>
                    <span className={styles.divider}>|</span>
                    <span>{getAudienceLabel(event.audience)}</span>
                  </>
                )}
              </div>

              {/* 🔥 UPDATED: Queer event support */}
              <div className={styles.genderButtons}>
                {isQueerAudience(event.audience) ? (
                  /* Queer event – single button */
                  (() => {
                    const totalSpots = (event.menSpots || 0) + (event.womenSpots || 0);
                    const totalSignups = (event.menSignupCount || 0) + (event.womenSignupCount || 0);
                    const available = totalSpots - totalSignups;
                    const queerLabel = getQueerLabel(event.audience);

                    return available > 0 ? (
                      <button
                        onClick={() => handleBuyTicket(event, queerLabel)}
                        className={styles.genderBtn}
                      >
                        <span className={styles.genderLabel}>{queerLabel}</span>
                        <span className={styles.registerLabel}>Register</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedEventForWaitlist(event.id);
                          setSelectedGenderForWaitlist(queerLabel);
                          setShowWaitlistModal(true);
                          setWaitlistEmail('');
                          setWaitlistPhone('');
                          setWaitlistSuccess(false);
                          setError('');
                        }}
                        className={`${styles.genderBtn} ${styles.waitlistBtn}`}
                      >
                        <span className={styles.genderLabel}>{queerLabel}</span>
                        <span className={styles.waitlistLabel}>Join Waitlist</span>
                      </button>
                    );
                  })()
                ) : (
                  /* Standard event – Women + Men buttons (existing behavior) */
                  <>
                    {/* Women Button */}
                    {womenSpots > 0 ? (
                      <button onClick={() => handleBuyTicket(event, 'Women')} className={styles.genderBtn}>
                        <span className={styles.genderLabel}>Women</span>
                        <span className={styles.registerLabel}>Register</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          setSelectedEventForWaitlist(event.id);
                          setSelectedGenderForWaitlist('Female');
                          setShowWaitlistModal(true);
                          setWaitlistEmail('');
                          setWaitlistPhone('');
                          setWaitlistSuccess(false);
                          setError('');
                        }} 
                        className={`${styles.genderBtn} ${styles.waitlistBtn}`}
                      >
                        <span className={styles.genderLabel}>Women</span>
                        <span className={styles.waitlistLabel}>Join Waitlist</span>
                      </button>
                    )}

                    {/* Men Button */}
                    {menSpots > 0 ? (
                      <button onClick={() => handleBuyTicket(event, 'Men')} className={styles.genderBtn}>
                        <span className={styles.genderLabel}>Men</span>
                        <span className={styles.registerLabel}>Register</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          setSelectedEventForWaitlist(event.id);
                          setSelectedGenderForWaitlist('Male');
                          setShowWaitlistModal(true);
                          setWaitlistEmail('');
                          setWaitlistPhone('');
                          setWaitlistSuccess(false);
                          setError('');
                        }} 
                        className={`${styles.genderBtn} ${styles.waitlistBtn}`}
                      >
                        <span className={styles.genderLabel}>Men</span>
                        <span className={styles.waitlistLabel}>Join Waitlist</span>
                      </button>
                    )}
                  </>
                )}
              </div>

              {event.recurring && (
                <div className={styles.recurringText}>{event.recurring}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Waitlist Pop-up */}
      {showWaitlistModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            {!waitlistSuccess ? (
              <>
                <h2 className={styles.modalTitle}>Join the Waitlist</h2>
                <p className={styles.modalMessage}>
                  Enter your email address below and we'll notify you if a spot becomes available!
                </p>
                
                <div className={styles.waitlistForm}>
                  <label className={styles.waitlistLabel}>Email Address</label>
                  <input
                    type="email"
                    className={styles.waitlistInput}
                    placeholder="you@email.com"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    disabled={waitlistLoading}
                    autoFocus
                  />
                </div>

                <div className={styles.waitlistForm}>
                  <label className={styles.waitlistLabel}>Phone Number</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      className={styles.waitlistInput}
                      style={{ width: '100px', flexShrink: 0 }}
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      disabled={waitlistLoading}
                    >
                      {countryCodes.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      className={styles.waitlistInput}
                      placeholder="123-456-7890"
                      value={waitlistPhone}
                      onChange={(e) => setWaitlistPhone(e.target.value)}
                      disabled={waitlistLoading}
                    />
                  </div>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.modalActions}>
                  <button
                    className={styles.modalCancelBtn}
                    onClick={() => {
                      setShowWaitlistModal(false);
                      setWaitlistEmail('');
                      setWaitlistPhone('');
                      setError('');
                      setWaitlistLoading(false);
                    }}
                    disabled={waitlistLoading}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.modalConfirmBtn}
                    onClick={handleWaitlistSubmit}
                    disabled={waitlistLoading || !waitlistEmail || !waitlistPhone}
                  >
                    {waitlistLoading ? 'Joining...' : 'Join Waitlist'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className={styles.modalTitle}>🎉 You're on the waitlist!</h2>
                <p className={styles.modalMessage}>
                  You're currently <strong>#{waitlistPosition}</strong> on the waitlist for this event.
                  <br /><br />
                  We'll notify you at <strong>{waitlistEmail}</strong> if a spot becomes available.
                </p>
                <div className={styles.modalActions}>
                  <button
                    className={styles.modalCancelBtn}
                    onClick={() => {
                      setShowWaitlistModal(false);
                      setWaitlistSuccess(false);
                      setWaitlistEmail('');
                      setWaitlistPhone('');
                      setSelectedEventForWaitlist(null);
                      setSelectedGenderForWaitlist('');
                    }}
                  >
                    Got it!
                  </button>
                  <button
                    className={styles.modalConfirmBtn}
                    onClick={() => {
                      setShowWaitlistModal(false);
                      setWaitlistSuccess(false);
                      navigate(`/my-waitlist?email=${encodeURIComponent(waitlistEmail)}`);
                    }}
                  >
                    View My Waitlist
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* General Modal */}
      {modal.show && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <h2 className={styles.modalTitle}>{modal.title}</h2>
            <p className={styles.modalMessage}>{modal.message}</p>
            <div className={styles.modalActions}>
              <button
                className={styles.modalCancelBtn}
                onClick={() => {
                  setModal({ show: false, title: '', message: '', redirectTo: null, showWaitlistButton: false, email: '' });
                  if (modal.redirectTo) navigate(modal.redirectTo);
                }}
              >
                OK
              </button>
              {modal.showWaitlistButton && (
                <button
                  className={styles.modalConfirmBtn}
                  onClick={() => {
                    setModal({ show: false, title: '', message: '', redirectTo: null, showWaitlistButton: false, email: '' });
                    navigate(`/my-waitlist?email=${encodeURIComponent(modal.email)}`);
                  }}
                >
                  View My Waitlist
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;