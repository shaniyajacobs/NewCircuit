import styled from 'styled-components';
import circuitLogo from '../images/Cir_Primary_RGB_Mixed White.PNG';
import React, { useState, useEffect } from 'react';
import { FooterShapes } from './Login';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from "firebase/auth";
import { auth, db } from "./firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

// Profile Component that combines logout and form
const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, password, image } = location.state || {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Initialize formData with the image from location.state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    phoneNumber: '',
    image: image, // Set initial image from location.state
    location: '',
    compliance: false
  });

  useEffect(() => {
    if (!email || !password) {
      navigate('/create-account');
      return;
    }
    // Update formData when image changes
    setFormData(prev => ({
      ...prev,
      image: image // Update image in formData when it comes from location.state
    }));
    setLoading(false);
  }, [email, password, image, navigate]);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('User data in profile:', userData);
          setFormData({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            birthDate: userData.birthDate ? new Date(userData.birthDate.seconds * 1000).toISOString().split('T')[0] : '',
            phoneNumber: userData.phoneNumber || '',
            image: userData.image || null,
            location: userData.location || '',
            compliance: false
          });
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    };

    if (auth.currentUser) {
      fetchUserData();
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Location state image:', image); // Debug log
      console.log('FormData image:', formData.image); // Debug log
      
      navigate('/verify-email', {
        state: { 
          userData: {
            email,
            password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            birthDate: formData.birthDate,
            phoneNumber: formData.phoneNumber,
            image: image, // Use image directly from location.state
            location: formData.location
          }
        }
      });
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login"); // Redirect back to login
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <LoginContainer>
      <FooterShapes />
      <ContentWrapper>
        <Logo href="/">
          <img src={circuitLogo} alt="Circuit Logo" />
        </Logo>
        <h1>Complete Your Profile</h1>

        {error && (
          <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <LoginForm onSubmit={handleSubmit}>
          <InputGroup>
            <Label>First Name</Label>
            <Input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Enter your first name"
              required
            />
          </InputGroup>

          <InputGroup>
            <Label>Last Name</Label>
            <Input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Enter your last name"
              required
            />
          </InputGroup>

          <InputGroup>
            <Label>Date of Birth</Label>
            <Input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              required
            />
          </InputGroup>

          <InputGroup>
            <Label>Phone Number</Label>
            <Input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Enter your phone number"
              required
            />
          </InputGroup>

          <CheckboxContainer>
            <CheckboxInput
              type="checkbox"
              name="compliance"
              id="compliance"
              checked={formData.compliance}
              onChange={handleChange}
              required
            />
            <CheckboxLabel htmlFor="compliance">
              I agree to the{' '}
              <LegalLink href="/terms-of-service#intro" target="_blank" rel="noopener noreferrer">
                terms of service
              </LegalLink>
              {' '}and{' '}
              <LegalLink href="/terms-of-service#privacy" target="_blank" rel="noopener noreferrer">
                privacy policy
              </LegalLink>
            </CheckboxLabel>
          </CheckboxContainer>

          <Button type="submit" disabled={loading || !formData.compliance}>
            {loading ? "Saving..." : "Continue to Email Verification"}
          </Button>
        </LoginForm>

        <button onClick={handleLogout} className="mt-4">Log Out</button>
      </ContentWrapper>
    </LoginContainer>
  );
};


const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
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
  max-width: 600px;  
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
`;

const Button = styled.button`
  width: 100%;
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

const CheckboxContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 1.5rem;
`;

const CheckboxInput = styled.input`
  width: 18px;
  height: 18px;
  border: 1px solid #000;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.24);
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 2px;
  accent-color: #211f20;

  &:checked {
    background: #211f20;
  }
`;

const CheckboxLabel = styled.label`
  color: #000;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.4;
  cursor: pointer;
  user-select: none;
`;

const LegalLink = styled.a`
  color: #211f20;
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 0.2s ease;

  &:hover {
    color: #333;
    text-decoration-thickness: 2px;
  }
`;

export default Profile;
