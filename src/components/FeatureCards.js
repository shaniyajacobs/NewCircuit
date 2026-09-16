import React from 'react';
import { Link } from 'react-router-dom';
import styles from './CircuitHowItWorks.module.css';

// PLACEHOLDER – Feature data (on hold per Section 1)
// Uncomment this when re-enabling the Live E-Dates section
/*
const featureData = [
  {
    title: "Live E-Dates with Rooms",
    description: "Join our virtual speed-dating rooms for face-to-face first impressions",
    image: "/Feature1.webp"
  },
  {
    title: "Your own host to guide the experience",
    description: "A friendly host keeps the conversations flowing and makes sure everyone feels welcome.",
    image: "/Feature2.webp"
  },
  {
    title: "Our tailored algorithm finds you sparks",
    description: "Get three suggested picks from your speed date based on personality results. They'll become sparks when the feeling is mutual.",
    image: "/Feature3.webp"
  }
];
*/

function FeatureCard({ stepNum, title, description, image, isFirst, isThird, index }) {
  return (
    <div className={isThird || isFirst ? `${styles.stepcard} ${styles.stepcardArrow}` : styles.stepcard} style={{ position: 'relative' }}>
      <div
        className={styles.stepcardImage}
        style={{
          height: (isThird || index === 1) ? "var(--card3-image-height)" : "var(--card-image-height)",
          borderTopLeftRadius: "var(--card-radius)",
          borderTopRightRadius: "var(--card-radius)",
          overflow: "hidden",
          position: "relative"
        }}
      >
        <img src={image} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div
        className={styles.stepcardContent}
        style={{
          height: (isThird || index === 1) ? "var(--card3-text-height)" : "var(--card-text-height)",
          background: "#FAFFE7",
          borderBottomLeftRadius: "var(--card-radius)",
          borderBottomRightRadius: "var(--card-radius)",
          padding: "var(--card-padding)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--gap-xxs)",
        }}
      >
        <div className={styles.stepcardTitle}>{title}</div>
        <div className={styles.stepcardDesc}>{description}</div>
      </div>
    </div>
  );
}

const FeatureCards = () => {
  // PLACEHOLDER – Live E-Dates section (on hold per Section 1)
  // Return null to hide this component without breaking the app
  return null;
};

export default FeatureCards;