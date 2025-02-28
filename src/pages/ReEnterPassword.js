import React, { useState } from 'react';
import styled from 'styled-components';
import circuitLogo from '../images/Cir_Primary_RGB_Mixed White.PNG';
import { FooterShapes } from './Login';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #211f20;
  padding: 20px;
  position: relative;
  overflow: hidden;
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
  color: #333;
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

const ReEnterPassword = () => {
  const [password, setPassword] = useState('');
  const [reenterPassword, setReenterPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== reenterPassword) {
      alert('Passwords do not match');
      return;
    }
    console.log('Password reset submitted');
    // Add your password reset logic here
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
            <Label htmlFor="password">Enter Password:</Label>
            <Input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Label htmlFor="reenterPassword">Re Enter Password:</Label>
            <Input
              type="password"
              id="reenterPassword"
              value={reenterPassword}
              onChange={(e) => setReenterPassword(e.target.value)}
              required
            />

            <Button type="submit">Submit</Button>
          </form>
        </Card>
      </ContentWrapper>
    </Container>
  );
};

export default ReEnterPassword;