import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Hero.module.css';
import SlidingBar from './SlidingBar';
import Info from './Info';
import {HowItWorks} from './CircuitHowItWorks';

const LightningIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="22" viewBox="0 0 12 22" fill="none" className="inline-block mr-2 align-middle">
    <path d="M9.35664 0.5L0 12.2866H4.31606L2.64336 21.5L12 9.71344H7.68394L9.35664 0.5Z" fill="#211F20" />
  </svg>
);

const Hero = () => {
  const marqueeContainerRef = useRef(null);
  const marqueeContentRef = useRef(null);
  const [repeatCount, setRepeatCount] = useState(2);

  // Testimonial card JSX
  const testimonialCard = (
    <div className={styles['testimonial-card']}>
      <div className={styles['testimonial-message']}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac.
      </div>
      <div className={styles['testimonial-profile']}>
        <img className={styles['testimonial-avatar']} src="https://randomuser.me/api/portraits/women/44.jpg" alt="Audrey M." />
        <div className={styles['testimonial-info']}>
          <div className={styles['testimonial-name']}>Audrey M.</div>
          <div className={styles['testimonial-location']}>Chicago, 20</div>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    function updateRepeatCount() {
      if (!marqueeContainerRef.current || !marqueeContentRef.current) return;
      const containerWidth = marqueeContainerRef.current.offsetWidth;
      const contentWidth = marqueeContentRef.current.offsetWidth;
      if (contentWidth === 0) return;
      // Ensure at least 2x container width for seamless looping
      const minWidth = containerWidth * 2;
      const count = Math.ceil(minWidth / contentWidth) + 1;
      setRepeatCount(count);
    }
    updateRepeatCount();
    window.addEventListener('resize', updateRepeatCount);
    return () => window.removeEventListener('resize', updateRepeatCount);
  }, []);

  return (
    <div className="w-full overflow-hidden relative">
      {/* Video Background */}
      <video
        data-testid="hero-video-bg"
        className="absolute top-0 left-0 w-full h-[890px] object-cover z-0"
        src="/Hero_Animation.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
      {/* Hero Content */}
      <div className="w-full h-[800px] flex items-center justify-center relative pt-[96px]">
        <div className="container mx-auto flex flex-col items-center justify-center h-full">
          <div className="w-full h-full flex flex-col items-center justify-center space-y-8 text-center mt-16">
            <h1
              className="font-semibold"
              style={{
                color: '#FAFFE7',
                textAlign: 'center',
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontSize: '72px',
                fontWeight: 600,
                lineHeight: '110%',
                alignSelf: 'stretch',
              }}
            >
              Creating <span style={{ color: '#E2FF65' }}>Sparks</span> That Last<br />
              a Lifetime
            </h1>
            <p
              className="text-2xl"
              style={{
                color: '#FAFFE7',
                textAlign: 'center',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '20px',
                fontWeight: 400,
                lineHeight: '130%',
                alignSelf: 'stretch',
              }}
            >
              We bring singles together for face-to-face first impressions and genuine connection.

            </p>
            <Link to="/create-account" className="inline-block">
              <button
                style={{
                  background: '#E2FF65',
                  borderRadius: '8px',
                  color: '#211F20',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '16px',
                  fontWeight: 500,
                  lineHeight: 'normal',
                  padding: '12px 28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  textAlign: 'center',
                  boxShadow: 'none',
                  gap: '8px',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.6'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                className="hover:scale-110 transition-transform"
              >
                <LightningIcon />
                Spark your connection
              </button>
            </Link>
          </div>
        </div>
      </div>
      {/* Sliding Bar: directly below hero, above testimonials */}
      <div className="w-full z-20 mt-12">
        <SlidingBar />
      </div>
      <Info />
      <HowItWorks />
            {/* Testimonials Section */}
            <section className={styles['testimonials-section']}>
                <div className={styles['testimonials-container']}>
                    <h2 className={styles['testimonials-heading']}>What They're Saying</h2>
                    <div className={styles['testimonials-list-marquee']} ref={marqueeContainerRef}>
                      {/* Hidden for measurement only */}
                      <div style={{ display: 'inline-block', visibility: 'hidden', position: 'absolute', left: 0, top: 0 }} ref={marqueeContentRef}>
                        {testimonialCard}
                      </div>
                      <div className={styles['marquee-track']}>
                        {Array.from({ length: repeatCount }).map((_, i) => (
                          <React.Fragment key={i}>{testimonialCard}</React.Fragment>
                        ))}
                      </div>
                    </div>
                </div>
                <div className={styles['testimonials-bottom-gap']}></div>
            </section>
    </div>
  );
};
export default Hero;