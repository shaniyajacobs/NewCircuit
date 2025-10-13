import styled from 'styled-components';
import { FooterShapes } from './Login';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from './firebaseConfig';
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

function toLocalDate(ymdString) {
  const [y, m, d] = ymdString.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const VerifyEmail = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { userData } = location.state || {};
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [emailSent, setEmailSent] = useState(false);

    useEffect(() => {
        if (!userData) {
            navigate('/profile');
            return;
        }

        if (auth.currentUser && !auth.currentUser.emailVerified) {
            setEmailSent(true);
        }
    }, [userData, navigate]);

    const createUserAndSendVerification = async () => {
        try {
            setLoading(true);
            setError('');

            let userCredential;

            try {
                userCredential = await createUserWithEmailAndPassword(
                    auth,
                    userData.email,
                    userData.password
                );

                // Create user profile in Firestore only for new accounts
                await setDoc(doc(db, "users", userCredential.user.uid), {
                    userId: userCredential.user.uid,
                    email: userData.email,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    birthDate: toLocalDate(userData.birthDate),
                    phoneNumber: userData.phoneNumber,
                    emailVerified: false,
                    createdAt: new Date(),
                    image: userData.image,
                    isActive: true,
                    location: userData.location,
                    datesRemaining: 0, 
                    profileComplete: true,
                    preferencesComplete: false,
                    locationSet: false,
                    quizComplete: false
                });

            } catch (createErr) {
                if (createErr.code === 'auth/email-already-in-use') {
                    userCredential = await signInWithEmailAndPassword(
                        auth,
                        userData.email,
                        userData.password
                    );
                } else {
                    throw createErr;
                }
            }

            // Send verification email (for new or existing account)
            await sendEmailVerification(userCredential.user);

            setEmailSent(true);
            console.log('Verification email sent');
        } catch (error) {
            console.error('Error:', error);
            setError(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const checkVerification = async () => {
        try {
            setLoading(true);
            // Reload the user to get the latest emailVerified status
            await auth.currentUser.reload();
            
            if (auth.currentUser.emailVerified) {
                // Update user profile to mark email as verified
                await setDoc(doc(db, "users", auth.currentUser.uid), {
                    emailVerified: true
                }, { merge: true });

                // Navigate to locations screen     AND PASS DATA
                navigate('/preferencePage', { state: { userData: { 
                    ...userData, 
                    userId: auth.currentUser.uid 
                  }  } });
            } else {
                setError('Please verify your email before continuing');
            }
        } catch (error) {
            console.error('Error checking verification:', error);
            setError('Error checking verification status');
        } finally {
            setLoading(false);
        }
    };

    // Resend verification email if already signed in / or sign in first
    const resendVerificationEmail = async () => {
        try {
            setLoading(true);
            setError('');

            if (!auth.currentUser) {
                await signInWithEmailAndPassword(auth, userData.email, userData.password);
            }

            await sendEmailVerification(auth.currentUser);
        } catch (err) {
            if (err.code === 'auth/too-many-requests') {
                setError('A verification e-mail was just sent. Please wait a minute before asking for a new one.');
            } else {
                setError(err.message || err.code);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <LoginContainer>
            <FooterShapes />
            <ContentWrapper>
                <Title>Verify Your Email</Title>
                <Subtitle>Please verify your email: {userData?.email}</Subtitle>

                {error && (
                    <div style={{ 
                        color: 'red', 
                        marginTop: '1rem',
                        textAlign: 'center',
                        maxWidth: '400px'
                    }}>
                        {error}
                    </div>
                )}

                {!emailSent ? (
                    <Button 
                        onClick={createUserAndSendVerification}
                        disabled={loading}
                        style={{ maxWidth: '400px' }}
                    >
                        {loading ? "Sending..." : "Send Verification Email"}
                    </Button>
                ) : (
                    <div style={{ width: '100%', maxWidth: '400px' }}>
                        <p style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>
                            A verification email has been sent to your email address.
                            Please check your inbox and click the verification link.
                        </p>

                        <Button 
                            onClick={checkVerification}
                            disabled={loading}
                            style={{ marginTop: '20px' }}
                        >
                            {loading ? "Checking..." : "I've Verified My Email"}
                        </Button>

                        <div style={{ textAlign: 'center', marginTop: '20px' }}>
                            <p style={{ color: 'white', marginBottom: '8px' }}>
                                Didn't receive the email?
                            </p>
                            <ResendLink 
                                onClick={resendVerificationEmail}
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
// Styled Components
const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100vh;
  background-color: #211f20;
  padding: 20px;
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
  padding: 40px 20px;
  margin-top: -40px;
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

const Button = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: ${props => props.secondary ? 'white' : '#007bff'};
  color: ${props => props.secondary ? '#000' : 'white'};
  border: ${props => props.secondary ? '1px solid #000' : 'none'};
  border-radius: 12px;
  font-size: 1rem;
  cursor: pointer;
  margin-bottom: 1rem;
  min-height: 42px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  &:hover {
    opacity: 0.9;
  }
`;

const ResendLink = styled.button`
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.75rem 1.5rem;
  margin-top: 16px;
  min-height: 42px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;

  &:hover {
    background-color: #5a6268;
    transform: translateY(-1px);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;


export default VerifyEmail; 
