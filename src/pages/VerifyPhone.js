import styled from 'styled-components';
import cirCrossPBlue from '../images/cir_cross_PWhite.svg';
import cirHeartPBlue from '../images/cir_heart_PWhite.svg';
import cirMinusPBlue from '../images/cir_minus_PWhite.svg';
import circuitLogo from '../images/Cir_Secondary_RGB_Mixed Blackk.png';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';


const shapeOptions = [
  { src: cirCrossPBlue, alt: 'Cross' },
  { src: cirHeartPBlue, alt: 'Heart' },
  { src: cirMinusPBlue, alt: 'Minus' },
];

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100vh;
  background-color: #7B9EFF;
  padding: 20px;
`;


const Button = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: ${props => props.secondary ? 'white' : '#000'};
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

const PatternContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
`;


const ShapeImage = styled.img`
  position: absolute;
  opacity: 0.8;
  user-select: none;
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

export const FooterShapes = () => {
  const rowCount = 8;
  const shapesPerRow = 12;

  const patternData = useMemo(() => {
    // Generate grid of shapes
    const grid = Array(rowCount).fill().map(() => 
      Array(shapesPerRow).fill(shapeOptions[0])
    );
    
    // Generate all random values up front
    const styles = Array(rowCount).fill().map(() => 
      Array(shapesPerRow).fill().map(() => ({
        size: Math.floor(Math.random() * (110 - 30)) + 30, // random size between 30-110
        blur: Math.random() < 0.3 ? Math.random() * 3 : 0,
      }))
    );
    
    // Fill grid with shapes
    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < shapesPerRow; c++) {
        let possibilities = [...shapeOptions];

        if (c > 0) {
          const leftShape = grid[r][c - 1];
          possibilities = possibilities.filter(p => p.src !== leftShape.src);
        }

        if (r > 0) {
          const upShape = grid[r - 1][c];
          possibilities = possibilities.filter(p => p.src !== upShape.src);
        }

        if (possibilities.length === 0) {
          possibilities = [...shapeOptions];
        }

        const randomIndex = Math.floor(Math.random() * possibilities.length);
        grid[r][c] = possibilities[randomIndex];
      }
    }

    return { grid, styles };
  }, []); // Empty dependency array means this only runs once

  return (
    <PatternContainer>
      {patternData.grid.map((rowArray, row) =>
        rowArray.map((shape, col) => {
          const spacing = 100 / (shapesPerRow - 1);
          const horizontalOffset = (row % 2 === 1) ? spacing / 2 : 0;
          let leftPercent = col * spacing + horizontalOffset;
          if (leftPercent > 100) leftPercent = 100;

          const style = patternData.styles[row][col];
          const finalBottom = row * 40;

          return (
            <ShapeImage
              key={`${row}-${col}`}
              src={shape.src}
              alt={shape.alt}
              style={{
                width: `${style.size}px`,
                height: `${style.size}px`,
                left: `${leftPercent}%`,
                bottom: `${finalBottom}px`,
                filter: `blur(${style.blur}px)`,
                zIndex: row,
              }}
            />
          );
        })
      )}
    </PatternContainer>
  );
};

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
