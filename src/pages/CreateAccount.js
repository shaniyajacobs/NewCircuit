import styled from 'styled-components';
import circuitLogo from '../images/Cir_Primary_RGB_Mixed White.PNG';
import React, { useState, useEffect, useMemo } from 'react';
import { FooterShapes } from './Login';
import { auth, db } from './firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';


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
  color: #333;
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
  padding: 0 20px;
`;

const CreateAccount = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [reenterPassword, setReenterPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted'); // Debug log
    setError('');
    setLoading(true);

    try {
      // Validate passwords match
      if (createPassword !== reenterPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      // Validate password strength
      if (createPassword.length < 6) {
        setError('Password should be at least 6 characters');
        setLoading(false);
        return;
      }

      console.log('Validation passed, attempting navigation'); // Debug log

      // Navigate to profile with state
      navigate('/profile', {
        state: {
          email: email,
          password: createPassword
        }
      });
      
      console.log('Navigation completed'); // Debug log
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred. Please try again.');
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
        <LoginForm onSubmit={handleSubmit}>
          {error && (
            <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>
              {error}
            </div>
          )}
          
          <InputGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </InputGroup>

          <InputGroup>
            <Label htmlFor="createPassword">Create Password</Label>
            <Input
              type="password"
              id="createPassword"
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
              required
              disabled={loading}
            />
          </InputGroup>

          <InputGroup>
            <Label htmlFor="reenterPassword">Re-enter Password</Label>
            <Input
              type="password"
              id="reenterPassword"
              value={reenterPassword}
              onChange={(e) => setReenterPassword(e.target.value)}
              required
              disabled={loading}
            />
          </InputGroup>

          <Button type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Continue'}
          </Button>

          <Button 
            type="button" 
            secondary 
            onClick={() => navigate('/signin')}
            disabled={loading}
          >
            Back to Sign In
          </Button>
        </LoginForm>
      </ContentWrapper>
    </LoginContainer>
  );
};

export default CreateAccount;
