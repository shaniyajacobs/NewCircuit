import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { FooterShapes } from './Login';
import { functions } from './firebaseConfig';
import { signInWithCustomToken } from '../auth';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #211f20;
  padding: 20px;
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Card = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  font-size: 1.75rem;
  color: #111;
  text-align: center;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: #444;
  text-align: center;
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #000;
  font-size: 0.95rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1.25rem;
  text-align: center;
  letter-spacing: 8px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #7B9EFF;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: ${props => (props.secondary ? 'white' : '#211f20')};
  color: ${props => (props.secondary ? '#000' : 'white')};
  border: ${props => (props.secondary ? '1px solid #000' : 'none')};
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ResendRow = styled.div`
  text-align: center;
  margin-top: 1rem;
  color: #444;
  font-size: 0.9rem;
`;

const ResendLink = styled.button`
  background: none;
  border: none;
  color: #211f20;
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0;

  &:hover {
    opacity: 0.8;
  }
`;

const ErrorBox = styled.div`
  background: #fff1f1;
  color: #b00020;
  padding: 10px 12px;
  border-radius: 6px;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 0.9rem;
`;

const NoAccountCard = styled(Card)`
  text-align: center;
`;

const NoAccountTitle = styled.h2`
  font-size: 1.5rem;
  color: #111;
  margin-bottom: 0.75rem;
`;

const NoAccountText = styled.p`
  color: #444;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  line-height: 1.5;
`;

const VerifyLoginOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { phoneNumber } = location.state || {};

  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [noAccount, setNoAccount] = useState(false);
  const [resending, setResending] = useState(false);
  const [resentMessage, setResentMessage] = useState('');
  const inputRef = useRef(null);

  // Guard: must arrive with a phone number
  useEffect(() => {
    if (!phoneNumber) {
      navigate('/login', { replace: true });
    }
  }, [phoneNumber, navigate]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleVerify = async () => {
    if (otpCode.length !== 6 || loading) return;

    setLoading(true);
    setError('');

    try {
      const loginWithPhone = httpsCallable(functions, 'loginWithPhone');
      const result = await loginWithPhone({
        phoneNumber,
        code: otpCode,
      });

      const data = result.data || {};

      // Not approved code
      if (data.success === false && data.reason === 'invalid_code') {
        setError('Invalid verification code. Please try again.');
        setLoading(false);
        return;
      }

      // Verified but no account exists → show "No account found"
      if (data.success === false && data.reason === 'no_account') {
        setNoAccount(true);
        setLoading(false);
        return;
      }

      // Success → sign in with custom token
      if (data.success === true && data.customToken) {
        const signInResult = await signInWithCustomToken(data.customToken);

        if (!signInResult.success) {
          setError('Sign-in failed. Please try again.');
          setLoading(false);
          return;
        }

       if (data.isAdmin) {
  navigate('/admin-dashboard', { replace: true });
} else if (data.hasEvents) {
  navigate('/dashboard', { replace: true });
} else {
  navigate('/events', { replace: true });
}
        return;
      }

      // Fallback
      setError('Unexpected response. Please try again.');
      setLoading(false);
    } catch (err) {
      console.error('loginWithPhone error:', err);
      setError(
        err?.message?.includes('not found')
          ? 'Login service is not available. Please try again later.'
          : 'Something went wrong. Please try again.'
      );
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    setResentMessage('');
    setError('');

    try {
      const sendOTP = httpsCallable(functions, 'sendOTP');
      await sendOTP({ phoneNumber });
      setResentMessage('A new code has been sent.');
    } catch (err) {
      console.error('sendOTP error:', err);
      setError('Could not resend the code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // --------------------------------------------------
  // "No account found" screen
  // --------------------------------------------------
  if (noAccount) {
    return (
      <LoginContainer>
        <FooterShapes />
        <ContentWrapper>
          <NoAccountCard>
            <NoAccountTitle>No account found</NoAccountTitle>
            <NoAccountText>
              It looks like you haven't registered with Circuit yet.
            </NoAccountText>
            <Button onClick={() => navigate('/events')}>View Events</Button>
            <Button secondary onClick={() => navigate('/login')}>
              Back to Login
            </Button>
          </NoAccountCard>
        </ContentWrapper>
      </LoginContainer>
    );
  }

  // --------------------------------------------------
  // OTP entry screen
  // --------------------------------------------------
  return (
    <LoginContainer>
      <FooterShapes />
      <ContentWrapper>
        <Card>
          <Title>Enter your code</Title>
          <Subtitle>We sent a 6-digit code to {phoneNumber}</Subtitle>

          {error && <ErrorBox>{error}</ErrorBox>}
          {resentMessage && (
            <div
              style={{
                color: '#0a7a3b',
                textAlign: 'center',
                marginBottom: '1rem',
                fontSize: '0.9rem',
              }}
            >
              {resentMessage}
            </div>
          )}

          <Label htmlFor="otp">Verification code</Label>
          <Input
            id="otp"
            ref={inputRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otpCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              if (value.length <= 6) setOtpCode(value);
            }}
            placeholder="······"
            maxLength={6}
            disabled={loading}
          />

          <Button
            onClick={handleVerify}
            disabled={loading || otpCode.length !== 6}
          >
            {loading ? 'Verifying…' : 'Verify & Sign In'}
          </Button>

          <ResendRow>
            Didn't receive the code?{' '}
            <ResendLink onClick={handleResend} disabled={resending}>
              {resending ? 'Sending…' : 'Send again'}
            </ResendLink>
          </ResendRow>
        </Card>
      </ContentWrapper>
    </LoginContainer>
  );
};

export default VerifyLoginOTP;