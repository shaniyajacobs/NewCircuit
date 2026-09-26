import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { onAuthStateChanged } from 'firebase/auth';
import styles from './EventRegistration.module.css';
import circuitLogo from '../images/Cir_Primary_RGB_Mixed Black.png';

const EventRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    eventId,
    eventTitle,
    selectedGender,
    price,
    city,
    venue,
    date,
    time,
    ageRange,
  } = location.state || {};

  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [step] = useState('phone');

  // ✅ SMS consent state
  const [smsConsent, setSmsConsent] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const formatPhoneNumber = (number) => {
    let formatted = number.replace(/[^\d]/g, '');
    return countryCode + formatted;
  };

  const handleContinue = async () => {
    const fullNumber = formatPhoneNumber(phoneNumber);
    if (!phoneNumber || phoneNumber.length < 7) {
      setError('Please enter a valid phone number');
      return;
    }

    // ✅ Guard: require consent
    if (!smsConsent || !consentAccepted) {
      setError('Please accept the SMS consent to continue.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const sendOTP = httpsCallable(functions, 'sendOTP');
      await sendOTP({ phoneNumber: fullNumber });

      navigate('/verify-event-otp', {
        state: {
          phoneNumber: fullNumber,
          eventId,
          eventTitle,
          selectedGender,
          price,
          city,
          venue,
          date,
          time,
          ageRange,
        },
      });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const formatEventDate = () => {
    if (!date) return 'Date TBD';
    const d = new Date(date);
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

  const getTicketLabel = () => {
    if (!selectedGender) return 'event';
    const gender = selectedGender.toLowerCase();

    if (gender === 'men' || gender === 'male') return "men's";
    if (gender === 'women' || gender === 'female') return "women's";

    if (gender === 'queer men') return "queer men's";
    if (gender === 'queer women') return "queer women's";
    if (gender === 'queer') return "queer";

    return gender;
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.stepsContainer}>
        <div className={`${styles.step} ${step === 'phone' ? styles.active : ''}`}>
          <span className={styles.stepNumber}>1</span>
          <span className={styles.stepLabel}>Phone</span>
        </div>
        <div className={styles.stepLine}></div>
        <div className={`${styles.step} ${step === 'verify' ? styles.active : ''}`}>
          <span className={styles.stepNumber}>2</span>
          <span className={styles.stepLabel}>Verify</span>
        </div>
        <div className={styles.stepLine}></div>
        <div className={`${styles.step} ${step === 'profile' ? styles.active : ''}`}>
          <span className={styles.stepNumber}>3</span>
          <span className={styles.stepLabel}>Profile</span>
        </div>
        <div className={styles.stepLine}></div>
        <div className={`${styles.step} ${step === 'checkout' ? styles.active : ''}`}>
          <span className={styles.stepNumber}>4</span>
          <span className={styles.stepLabel}>Checkout</span>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.leftColumn}>
          <div className={styles.brandBlock}>
            <img
              src={circuitLogo}
              alt="Circuit Speed Dating"
              className={styles.brandLogo}
            />
          </div>

          <div className={styles.infoBadge}>
            <div className={styles.badgeIcon}>🚻</div>
            <span className={styles.badgeText}>{selectedGender || 'Queer Women'}</span>
          </div>
          <div className={styles.infoBadge}>
            <div className={styles.badgeIcon}>✓</div>
            <span className={styles.badgeText}>Ages {ageRange || '25-40'}</span>
          </div>
          <div className={styles.infoBadge}>
            <div className={styles.badgeIcon}>📅</div>
            <span className={styles.badgeText}>
              {formatEventTime()} {formatEventDate()}
            </span>
          </div>
          <div className={styles.infoBadge}>
            <div className={styles.badgeIcon}>📍</div>
            <span className={styles.badgeText}>
              {venue || 'Table Public House (2190 S Platte River Dr, Denver, CO 80223)'}
            </span>
          </div>

          <div className={styles.eventDescription}>
            <p>
              On the day of your event, we'll send you a personalized Circuit link by SMS, giving you everything you need in one place. 
              Before your first connection, add a quick appearance description so your matches can recognize you with confidence. 
              Then power through 6–9 exciting rounds, with live updates delivered through both the web app and SMS while our host keeps everything running smoothly.
            </p>
            <p>
              When the event ends, choose the people who sparked your interest. If the connection is mutual, we'll complete the circuit by sharing your contact details the next day. Your next great connection is just one spark away. ⚡
            </p>
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.phoneSection}>
            <h2 className={styles.phoneTitle}>
              1 {getTicketLabel()} ticket - ${price || '27.99'}
            </h2>

            <label className={styles.inputPrompt}>PLEASE SUBMIT YOUR PHONE NUMBER</label>

            <div className={styles.phoneInputGroup}>
              <div className={styles.countryCode}>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className={styles.countrySelect}
                >
                  <option value="+1">+1</option>
                  <option value="+266">+266</option>
                </select>
              </div>

              <input
                type="tel"
                className={styles.phoneInput}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="(   )  -"
                disabled={loading}
              />
            </div>

            {/* ✅ SMS consent checkbox */}
            <div className={styles.consentSection}>
              <label className={styles.consentLabel}>
                <input
                  type="checkbox"
                  checked={smsConsent}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSmsConsent(checked);
                    if (checked) {
                      setShowConsentModal(true);
                    } else {
                      setConsentAccepted(false);
                    }
                  }}
                />
                <span>
                  I agree to receive SMS messages from Circuit and have read the{' '}
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={(e) => {
                      e.preventDefault();
                      setShowConsentModal(true);
                    }}
                  >
                    SMS Terms &amp; Privacy Policy
                  </button>
                  .
                </span>
              </label>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button
              onClick={handleContinue}
              disabled={loading || !phoneNumber || !smsConsent || !consentAccepted}
              className={styles.continueBtn}
              title={!smsConsent || !consentAccepted ? 'Please accept the SMS consent to continue' : ''}
            >
              {loading ? 'Sending...' : 'Continue'}
            </button>
          </div>

          <div className={styles.footerLinks}>
            <p>
              Please read the <a href="/faq" target="_blank" rel="noreferrer">FAQ</a> which explains how the event works and our{' '}
              <a href="/terms-of-service" target="_blank" rel="noreferrer">cancellation policy</a>. If you have any questions or need to cancel, please contact us ASAP.
            </p>
          </div>
        </div>
      </div>

      {/* ✅ SMS Consent Modal */}
      {showConsentModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <h3 className={styles.modalTitle}>SMS Consent</h3>
            <p className={styles.modalText}>
              By checking this box you agree to receive SMS messages from Circuit, including
              verification codes, event confirmations, real-time round updates, waitlist alerts,
              booking confirmations, event reminders, account notifications, and customer care.
              Message frequency varies. Message &amp; data rates may apply. Reply STOP to any
              message to opt out. Message HELP for help. View our{' '}
              <a
                href="https://www.circuitspeeddating.com/terms-of-service#privacy"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.modalLink}
              >
                Privacy Policy
              </a>{' '}
              and our{' '}
              <a
                href="https://www.circuitspeeddating.com/terms-of-service#intro"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.modalLink}
              >
                Terms and Conditions
              </a>
              . Circuit LLC does not share mobile numbers or opt-in data with third parties.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalBtnCancel}
                onClick={() => {
                  setShowConsentModal(false);
                  setSmsConsent(false);
                  setConsentAccepted(false);
                }}
              >
                Decline
              </button>
              <button
                type="button"
                className={styles.modalBtnAccept}
                onClick={() => {
                  setConsentAccepted(true);
                  setShowConsentModal(false);
                }}
              >
                I Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventRegistration;