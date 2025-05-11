// adding a page after profile.js before location screen asking sexual preference and orientation
import styled from 'styled-components';
import circuitLogo from '../images/Cir_Primary_RGB_Mixed White.PNG';
import React, { useState } from 'react';
import { FooterShapes } from './Login';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from "./firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

const PreferencePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = location.state || {};
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    gender: '',
    sexualPreference: ''
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!auth.currentUser) {
        throw new Error('No authenticated user found');
      }

      // Update the user's document in Firestore
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        gender: formData.gender,
        sexualPreference: formData.sexualPreference,
        updatedAt: new Date()
      });

      // Navigate to the next page with the updated data
      navigate('/locations', {
        state: {
          userData: { 
            ...userData, 
            gender: formData.gender, 
            sexualPreference: formData.sexualPreference 
          }
        }
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <FooterShapes />
      <ContentWrapper>
        <Logo href="/">
          <img src={circuitLogo} alt="Circuit Logo" />
        </Logo>
        <h1>Tell Us More About You</h1>
        
        {error && (
          <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Label>Gender</Label>
            <Select 
              value={formData.gender} 
              onChange={(e) => setFormData({...formData, gender: e.target.value})} 
              required>
              <option value="">Select your gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </Select>
          </InputGroup>
          
          <InputGroup>
            <Label>Sexual Preference</Label>
            <Select 
              value={formData.sexualPreference} 
              onChange={(e) => setFormData({...formData, sexualPreference: e.target.value})} 
              required>
              <option value="">Select your preference</option>
              <option value="Men">Men</option>
              <option value="Women">Women</option>
              <option value="Both">Both</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </Select>
          </InputGroup>

          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Continue"}
          </Button>
        </Form>
      </ContentWrapper>
    </PageContainer>
  );
};

const PageContainer = styled.div`
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

const Form = styled.form`
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

const Select = styled.select`
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
  background-color: #211f20;
  color: white;
  border: none;
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

export default PreferencePage;
