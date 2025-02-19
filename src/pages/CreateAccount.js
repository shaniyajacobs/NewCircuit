import styled from 'styled-components';
import cirCrossPBlue from '../images/cir_cross_PWhite.svg';
import cirHeartPBlue from '../images/cir_heart_PWhite.svg';
import cirMinusPBlue from '../images/cir_minus_PWhite.svg';
import circuitLogo from '../images/Cir_Secondary_RGB_Mixed Blackk.png';
import React, { useState, useEffect, useMemo } from 'react';
import { auth, db } from './firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';


const shapeOptions = [
  { src: cirCrossPBlue, alt: 'Cross' },
  { src: cirHeartPBlue, alt: 'Heart' },
  { src: cirMinusPBlue, alt: 'Minus' },
];

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #7B9EFF;
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

const ForgotPassword = styled.a`
  display: block;
  text-align: right;
  color: #333;
  text-decoration: none;
  font-size: 0.9rem;
  margin: -1rem 0 1.5rem;

  &:hover {
    text-decoration: underline;
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
  padding: 0 20px;
`;

const FooterShapes = () => {
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

          const rowBase = row * 40;
          const { size, blur } = patternData.styles[row][col];

          return (
            <ShapeImage
              key={`${row}-${col}`}
              src={shape.src}
              alt={shape.alt}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${leftPercent}%`,
                bottom: `${rowBase}px`,
                filter: `blur(${blur}px)`,
                zIndex: row,
              }}
            />
          );
        })
      )}
    </PatternContainer>
  );
};

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
        return;
      }

      // Validate password strength
      if (createPassword.length < 6) {
        setError('Password should be at least 6 characters');
        return;
      }

      console.log('Attempting navigation with:', { email, password: createPassword }); // Debug log

      // Store credentials in state and navigate to profile
      navigate('/profile', {
        state: {
          email: email,
          password: createPassword
        },
        replace: true
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
            <Label htmlFor="createPassword">
              Create Password
            </Label>
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
            <Label htmlFor="reenterPassword">
              Re-enter Password
            </Label>
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
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </LoginForm>
      </ContentWrapper>
    </LoginContainer>
  );
};

export default CreateAccount;
