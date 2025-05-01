import styled from 'styled-components';
import circuitLogo from '../images/Cir_Primary_RGB_Mixed White.PNG';
import React, { useState } from 'react';
import { FooterShapes } from './Login';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from "./firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

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

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  min-height: 42px;
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
`;

const EnterpriseProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, password } = location.state || {};
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    businessName: '',
    legalBusinessName: '',
    businessType: '',
    websiteUrl: '',
    businessDescription: '',
    countryOfRegistration: '',
    registrationNumber: '',
    dateOfIncorporation: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });

  const businessTypes = [
    'Sole Proprietorship',
    'Partnership',
    'LLC (Limited Liability Company)',
    'Corporation (Inc., C-Corp, S-Corp)',
    'Non-Profit',
    'Government',
    'Other'
  ];

  const countries = ['United States', 'Canada', 'United Kingdom', 'Singapore']; // Add more

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Navigate to enterprise user profile with all data
      navigate('/enterprise-user-profile', {
        state: {
          email,
          password,
          businessData: formData
        }
      });
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
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
        <h1>Complete Your Business Profile</h1>

        {error && (
          <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <LoginForm onSubmit={handleSubmit}>
          <InputGroup>
            <Label>Business Name</Label>
            <Input
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData({...formData, businessName: e.target.value})}
              placeholder="e.g., LockerRoom Inc."
              required
            />
          </InputGroup>

          <InputGroup>
            <Label>Legal Business Name (if different)</Label>
            <Input
              type="text"
              value={formData.legalBusinessName}
              onChange={(e) => setFormData({...formData, legalBusinessName: e.target.value})}
              placeholder="e.g., LockerRoom Technologies, LLC"
            />
          </InputGroup>

          <InputGroup>
            <Label>Business Type</Label>
            <Select
              value={formData.businessType}
              onChange={(e) => setFormData({...formData, businessType: e.target.value})}
              required
            >
              <option value="">Select business type</option>
              {businessTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Select>
          </InputGroup>

          <InputGroup>
            <Label>Website URL</Label>
            <Input
              type="url"
              value={formData.websiteUrl}
              onChange={(e) => setFormData({...formData, websiteUrl: e.target.value})}
              placeholder="e.g., https://lockerroom.app"
              pattern="https?://.*"
            />
          </InputGroup>

          <InputGroup>
            <Label>Business Description</Label>
            <Textarea
              value={formData.businessDescription}
              onChange={(e) => setFormData({...formData, businessDescription: e.target.value})}
              placeholder="Describe what your business does... (max 500 characters)"
              maxLength={500}
              required
            />
          </InputGroup>

          <InputGroup>
            <Label>Country of Registration</Label>
            <Select
              value={formData.countryOfRegistration}
              onChange={(e) => setFormData({...formData, countryOfRegistration: e.target.value})}
              required
            >
              <option value="">Select your country</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </Select>
          </InputGroup>

          <InputGroup>
            <Label>Business Registration Number / Tax ID / EIN</Label>
            <Input
              type="text"
              value={formData.registrationNumber}
              onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
              placeholder="e.g., 84-1234567"
              required
            />
            <small style={{ color: '#666' }}>This is your Employer Identification Number or local business ID</small>
          </InputGroup>

          <InputGroup>
            <Label>Date of Incorporation</Label>
            <Input
              type="date"
              value={formData.dateOfIncorporation}
              onChange={(e) => setFormData({...formData, dateOfIncorporation: e.target.value})}
              required
            />
          </InputGroup>

          <InputGroup>
            <Label>Street Address</Label>
            <Input
              type="text"
              value={formData.streetAddress}
              onChange={(e) => setFormData({...formData, streetAddress: e.target.value})}
              required
            />
          </InputGroup>

          <InputGroup>
            <Label>City</Label>
            <Input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
              required
            />
          </InputGroup>

          <InputGroup>
            <Label>State / Province / Region</Label>
            <Input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData({...formData, state: e.target.value})}
              required
            />
          </InputGroup>

          <InputGroup>
            <Label>ZIP / Postal Code</Label>
            <Input
              type="text"
              value={formData.zipCode}
              onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
              required
            />
          </InputGroup>

          <Button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Continue"}
          </Button>
        </LoginForm>
      </ContentWrapper>
    </LoginContainer>
  );
};

export default EnterpriseProfile;
