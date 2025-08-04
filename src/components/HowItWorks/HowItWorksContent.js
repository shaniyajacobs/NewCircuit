import React from 'react';
import { ThirdDatesOnUs } from '../ThirdDatesOnUs';
import MapHeroSection from '../MapPage/MapHeroSection';
import Waiting from '../Waiting';
import HIWDescription from './HIWDescription';
import NewFeatureCard from '../NewFeatureCard';
import FeatureCards from '../FeatureCards';
import RestaurantPartnerships from '../RestaurantPartnerships';
import styles from '../Hero.module.css';

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
                    <h2 className={styles['testimonials-heading']}>What they're saying</h2>
                    <div className={styles['testimonials-list-marquee']}>
                      <div className={styles['marquee-track']}>
                        {[...Array(6)].map((_, i) => (
                          <div className={styles['testimonial-card']} key={i}>
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
                        ))}
                        {[...Array(6)].map((_, i) => (
                          <div className={styles['testimonial-card']} key={`dup-${i}`}>
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