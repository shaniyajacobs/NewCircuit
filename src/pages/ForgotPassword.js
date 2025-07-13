import React, { useState } from 'react';
import styled from 'styled-components';
import circuitLogo from '../images/Cir_Primary_RGB_Mixed White.PNG';
import { FooterShapes } from './Login';
import { useNavigate, Link } from 'react-router-dom';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

const Container = styled.div`
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

const Card = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  min-width: 320px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  text-align: center;
  color: #000;
  margin-bottom: 2rem;
  font-size: 1.5rem; 
  font-weight: bold;
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
  margin-bottom: 1.5rem;
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

  &:hover {
    opacity: 0.9;
  }
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = getAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('A password reset email has been sent. Please check your inbox.');
    } catch (err) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <FooterShapes />
      <ContentWrapper>
        <Logo>
          <img src={circuitLogo} alt="Circuit Logo" />
        </Logo>
        <Card>
          <Title>Password Recovery</Title>
          <form onSubmit={handleSubmit}>
            <Label htmlFor="email">Enter Your Email</Label>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <Button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Submit Email'}
            </Button>
          </form>
          {message && <div style={{ color: 'green', marginTop: '1rem', textAlign: 'center' }}>{message}</div>}
          {error && <div style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>{error}</div>}
        </Card>
      </ContentWrapper>
    </Container>
  );
};

export default ForgotPassword;