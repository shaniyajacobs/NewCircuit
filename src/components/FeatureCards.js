import React from 'react';
import { Link } from 'react-router-dom';
import styles from './CircuitHowItWorks.module.css';

// Feature data
const featureData = [
  {
    title: "Live E-Dates with Rooms",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac.",
    image: "/Feature1.webp"
  },
  {
    title: "Your own host to guide the experience",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac.",
    image: "/Feature2.webp"
  },
  {
    title: "Our tailored algorithm finds you sparks",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac.",
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
        paddingTop: 'var(--section-top)',
        paddingBottom: 'var(--section-bottom)',
        paddingLeft: 'var(--section-side)',
        paddingRight: 'var(--section-side)',
        width: '100%',
        minHeight: 'var(--section-minheight)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Cards Row/Column Responsive */}
      <div
        className="relative flex flex-col md:flex-row items-center feature-cards-container"
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'var(--gap-m)',
          alignSelf: 'stretch',
        }}
      >
        {featureData.map((feature, index) => (
          <div
            key={index}
            className="feature-card-wrapper"
            style={{
              flex: '0 0 auto',
              width: 'var(--card-width)',
              minWidth: 'var(--card-minwidth)',
              maxWidth: 'var(--card-maxwidth)',
              margin: 0,
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
            marginTop: 'var(--gap-xxl)',
            marginBottom: 'var(--section-TopBottom-M, 100)',
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