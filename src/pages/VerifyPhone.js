import styled from 'styled-components';
import circuitLogo from '../images/Cir_Primary_RGB_Mixed White.PNG';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FooterShapes } from './Login';


const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100vh;
  background-color: #211f20;
  padding: 20px;
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

const VerifyPhone = () => {
    const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);

  const handleOTPChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtpValues = [...otpValues];
      newOtpValues[index] = value;
      setOtpValues(newOtpValues);

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.querySelector(`input[name='otp-${index + 1}']`);
        if (nextInput) nextInput.focus();
      }
    }
  };

      return (
<LoginContainer>
      <FooterShapes />
      <ContentWrapper>
        <Title>Verify Your Phone Number</Title>
        <Subtitle>Enter your OTP code here</Subtitle>
        
        <OTPContainer>
          {otpValues.map((value, index) => (
            <OTPInput
              key={index}
              type="text"
              maxLength={1}
              value={value}
              name={`otp-${index}`}
              onChange={(e) => handleOTPChange(index, e.target.value)}
            />
          ))}
        </OTPContainer>

        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'white', marginBottom: '8px' }}>Didn't receive a code?</p>
          <ResendLink type="button">RESEND</ResendLink>
        </div>

        <Button 
          type="button" 
          style={{ 
            maxWidth: '200px', 
            marginTop: '32px',
            backgroundColor: 'black',
            color: 'white'
          }}
        >
          NEXT
        </Button>
      </ContentWrapper>
    </LoginContainer>
  );
};

export default VerifyPhone;
