import React from "react";
import styles from "./MapHeroSection.module.css";

const MapHeroSection = () => {
  return (
    <div className={styles.heroContainer}>
      <div className={styles.heroContentRow}>
        <div className={styles.heroColumn}>
          <div className={styles.topBox}>
            <h2 className={styles.heroHeader}>→ Dietary restrictions</h2>
            <p className={styles.heroBody}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac.</p>
          </div>
          <div className={styles.middleBox}>
            <h2 className={styles.heroHeader}>→ Budget-friendly options</h2>
            <p className={styles.heroBody}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac.</p>
          </div>
          <div className={styles.bottomBox}>
            <h2 className={styles.heroHeader}>→ Top Rated Restaurants</h2>
            <p className={styles.heroBody}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac.</p>
            <button className={styles.heroButton}>Get started</button>
          </div>
        </div>
        <div
          className={styles.heroImageBox + ' ' + styles.heroImageBoxMobileOrder}
          style={{
            display: 'flex',
            minHeight: 'var(--Min-Height-L, 800px)',
            padding: 'var(--Margins-S, 50px)',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: 'flex-start',
            flex: '1 0 0',
            alignSelf: 'stretch',
            borderRadius: 'var(--Radius-M, 16px)',
            background: `linear-gradient(rgba(0,0,0,0.00), rgba(0,0,0,0.75)), url('/restaucard.webp') lightgray 50% / cover no-repeat`,
            backgroundBlendMode: 'normal'
          }}
        >
          <h1 className={styles.heroImageText}>
            We only pick the best restaurants for you! <span style={{whiteSpace: 'nowrap'}} role="img" aria-label="food">🍲</span>
          </h1>
        </div>
      </div>
      <div className={styles.heroBottomSpacer}></div>
    </div>
  );
};

export default MapHeroSection; 