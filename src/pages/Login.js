import React, { useState } from 'react';
import styled from 'styled-components';
import cirCrossPBlue from '../images/cir_cross_PWhite.svg';
import cirHeartPBlue from '../images/cir_heart_PWhite.svg';
import cirMinusPBlue from '../images/cir_minus_PWhite.svg';
import circuitLogo from '../images/Cir_Secondary_RGB_Mixed Blackk.png';


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
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 0;
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
  const shapeGrid = [];

  // Build shape grid
  for (let r = 0; r < rowCount; r++) {
    shapeGrid[r] = [];
    for (let c = 0; c < shapesPerRow; c++) {
      let possibilities = [...shapeOptions];

      if (c > 0) {
        const leftShape = shapeGrid[r][c - 1];
        possibilities = possibilities.filter(p => p !== leftShape);
      }

      if (r > 0) {
        const upShape = shapeGrid[r - 1][c];
        possibilities = possibilities.filter(p => p !== upShape);
      }

      const chosenShape = possibilities[Math.floor(Math.random() * possibilities.length)];
      shapeGrid[r][c] = chosenShape;
    }
  }

  return (
    <PatternContainer>
      {shapeGrid.map((rowArray, row) =>
        rowArray.map((shape, col) => {
          const spacing = 100 / (shapesPerRow - 1);
          const horizontalOffset = (row % 2 === 1) ? spacing / 2 : 0;
          let leftPercent = col * spacing + horizontalOffset;
          if (leftPercent > 100) leftPercent = 100;

          const rowBase = row * 40;
          const wiggle = Math.random() * 10;
          const finalBottom = rowBase + wiggle;

          const minSize = 30;
          const maxSize = 110;
          const size = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
          const blurAmount = Math.random() < 0.3 ? Math.random() * 3 : 0;

          return (
            <ShapeImage
              key={`${row}-${col}`}
              src={shape.src}
              alt={shape.alt}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${leftPercent}%`,
                bottom: `${finalBottom}px`,
                filter: `blur(${blurAmount}px)`,
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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login attempt with:', { email, password });
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
            />
          </InputGroup>

          <ForgotPassword href="/forgot-password">
            Forgot your password
          </ForgotPassword>

          <Button type="submit">Log in</Button>
          <Button type="button" secondary>
            Create an Account
          </Button>
        </LoginForm>
      </ContentWrapper>
    </LoginContainer>
  );
};

export default Login;
