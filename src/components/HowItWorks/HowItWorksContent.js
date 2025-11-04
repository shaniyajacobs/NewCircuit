import React from 'react';
import { ThirdDatesOnUs } from '../ThirdDatesOnUs';
import MapHeroSection from '../MapPage/MapHeroSection';
import Waiting from '../Waiting';
import HIWDescription from './HIWDescription';
import NewFeatureCard from '../NewFeatureCard';
import FeatureCards from '../FeatureCards';
import RestaurantPartnerships from '../RestaurantPartnerships';
import styles from '../Hero.module.css';
import { testimonials } from '../testimonialsData';

const HowItWorksContent = () => {
    return (
        <div className="min-h-screen bg-white">
            <HIWDescription />
            <ThirdDatesOnUs showHeader={false} />
            <NewFeatureCard />
            <FeatureCards />
            {/* <MapHeroSection />
            <RestaurantPartnerships /> */}
            
            {/* Testimonials Section */}
            <section className={styles['testimonials-section']}>
                <div className={styles['testimonials-container']}>
                    <h2 className={styles['testimonials-heading']}>Join Thousands Already Feeling the Spark</h2>
                    <div className={styles['testimonials-list-marquee']}>
                      <div className={styles['marquee-track']}>
                        {Array.from({ length: 3 }).map((_, i) => (
                          <React.Fragment key={i}>
                            {testimonials.map((t, idx) => (
                              <div className={styles['testimonial-card']} key={`${i}-${idx}`}>
                                <div className={styles['testimonial-message']}>{t.message}</div>
                                <div className={styles['testimonial-profile']}>
                                  {/* Avatar removed */}
                                  <div className={styles['testimonial-info']}>
                                    <div className={styles['testimonial-name']}>{t.name}</div>
                                    <div className={styles['testimonial-location']}>{t.city}, {t.age}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                </div>
                <div className={styles['testimonials-bottom-gap']}></div>
            </section>
            
            <Waiting imagePath="/LastHook_BG (2).webp" />
        </div>
    );
};

export default HowItWorksContent; 