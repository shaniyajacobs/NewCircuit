import styled from 'styled-components';
import cirCrossPBlue from '../images/cir_cross_PWhite.svg';
import cirHeartPBlue from '../images/cir_heart_PWhite.svg';
import cirMinusPBlue from '../images/cir_minus_PWhite.svg';
import circuitLogo from '../images/Cir_Primary_RGB_Mixed White.PNG';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { signInWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";
import { auth } from "./firebaseConfig"; // Import Firebase auth
import { getDoc, doc } from 'firebase/firestore';
import { db } from "./firebaseConfig"; // Import Firestore


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

const ForgotPassword = styled.a`
  display: block;
  text-align: right;
  color: #000;
  text-decoration: none;
  font-size: 0.9rem;
  margin: -1rem 0 1.5rem;
  cursor: pointer;

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
  opacity: 0.7;
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

function seededRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export const FooterShapes = () => {
  const SEED = 777;
  const rowCount = 8;
  const shapesPerRow = 12;

  const patternData = useMemo(() => {
    // Generate grid of shapes
    const grid = Array(rowCount).fill().map(() => 
      Array(shapesPerRow).fill(shapeOptions[0])
    );
    
    // Generate all random values up front
    const styles = Array(rowCount).fill().map((_, rowIndex) => 
      Array(shapesPerRow).fill().map((_, colIndex) => {
        // Use different seeds for each shape and property
        const shapeSeed = SEED + (rowIndex * shapesPerRow + colIndex) * 10;
        return {
          size: Math.floor(seededRandom(shapeSeed) * (110 - 30)) + 30,
          blur: seededRandom(shapeSeed + 1) < 0.3 ? seededRandom(shapeSeed + 2) * 3 : 0,
        };
      })
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

        const shapeSeed = SEED + (r * shapesPerRow + c) * 10 + 3;
        const randomIndex = Math.floor(seededRandom(shapeSeed) * possibilities.length);
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

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Sign in user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // First check if user is admin
      const adminDoc = await getDoc(doc(db, 'adminUsers', userCredential.user.uid));
      if (adminDoc.exists()) {
        navigate('/admin-dashboard');
<<<<<<< Updated upstream
        console.log('Admin logged in');
        return;
      } else {
        console.log('User is not admin');
=======
        return;
>>>>>>> Stashed changes
      }

      // If not admin, continue with regular user flow
      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        setError('Please verify your email before logging in.');
        setLoading(false);
        return;
      }

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Check if account is deactivated
        if (userData.isActive === false) {
          // Keep the user signed in for reactivation
          navigate('/reactivate', { 
            state: { 
              userData,
              uid: userCredential.user.uid 
            },
            replace: true 
          });
          return;
        }
        
        // Continue with normal login flow
        navigate('/dashboard', { replace: true });
      } else {
        setError('User profile not found');
        await signOut(auth);
      }

    } catch (error) {
      console.error('Error signing in:', error);
      setError('Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = () => {
    navigate('/create-account');
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
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
            <div style={{ 
              color: 'red', 
              marginBottom: '1rem', 
              textAlign: 'center',
              padding: '10px',
              backgroundColor: '#fff1f1',
              borderRadius: '4px'
            }}>
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
            <Label htmlFor="password">
              Password
              <span 
                style={{ float: 'right', cursor: 'pointer' }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </span>
            </Label>
            <Input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </InputGroup>

          <ForgotPassword 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              handleForgotPassword();
            }}
          >
            Forgot your password?
          </ForgotPassword>

          <Button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </Button>

          <Button 
            type="button" 
            secondary 
            onClick={handleCreateAccount}
            disabled={loading}
          >
            Create an Account
          </Button>

          <Button 
            type="button" 
            secondary 
            onClick={() => navigate('/enterprise-login')}
            disabled={loading}
            style={{ backgroundColor: '#F3F3F3' }}
          >
            Are you a business?
          </Button>

          <Button 
            type="button" 
            secondary 
            onClick={() => navigate('/enterprise-create-account')}
            disabled={loading}
            style={{ backgroundColor: '#F3F3F3' }}
          >
            Create Business Account
          </Button>
        </LoginForm>
      </ContentWrapper>
    </LoginContainer>
  );
}

export default Login;
