import React from 'react';
import { Link } from 'react-router-dom';
import styles from './CircuitHowItWorks.module.css';

// Feature data
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
  return (
    <section
      className="feature-cards-section"
      style={{
        background: '#FAFFE7',
        paddingTop: 'var(--section-top, 48px)',
        paddingBottom: 'var(--section-bottom, 48px)',
        paddingLeft: 'var(--section-side, 16px)',
        paddingRight: 'var(--section-side, 16px)',
        width: '100%',
        minHeight: 'var(--section-minheight, 0)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Responsive Cards Grid */}
      <div
        className="feature-cards-container"
        style={{
          width: '100%',
          maxWidth: '1100px',
          margin: '0 auto',
          gap: '2rem',
          display: 'grid',
          gridTemplateColumns: '1fr',
          // Responsive: 3 columns on desktop, 1 on mobile
        }}
      >
        <style>{`
          @media (min-width: 1024px) {
            .feature-cards-container {
              display: grid !important;
              grid-template-columns: repeat(3, 1fr) !important;
              gap: 2rem !important;
            }
          }
        `}</style>
        {featureData.map((feature, index) => (
          <div
            key={index}
            className="feature-card-wrapper flex"
            style={{
              flexDirection: 'column',
              maxWidth: '350px',
              minWidth: '220px',
              width: '100%',
              margin: '0 auto',
            }}
          >
            <FeatureCard
              stepNum={feature.stepNum}
              title={feature.title}
              description={feature.description}
              image={feature.image}
              isFirst={index === 0}
              isThird={index === 2}
              index={index}
            />
          </div>
        ))}
      </div>
      {/* Try out Circuit button */}
      <Link to="/create-account">
        <button className={styles.howitworksBtn}
          style={{
            padding: 'var(--TopBottom-S, 12px) var(--Left-Right-M, 24px)',
            marginTop: 'var(--gap-xxl, 48px)',
            marginBottom: 'var(--section-TopBottom-M, 100px)',
            width: 'auto',
            minWidth: 'fit-content',
          }}
        >
          Try out Circuit
        </button>
      </Link>
    </section>
  );
};

export default FeatureCards; 