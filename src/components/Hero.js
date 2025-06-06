import React from 'react';
import { Link } from 'react-router-dom';
import ladyImage from '../images/lady.png'; // Import the lady image
import styles from './Hero.module.css';


const Hero = () => {
    return (
        <div className="w-full h-[1200px] overflow-hidden">
            <div className="w-full bg-[#0E49E8] h-[700px] flex items-center relative">
                <div className="container mx-auto">
                    <div className="flex justify-between items-center">
                        <div className="max-w-2xl -ml-4">
                            <div className="space-y-8">
                                <h4 className="text-[#E2FF65] font-semibold text-xl">Our Mission</h4>
                                <h1 className="text-6xl font-bold leading-tight text-white">
                                    Creating Sparks<br />
                                    that last a lifetime
                                </h1>
                                <p className="text-xl text-white/90">
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse
                                    mattis metus neque, ac hendrerit risus pharetra ac.
                                </p>
                                <Link to="/signup" className="inline-block">
                                    <button className="bg-[#E2FF65] text-[#0E49E8] px-8 py-3 rounded-full font-semibold hover:bg-yellow-300 transition-colors">
                                        Spark Your Connection
                                    </button>
                                </Link>
                            </div>
                        </div>
                        
                        {/* Added image container */}
                        <div className="flex-shrink-0">
                            <img 
                                src={ladyImage} 
                                alt="Happy woman" 
                                className="rounded-3xl w-[500px] h-auto"
                            />
                        </div>
                    </div>
                </div>
            </div>

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
        </div>
    );
};

export default Hero;