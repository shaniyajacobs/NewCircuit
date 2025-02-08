import React from 'react';
import circuitLogo from '../images/circuitLogo.png';
import circuitPatternBlue from '../images/circuitPatternBlue.png';
import cirCrossPBlue from '../images/cir_cross_PBlue.svg';
import cirHeartPBlue from '../images/cir_heart_PBlue.svg';
import cirMinusPBlue from '../images/cir_minus_PBlue.svg';

const shapeOptions = [
  { src: cirCrossPBlue, alt: 'Cross' },
  { src: cirHeartPBlue, alt: 'Heart' },
  { src: cirMinusPBlue, alt: 'Minus' },
];
const FooterShapes = () => {
  // 4 rows + 12 shapes each → 48 total
  const rowCount = 4;
  const shapesPerRow = 12;
  const shapeGrid = [];

  // STEP 1: Build a 2D array (rowCount x shapesPerRow) of shapes
  // ensuring no two adjacent (horizontal/vertical) cells have the same shape.
  for (let r = 0; r < rowCount; r++) {
    shapeGrid[r] = [];
    for (let c = 0; c < shapesPerRow; c++) {
      let possibilities = [...shapeOptions];

      // Exclude the shape to our left if it exists
      if (c > 0) {
        const leftShape = shapeGrid[r][c - 1];
        possibilities = possibilities.filter(p => p !== leftShape);
      }

      // Exclude the shape above if it exists
      if (r > 0) {
        const upShape = shapeGrid[r - 1][c];
        possibilities = possibilities.filter(p => p !== upShape);
      }

      // Pick one of the remaining shapes randomly
      const chosenShape = possibilities[Math.floor(Math.random() * possibilities.length)];
      shapeGrid[r][c] = chosenShape;
    }
  }

  // STEP 2: Render each shape in a staggered layout
  return (
    <div style={styles.footerContainer}>
      {shapeGrid.map((rowArray, row) =>
        rowArray.map((shape, col) => {
          // If we have 12 columns, there are 11 "intervals" to reach 100% horizontally
          const spacing = 100 / (shapesPerRow - 1);

          // Stagger every other row by half a spacing
          const horizontalOffset = (row % 2 === 1) ? spacing / 2 : 0;

          // Calculate left in percent
          let leftPercent = col * spacing + horizontalOffset;
          if (leftPercent > 100) leftPercent = 100;

          // Each row is ~30px above the previous + small random wiggle
          const rowBase = row * 30;
          const wiggle = Math.random() * 10;
          const finalBottom = rowBase + wiggle;

          // **Wider size range**: 30–90 px
          const minSize = 30;
          const maxSize = 90;
          const size = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;

          // 30% chance of blur up to 3px
          const blurAmount = Math.random() < 0.3 ? Math.random() * 3 : 0;

          const uniqueKey = row * shapesPerRow + col;

          return (
            <img
              key={uniqueKey}
              src={shape.src}
              alt={shape.alt}
              style={{
                ...styles.shape,
                width: `${size}px`,
                height: `${size}px`,
                left: `${leftPercent}%`,
                bottom: `${finalBottom}px`,
                transform: 'rotate(0deg)', // keep upright
                filter: `blur(${blurAmount}px)`,
                zIndex: row, // higher rows stack on top
              }}
            />
          );
        })
      )}
    </div>
  );
};




const Home = () => {
  return (
    <div style={styles.page}>
      {/* Logo Section */}
      <div style={styles.logoContainer}>
        <img src={circuitLogo} alt="Circuit Logo" style={styles.logo} />
        <div style={styles.comingSoon}>
        <h1>Coming Soon</h1>
      </div>
      </div>

      {/* Coming Soon Section */}
      {/* <div style={styles.comingSoon}>
        <h1>Circuit Speed Dating Coming Soon...</h1>
      </div> */}
      <FooterShapes />

      {/* Footer Design Section */}
      {/* <div style={styles.footer}>
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
              src={circuitPatternBlue}
              alt={`Footer Design ${index + 1}`}
              style={{
                ...styles.footerPattern,
                left: `${leftPosition}%`,
                bottom: `${finalBottom}px`,
                // transform: `rotate(${rotation}deg)`,
                zIndex: isBlack ? 2 : 1
              }}
            />
          );
        })}
      </div> */}
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
    flexDirection: 'column',
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
  footerContainer: {
    position: 'relative',
    width: '100%',
    height: '25vh',     // or whatever height you need
    overflow: 'hidden',
    marginTop: 'auto',  // push it to bottom if your parent is flex-based
    // background: '#000', // or whatever color you want 
  },
  shape: {
    position: 'absolute',
    opacity: 0.8,      // slightly transparent
    userSelect: 'none',
  },
};

export default Home;
