import * as React from "react";
import styles from './CircuitHowItWorks.module.css';
import Howitworks1 from '../images/Howitworks1.webp';
import Howitworks2 from '../images/Howitworks2.webp';
import Howitworks3 from '../images/Howitworks3.webp';
import arrow from '../images/Return_Arrow1.svg'; 
import { Link } from 'react-router-dom';

// Step data
export const stepsData = [
  {
    stepNum: "STEP 01",
    title: "Sign Up to Circuit",
    description: "Create a profile & take the personality indicator. We'll use your results to guide you toward meaningful connections.",
    image: Howitworks1
  },
  {
    stepNum: "STEP 02",
    title: "Join a Date in Your City",
    description: "Sign up for a virtual speed date and meet singles in your area. After the speed date, select up to 3 connections you'd like to keep getting to know.",
    image: Howitworks2
  },
  {
    stepNum: "STEP 03",
    title: "Spark Your Connection",
    description: "Message your sparks and keep the conversation going. When things move offline, your third date includes a free drink on us!",
    image: Howitworks3
  }
];



export function StepCard({ stepNum, title, description, image, isFirst, isThird, dotColors, index }) {
  return (
    <div className={isThird || isFirst ? `${styles.stepcard} ${styles.stepcardArrow}` : styles.stepcard} style={{ position: 'relative' }}>
      {/* Arrow for step 1 and step 3 */}
      {isFirst && (
        <img
          src={arrow}
          alt="Arrow"
          className={`${styles.arrowImg} ${styles.arrowFirst}`}
          style={{
            position: 'absolute',
            right: '-75px',
            top: '-74px',
            width: '168px',
            height: '168px',
            zIndex: 3,
          }}
        />
      )}
      {isThird && (
        <img
          src={arrow}
          alt="Arrow"
          className={`${styles.arrowImg} ${styles.arrowThird}`} 
          style={{
            position: 'absolute',
            right: '-75px',
            top: '-74px',
            width: '168px',
            height: '168px',
            zIndex: 3,
          }}
        />
      )}
      <div
        className={styles.stepcardImage}
        style={{
          height: isThird ? "var(--card3-image-height)" : "var(--card-image-height)",
          borderTopLeftRadius: "var(--card-radius)",
          borderTopRightRadius: "var(--card-radius)",
          overflow: "hidden",
          position: "relative"
        }}
      >
        {/* Dots in top right */}
        <div className={styles.dotsContainer}>
          {dotColors && dotColors.map((color, idx) => (
            <div
              key={idx}
              className={styles.dot}
              style={{ background: color }}
            ></div>
          ))}
        </div>
        <img src={image} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div
        className={styles.stepcardContent}
        style={{
          height: "var(--card2-text-height)",
          background: "#FAFFE7",
          borderBottomLeftRadius: "var(--card-radius)",
          borderBottomRightRadius: "var(--card-radius)",
          padding: "var(--card-padding)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--gap-xxs)",
        }}
      >
        <div className={styles.stepcardStepnum}>{stepNum}</div>
        <div className={styles.stepcardTitle}>{title}</div>
        <div className={styles.stepcardDesc}>{description}</div>
      </div>
    </div>
  );
}

export function HowItWorks() {
  // Define dot color arrays for each card
  const mindaro = '#E2FF65';
  const mindaroLight = '#FAFFE7';
  const dotColorsArr = [
    [mindaro, mindaroLight, mindaroLight],
    [mindaro, mindaro, mindaroLight],
    [mindaro, mindaro, mindaro],
  ];
  return (
    <section
      className="howitworks-section"
      style={{
        background: '#FAFFE7',
        paddingTop: 'var(--section-top)', // Section spacing per breakpoint
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
      {/* Heading */}
      <h2
        style={{
          fontFamily: 'Bricolage Grotesque',
          fontStyle: 'normal',
          fontWeight: 600,
          fontSize: 'var(--h2)', // Heading font per breakpoint
          lineHeight: '110%',
          color: '#211F20',
          textAlign: 'center',
          marginBottom: 'var(--gap-xxl)',
        }}
      >
        How it works
      </h2>
      {/* Cards Row/Column Responsive */}
      <div
        className="relative flex flex-col md:flex-row items-center howitworks-cards-container"
        style={{
          //width: '100%',
          display: 'flex',
          //gap: 'var(--gap-m)',
          justifyContent: 'center',
          //marginBottom: 'var(--gap-xxs)',
          gap: 'var(--gap-m)',
          alignSelf: 'stretch',
        }}
      >
        {stepsData.map((step, index) => (
          <div
            key={index}
            className="howitworks-card-wrapper"
            style={{
              width: '100%',
              maxWidth: 'var(--card-maxwidth)',
              minWidth: 0,
              margin: 0,
            }}
          >
            <StepCard
              stepNum={step.stepNum}
              title={step.title}
              description={step.description}
              image={step.image}
              isFirst={index === 0}
              isThird={index === 2}
              dotColors={dotColorsArr[index]}
              index={index}
            />
          </div>
        ))}
      </div>
      {/* Learn more button */}
      <Link to="/create-account">
        <button className={styles.howitworksBtn}
          style={{
            padding: 'var(--TopBottom-S, 12px) var(--Left-Right-M, 24px)',
            marginTop: 'var(--gap-xxl)',
            marginBottom: 'var(--section-TopBottom-M, 100)',
          }}
        >
          Learn more
        </button>
      </Link>
    </section>
  );
}


