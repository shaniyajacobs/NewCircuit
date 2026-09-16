import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import circuitLogo from '../images/Cir_Primary_RGB_Mixed White.PNG';
import cirCrossPBlue from '../images/cir_cross_PWhite.svg';
import cirHeartPBlue from '../images/cir_heart_PWhite.svg';
import cirMinusPBlue from '../images/cir_minus_PWhite.svg';
import { functions } from './firebaseConfig';

// ---------- Styled Components ----------
const shapeOptions = [
  { src: cirCrossPBlue, alt: 'Cross' },
  { src: cirHeartPBlue, alt: 'Heart' },
  { src: cirMinusPBlue, alt: 'Minus' },
];

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #211f20;
  padding: 20px;
`;

const Logo = styled.h1`
  display: flex;
  align-items: center;
  font-size: 2.5rem;
  color: #000;
  margin-bottom: 2rem;
  text-decoration: none;

  img {
    height: 80px;
    width: auto;
  }
`;

const LoginForm = styled.form`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  min-width: 320px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const InputGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #000;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  min-height: 42px;
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
  margin-bottom: 1rem;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

const HelperText = styled.p`
  color: #666;
  font-size: 0.85rem;
  text-align: center;
  margin-top: 0.5rem;
  margin-bottom: 1.25rem;
  line-height: 1.4;
`;

const PatternContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
`;

const ShapeImage = styled.img`
  position: absolute;
  opacity: 0.7;
  user-select: none;
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
`;

function seededRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// Kept for backwards compatibility — VerifyPhone.js and VerifyLoginOTP.js import this
export const FooterShapes = () => {
  const SEED = 777;
  const rowCount = 8;
  const shapesPerRow = 12;

  const patternData = React.useMemo(() => {
    const grid = Array(rowCount).fill().map(() =>
      Array(shapesPerRow).fill(shapeOptions[0])
    );
    const styles = Array(rowCount).fill().map((_, rowIndex) =>
      Array(shapesPerRow).fill().map((_, colIndex) => {
        const shapeSeed = SEED + (rowIndex * shapesPerRow + colIndex) * 10;
        return {
          size: Math.floor(seededRandom(shapeSeed) * (110 - 30)) + 30,
          blur: seededRandom(shapeSeed + 1) < 0.3 ? seededRandom(shapeSeed + 2) * 3 : 0,
        };
      })
    );
    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < shapesPerRow; c++) {
        let possibilities = [...shapeOptions];
        if (c > 0) {
          const leftShape = grid[r][c - 1];
          possibilities = possibilities.filter(p => p.src !== leftShape.src);
        }
        if (r > 0) {
          const upShape = grid[r - 1][c];
          possibilities = possibilities.filter(p => p.src !== upShape.src);
        }
        if (possibilities.length === 0) possibilities = [...shapeOptions];
        const shapeSeed = SEED + (r * shapesPerRow + c) * 10 + 3;
        const randomIndex = Math.floor(seededRandom(shapeSeed) * possibilities.length);
        grid[r][c] = possibilities[randomIndex];
      }
    }
    return { grid, styles };
  }, []);

  return (
    <PatternContainer>
      {patternData.grid.map((rowArray, row) =>
        rowArray.map((shape, col) => {
          const spacing = 100 / (shapesPerRow - 1);
          const horizontalOffset = (row % 2 === 1) ? spacing / 2 : 0;
          let leftPercent = col * spacing + horizontalOffset;
          if (leftPercent > 100) leftPercent = 100;
          const style = patternData.styles[row][col];
          const finalBottom = row * 40;
          return (
            <ShapeImage
              key={`${row}-${col}`}
              src={shape.src}
              alt={shape.alt}
              style={{
                width: `${style.size}px`,
                height: `${style.size}px`,
                left: `${leftPercent}%`,
                bottom: `${finalBottom}px`,
                filter: `blur(${style.blur}px)`,
                zIndex: row,
              }}
            />
          );
        })
      )}
    </PatternContainer>
  );
};

// ---------- Login Component (phone-only) ----------
const Login = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countryCode, setCountryCode] = useState('+1');

  useEffect(() => {
    // Small UX touch: default country code based on rough local guess.
    // Never overrides a user's explicit choice.
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz.includes('Maseru') || tz.includes('Africa')) setCountryCode('+266');
    } catch {
      /* noop */
    }
  }, []);

  const normalizePhone = (raw, cc) => {
    // Strip non-digits from the local part
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    // If user typed a leading + themselves, respect it
    if (raw.trim().startsWith('+')) {
      return '+' + digits;
    }
    return `${cc}${digits}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const finalPhone = normalizePhone(phoneNumber, countryCode);

    // Basic E.164-ish validation
    if (!/^\+[1-9]\d{7,14}$/.test(finalPhone)) {
      setError('Please enter a valid phone number.');
      return;
    }

    setLoading(true);

    try {
      const sendOTP = httpsCallable(functions, 'sendOTP');
      await sendOTP({ phoneNumber: finalPhone });

      // Move to OTP screen, passing the normalized phone
      navigate('/verify-login-otp', {
        state: { phoneNumber: finalPhone },
      });
    } catch (err) {
      console.error('sendOTP error:', err);
      setError(
        err?.message?.includes('not found')
          ? 'Login service is not available. Please try again later.'
          : 'Could not send code. Please check your number and try again.'
      );
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <FooterShapes />
      <ContentWrapper>
        <Logo href="/">
          <img src={circuitLogo} alt="Circuit Logo" />
        </Logo>
        <LoginForm onSubmit={handleSubmit}>
          {error && <ErrorBox>{error}</ErrorBox>}

          <InputGroup>
            <Label htmlFor="phone">Phone number</Label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                disabled={loading}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  minHeight: '42px',
                  background: 'white',
                }}
              >
                <option value="+1">+1 (US/CA)</option>
                <option value="+266">+266 (LS)</option>
                <option value="+27">+27 (ZA)</option>
                <option value="+44">+44 (UK)</option>
                <option value="+61">+61 (AU)</option>
              </select>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Phone number"
                disabled={loading}
                required
              />
            </div>
            <HelperText>
              We'll text you a 6-digit code to sign in.
            </HelperText>
          </InputGroup>

          <Button type="submit" disabled={loading}>
            {loading ? 'Sending code…' : 'Continue'}
          </Button>

          <HelperText style={{ marginTop: '0.5rem' }}>
            New to Circuit?{' '}
            <a
              href="/events"
              style={{ color: '#211f20', textDecoration: 'underline' }}
            >
              View Events
            </a>
          </HelperText>
        </LoginForm>
      </ContentWrapper>
    </LoginContainer>
  );
};

export default Login;