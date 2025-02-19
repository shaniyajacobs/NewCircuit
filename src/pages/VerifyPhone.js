import styled from 'styled-components';
import cirCrossPBlue from '../images/cir_cross_PWhite.svg';
import cirHeartPBlue from '../images/cir_heart_PWhite.svg';
import cirMinusPBlue from '../images/cir_minus_PWhite.svg';
import circuitLogo from '../images/Cir_Secondary_RGB_Mixed Blackk.png';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from './firebaseConfig';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { doc, updateDoc, setDoc } from 'firebase/firestore';


const shapeOptions = [
  { src: cirCrossPBlue, alt: 'Cross' },
  { src: cirHeartPBlue, alt: 'Heart' },
  { src: cirMinusPBlue, alt: 'Minus' },
];

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100vh;
  background-color: #7B9EFF;
  padding: 20px;
`;


const Button = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: ${props => props.secondary ? 'white' : '#000'};
  color: ${props => props.secondary ? '#000' : 'white'};
  border: ${props => props.secondary ? '1px solid #000' : 'none'};
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  margin-bottom: 1rem;

  &:hover {
    opacity: 0.9;
  }
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
  opacity: 0.8;
  user-select: none;
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;  // Added top padding
  margin-top: -40px;
`;

const OTPContainer = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  margin: 32px 0;
`;

const OTPInput = styled.input`
  width: 50px;
  height: 50px;
  border: 1px solid #ddd;
  border-radius: 8px;
  text-align: center;
  font-size: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:focus {
    outline: none;
    border-color: #7B9EFF;
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: white;
  text-align: center;
  margin-bottom: 16px;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: white;
  text-align: center;
  margin-bottom: 32px;
`;

const ResendLink = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  text-decoration: underline;
  margin-top: 16px;

  &:hover {
    opacity: 0.8;
  }
`;

const Label = styled.label`
  display: block;
  color: white;
  margin-bottom: 0.5rem;
  font-size: 1rem;
`;

const InputGroup = styled.div`
  margin-bottom: 20px;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #7B9EFF;
  }
`;

export const FooterShapes = () => {
  const rowCount = 8;
  const shapesPerRow = 12;

  const patternData = useMemo(() => {
    // Generate grid of shapes
    const grid = Array(rowCount).fill().map(() => 
      Array(shapesPerRow).fill(shapeOptions[0])
    );
    
    // Generate all random values up front
    const styles = Array(rowCount).fill().map(() => 
      Array(shapesPerRow).fill().map(() => ({
        size: Math.floor(Math.random() * (110 - 30)) + 30, // random size between 30-110
        blur: Math.random() < 0.3 ? Math.random() * 3 : 0,
      }))
    );
    
    // Fill grid with shapes
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

        if (possibilities.length === 0) {
          possibilities = [...shapeOptions];
        }

        const randomIndex = Math.floor(Math.random() * possibilities.length);
        grid[r][c] = possibilities[randomIndex];
      }
    }

    return { grid, styles };
  }, []); // Empty dependency array means this only runs once

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

const VerifyPhone = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { phoneNumber, userData } = location.state || {};
    const [otpCode, setOtpCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const auth = getAuth();

    useEffect(() => {
        if (!phoneNumber) {
            navigate('/profile');
            return;
        }

        // Set up invisible reCAPTCHA
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'send-code-button', {
                'size': 'invisible'
            });
        }

        return () => {
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null;
            }
        };
    }, [phoneNumber]);

    const onSignInSubmit = async () => {
        try {
            setLoading(true);
            setError('');

            let formattedPhoneNumber = phoneNumber.replace(/[^\d+]/g, '');
            if (!formattedPhoneNumber.startsWith('+')) {
                formattedPhoneNumber = '+1' + formattedPhoneNumber;
            }

            console.log('Sending code to:', formattedPhoneNumber);
            const appVerifier = window.recaptchaVerifier;
            const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
            window.confirmationResult = confirmationResult;
            setCodeSent(true);
            console.log('SMS sent successfully');
        } catch (error) {
            console.error('Error sending SMS:', error);
            setError(`Error sending code: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const verifyCode = async () => {
        if (!window.confirmationResult) {
            setError('Please request a verification code first');
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            // Verify the code and get the user credential
            const result = await window.confirmationResult.confirm(otpCode);
            const user = result.user;

            // Create user profile in Firestore with the auth UID
            await setDoc(doc(db, "users", user.uid), {
                userId: user.uid,  // Store the auth UID
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                birthDate: new Date(userData.birthDate),
                phoneNumber: phoneNumber,
                phoneVerified: true,
                createdAt: new Date()
            });

            // Navigate to locations screen
            navigate('/locations');
        } catch (error) {
            console.error('Error verifying code:', error);
            setError('Invalid verification code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LoginContainer>
            <FooterShapes />
            <ContentWrapper>
                <Title>Verify Your Phone Number</Title>
                <Subtitle>Verify your phone number: {phoneNumber}</Subtitle>

                {!codeSent ? (
                    <Button 
                        id="send-code-button"
                        onClick={onSignInSubmit}
                        disabled={loading}
                        style={{ maxWidth: '400px' }}
                    >
                        {loading ? "Sending..." : "Send Verification Code"}
                    </Button>
                ) : (
                    <div style={{ width: '100%', maxWidth: '400px' }}>
                        <InputGroup>
                            <Label>Enter 6-digit Verification Code</Label>
                            <Input
                                type="text"
                                value={otpCode}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '');
                                    if (value.length <= 6) {
                                        setOtpCode(value);
                                    }
                                }}
                                placeholder="Enter code"
                                maxLength={6}
                                style={{ 
                                    textAlign: 'center',
                                    letterSpacing: '8px',
                                    fontSize: '24px'
                                }}
                            />
                        </InputGroup>

                        {error && (
                            <div style={{ 
                                color: 'red', 
                                marginTop: '1rem',
                                textAlign: 'center' 
                            }}>
                                {error}
                            </div>
                        )}

                        <Button 
                            onClick={verifyCode}
                            disabled={loading || otpCode.length !== 6}
                            style={{ marginTop: '20px' }}
                        >
                            {loading ? "Verifying..." : "Verify Code"}
                        </Button>

                        <div style={{ textAlign: 'center', marginTop: '20px' }}>
                            <p style={{ color: 'white', marginBottom: '8px' }}>
                                Didn't receive the code?
                            </p>
                            <ResendLink 
                                onClick={onSignInSubmit}
                                disabled={loading}
                            >
                                Send again
                            </ResendLink>
                        </div>
                    </div>
                )}
            </ContentWrapper>
        </LoginContainer>
    );
};

export default VerifyPhone;
