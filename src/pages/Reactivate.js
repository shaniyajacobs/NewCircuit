import styled from 'styled-components';
import cirCrossPBlue from '../images/cir_cross_PWhite.svg';
import cirHeartPBlue from '../images/cir_heart_PWhite.svg';
import cirMinusPBlue from '../images/cir_minus_PWhite.svg';
import circuitLogo from '../images/Cir_Primary_RGB_Mixed White.PNG';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuth, signOut } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

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
  position: relative;
  z-index: 2;

  img {
    height: 80px;
    width: auto;
  }
`;

const LoginForm = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  min-width: 320px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 2;
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

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const PatternContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 1;
  pointer-events: none;
`;

const ShapeImage = styled.img`
  position: absolute;
  opacity: 0.7;
  user-select: none;
`;

function seededRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

const FooterShapes = () => {
  const SEED = 777;
  const rowCount = 8;
  const shapesPerRow = 12;

  const patternData = useMemo(() => {
    const grid = Array(rowCount).fill().map(() => 
      Array(shapesPerRow).fill(shapeOptions[0])
    );
    
    const styles = Array(rowCount).fill().map((_, rowIndex) => 
      Array(shapesPerRow).fill().map((_, colIndex) => {
        const shapeSeed = SEED + (rowIndex * shapesPerRow + colIndex) * 10;
        return {
          size: Math.floor(seededRandom(shapeSeed) * (110 - 30)) + 30,
          blur: seededRandom(shapeSeed + 1) < 0.3 ? seededRandom(shapeSeed + 2) * 3 : 0,
        };
      })
    );
    
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
  }, []);

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

const Reactivate = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();
  const userData = location.state?.userData;
  const uid = location.state?.uid;

  useEffect(() => {
    if (!userData || !uid) {
      navigate('/login', { replace: true });
    }
  }, [userData, uid, navigate]);

  const handleReactivate = async () => {
    try {
      setLoading(true);
      setError('');

      await updateDoc(doc(db, "users", uid), {
        isActive: true,
        reactivatedAt: new Date()
      });

      navigate('/dashboard', { replace: true });

    } catch (error) {
      console.error('Error reactivating account:', error);
      setError('Failed to reactivate account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    await signOut(auth);
    navigate('/login', { replace: true });
  };

  return (
    <LoginContainer>
      <FooterShapes />
      <Logo>
        <img src={circuitLogo} alt="Circuit" />
      </Logo>
      
      <LoginForm>
        <h1 style={{ 
          fontSize: '1.5rem',
          fontWeight: '600',
          marginBottom: '1.5rem',
          color: '#000'
        }}>
          Account Deactivated
        </h1>
        
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

        <div style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px'
        }}>
          <p style={{
            color: '#4a5568',
            fontSize: '1rem',
            marginBottom: '1rem',
            lineHeight: '1.5'
          }}>
            Your account is currently deactivated. Would you like to reactivate it?
          </p>
          <p style={{
            color: '#4a5568',
            fontSize: '1rem',
            lineHeight: '1.5'
          }}>
            Reactivating will restore access to your profile, matches, and connections.
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleReactivate}
            disabled={loading}
          >
            {loading ? 'Reactivating...' : 'Reactivate My Account'}
          </Button>

          <Button
            onClick={handleCancel}
            disabled={loading}
            secondary
          >
            Return to Login
          </Button>
        </div>
      </LoginForm>
    </LoginContainer>
  );
};

export default Reactivate;
