import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { onAuthStateChanged } from 'firebase/auth';
import styles from './VerifyEventOTP.module.css';

const VerifyEventOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { phoneNumber, eventId, eventTitle, selectedGender, price, city, venue, date, time, ageRange, slug } = location.state || {};

  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const handleVerify = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const verifyOTP = httpsCallable(functions, 'verifyOTP');
      const result = await verifyOTP({
        phoneNumber: phoneNumber,
        code: otpCode
      });

      if (result.data.success) {
        console.log('✅ OTP verified successfully');

        

        navigate('/event-profile', {
          state: {
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
            slug,
          }
        });
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (err) {
      console.error('❌ OTP verification error:', err);
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendDisabled(true);
    setResendTimer(60);
    setError('');

    try {
      const sendOTP = httpsCallable(functions, 'sendOTP');
      await sendOTP({ phoneNumber: phoneNumber });
    } catch (err) {
      console.error(err);
      setError('Failed to resend code');
    }

    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Verify Your Phone</h1>
        <p className={styles.subtitle}>
          Enter the 6-digit code sent to <strong>{phoneNumber}</strong>
        </p>

        <div className={styles.codeInputGroup}>
          <input
            type="text"
            className={styles.codeInput}
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            maxLength={6}
            autoFocus
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button
          onClick={handleVerify}
          disabled={loading || otpCode.length !== 6}
          className={styles.verifyBtn}
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>

        <div className={styles.resendSection}>
          <button
            onClick={handleResend}
            disabled={resendDisabled}
            className={styles.resendBtn}
          >
            {resendDisabled ? `Resend in ${resendTimer}s` : 'Resend Code'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEventOTP;