import React from 'react';
import circuitLogo from '../images/circuitLogo.png';
import circuitPatternBlack from '../images/circuitPatternBlack.png';
import circuitPatternBlue from '../images/circuitPatternBlue.png';

const Home = () => {
  return (
    <div style={styles.page}>
      {/* Logo Section */}
      <div style={styles.logoContainer}>
        <img src={circuitLogo} alt="Circuit Logo" style={styles.logo} />
      </div>

      {/* Coming Soon Section */}
      <div style={styles.comingSoon}>
        <h1>Circuit Speed Dating Coming Soon...</h1>
      </div>

      {/* Footer Design Section */}
      <div style={styles.footer}>
        {Array(10).fill(null).map((_, index) => {
          // Alternate black / blue
          const isBlack = index % 2 === 0;

          // Even spacing left→right
          const leftPosition = (100 / 10) * index;

          // Base bottom offset + small random wiggle
          const baseBottom = 0; 
          const verticalWiggle = Math.random() * 25;
          const finalBottom = baseBottom + verticalWiggle;

          // Small random rotation
          const rotation = Math.random() * 16 - 8; // -8 to +8 deg

          return (
            <img
              key={index}
              src={isBlack ? circuitPatternBlack : circuitPatternBlue}
              alt={`Footer Design ${index + 1}`}
              style={{
                ...styles.footerPattern,
                left: `${leftPosition}%`,
                bottom: `${finalBottom}px`,
                transform: `rotate(${rotation}deg)`,
                zIndex: isBlack ? 2 : 1
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

const styles = {
  page: {
    position: 'relative',
    backgroundColor: '#fff',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '-20px',
  },
  logo: {
    maxWidth: '100%',
    height: 'auto',
  },
  comingSoon: {
    textAlign: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '20px',
  },
  footer: {
    position: 'relative',
    width: '100%',
    height: '25vh', // bottom 25% of the screen
    overflow: 'hidden',
  },
  footerPattern: {
    position: 'absolute',
    width: '200px',
    height: '200px',
    objectFit: 'contain',
    opacity: 0.7, // less transparent
  },
};

export default Home;
