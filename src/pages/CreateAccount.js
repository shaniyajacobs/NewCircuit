import styled from 'styled-components';
import circuitLogo from '../images/Cir_Primary_RGB_Mixed White.PNG';
import React, { useState, useEffect, useMemo } from 'react';
import { FooterShapes } from './Login';


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
  const [email, setEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [reenterPassword, setReenterPassword] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showReenterPassword, setShowReenterPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add password matching validation here
    if (createPassword !== reenterPassword) {
      alert('Passwords do not match');
      return;
    }
    console.log('Create account attempt with:', { email, createPassword });
  };

  return (
    <LoginContainer>
      <FooterShapes />
      <ContentWrapper>
        <Logo href="/">
          <img src={circuitLogo} alt="Circuit Logo" />
        </Logo>
        <LoginForm onSubmit={handleSubmit}>
          <InputGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </InputGroup>

          <InputGroup>
            <Label htmlFor="createPassword">
              Create Password
              <span 
                style={{ float: 'right', cursor: 'pointer' }}
                onClick={() => setShowCreatePassword(!showCreatePassword)}
              >
                {showCreatePassword ? 'Hide' : 'Show'}
              </span>
            </Label>
            <Input
              type={showCreatePassword ? 'text' : 'password'}
              id="createPassword"
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
              required
            />
          </InputGroup>

          <InputGroup>
            <Label htmlFor="reenterPassword">
              Re-enter Password
              <span 
                style={{ float: 'right', cursor: 'pointer' }}
                onClick={() => setShowReenterPassword(!showReenterPassword)}
              >
                {showReenterPassword ? 'Hide' : 'Show'}
              </span>
            </Label>
            <Input
              type={showReenterPassword ? 'text' : 'password'}
              id="reenterPassword"
              value={reenterPassword}
              onChange={(e) => setReenterPassword(e.target.value)}
              required
            />
          </InputGroup>

          <Button type="submit">Log in</Button>
        </LoginForm>
      </ContentWrapper>
    </LoginContainer>
  );
};

export default CreateAccount;
