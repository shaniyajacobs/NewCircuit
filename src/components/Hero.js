import React from 'react';
import { Link } from 'react-router-dom';
import SlidingBar from './SlidingBar';
const LightningIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="22" viewBox="0 0 12 22" fill="none" className="inline-block mr-2 align-middle">
    <path d="M9.35664 0.5L0 12.2866H4.31606L2.64336 21.5L12 9.71344H7.68394L9.35664 0.5Z" fill="#211F20" />
  </svg>
);
const Hero = () => {
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
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis<br />
              metus neque, ac hendrerit risus pharetra ac.
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
                className="transition-colors"
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
      {/* Testimonials Section */}
      <div className="bg-white h-[500px] py-16">
        <div className="container mx-auto">
          <div className="-ml-4">
            <h2 className="text-[#0E49E8] text-2xl font-bold mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
              What are they saying?
            </h2>
            <div className="grid md:grid-cols-2 gap-12">
              {/* First Testimonial */}
              <div className="space-y-4">
                <p className="text-xl" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  I was hesitant to try speed dating online, but Circuit made the experience seamless and exciting. The events are
                  well-organized, and the platform is so easy to use. What sets Circuit apart is the energy—it's vibrant, immersive,
                  and actually fun! Plus, the incentives motivated me to meet my matches in person. Highly recommend to
                  anyone tired of the usual swiping!
                </p>
                <p className="text-[#0E49E8] font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>— Taylor J., New York City</p>
              </div>
              {/* Second Testimonial */}
              <div className="space-y-4">
                <p className="text-xl" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Circuit is unlike anything I've tried before. The virtual speed dating events are lively and engaging, and the focus on
                  real-life connections is so refreshing. I loved how easy it was to meet intentional singles who are actually looking
                  for something meaningful. The incentives for meeting in person are such a unique touch—it's like they really care
                  about their users finding love.
                </p>
                <p className="text-[#0E49E8] font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>— Jordan L., Chicago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Hero;