import styled from 'styled-components';
import circuitLogo from '../images/Cir_Primary_RGB_Mixed White.PNG';
import { FooterShapes } from './Login';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db, storage } from './firebaseConfig';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Reuse styled components from VerifyEmail.js
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
  max-width: 400px;
  padding: 0.75rem;
  background-color: ${props => props.secondary ? 'white' : '#211f20'};
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

const EnterpriseVerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = location.state || {};
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const auth = getAuth();

  useEffect(() => {
    if (!userData) {
      navigate('/enterprise-create-account');
      return;
    }
  }, [userData, navigate]);

  const createUserAndSendVerification = async () => {
    try {
      setLoading(true);
      setError('');

      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      // Send verification email
      await sendEmailVerification(userCredential.user);

      // Upload files if they exist
      let governmentIdUrl = null;
      let proofOfAuthUrl = null;

      if (userData.userProfile.governmentId) {
        const govIdRef = ref(storage, `enterprise_docs/${userCredential.user.uid}/gov_id_${userData.userProfile.governmentId.name}`);
        const govIdSnapshot = await uploadBytes(govIdRef, userData.userProfile.governmentId);
        governmentIdUrl = await getDownloadURL(govIdSnapshot.ref);
      }

      if (userData.userProfile.proofOfAuth) {
        const proofRef = ref(storage, `enterprise_docs/${userCredential.user.uid}/proof_${userData.userProfile.proofOfAuth.name}`);
        const proofSnapshot = await uploadBytes(proofRef, userData.userProfile.proofOfAuth);
        proofOfAuthUrl = await getDownloadURL(proofSnapshot.ref);
      }

      // Create flattened business document in Firestore
      await setDoc(doc(db, "businesses", userCredential.user.uid), {
        // Business data fields
        businessName: userData.businessData.businessName,
        legalBusinessName: userData.businessData.legalBusinessName,
        businessType: userData.businessData.businessType,
        websiteUrl: userData.businessData.websiteUrl,
        businessDescription: userData.businessData.businessDescription,
        countryOfRegistration: userData.businessData.countryOfRegistration,
        registrationNumber: userData.businessData.registrationNumber,
        dateOfIncorporation: userData.businessData.dateOfIncorporation,
        streetAddress: userData.businessData.streetAddress,
        city: userData.businessData.city,
        state: userData.businessData.state,
        zipCode: userData.businessData.zipCode,
        country: userData.businessData.country,

        // User profile fields
        firstName: userData.userProfile.firstName,
        lastName: userData.userProfile.lastName,
        phoneNumber: userData.userProfile.phoneNumber,
        jobTitle: userData.userProfile.jobTitle,
        governmentIdUrl,
        proofOfAuthUrl,

        // Additional fields
        email: userData.email,
        emailVerified: false,
        createdAt: new Date(),
        isActive: true,
        uid: userCredential.user.uid
      });

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
      await auth.currentUser.reload();
      
      if (auth.currentUser.emailVerified) {
        // Update business document to mark email as verified
        await setDoc(doc(db, "businesses", auth.currentUser.uid), {
          emailVerified: true
        }, { merge: true });

        navigate('/enterprise-dash');
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

  return (
    <LoginContainer>
      <FooterShapes />
      <ContentWrapper>
        <Title>Verify Your Email</Title>
        <Subtitle>Please verify your email: {userData?.email}</Subtitle>

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
                onClick={createUserAndSendVerification}
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

export default EnterpriseVerifyEmail;
