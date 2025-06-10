import React from 'react';
import { Link } from 'react-router-dom';

const Waiting = () => {
  return (
    <div className="w-full overflow-hidden relative">
      {/* Background Image */}
      <img
        src="/Lasthook_BG.webp"
        alt="Background"
        className="absolute top-0 left-0 w-full h-[350px] sm:h-[450px] md:h-[650px] lg:h-[800px] object-cover z-0"
      />
      
      {/* Content Overlay */}
      <div className="w-full h-[350px] sm:h-[450px] md:h-[650px] lg:h-[800px] flex items-center justify-center relative">
        <div className="container mx-auto flex flex-col items-center justify-center h-full">
          <div className="w-full h-full flex flex-col items-center justify-center space-y-8 text-center">
            <img
                src="/Minus.svg"
                alt="Minus decoration"
                className="w-24 h-24 md:w-32 md:h-32 -rotate-6"
            />
            <h1
              style={{
                color: '#FAFFE7',
                textAlign: 'center',
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontWeight: 600,
                lineHeight: '110%',
                alignSelf: 'stretch',
              }}
              className="text-[32px] sm:text-[32px] md:text-[48px] lg:text-[64px] pb-[16px] sm:pb-[16px] md:pb-[20px] lg:pb-[24px]"
            >
              What are you waiting for?
            </h1>
            <p
              style={{
                color: '#FAFFE7',
                textAlign: 'center',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 400,
                lineHeight: '130%',
                alignSelf: 'stretch',
                margin: '0 auto',
              }}
              className="text-[14px] sm:text-[14px] md:text-[16px] lg:text-[20px] max-w-[350px] md:max-w-[500px] lg:max-w-[800px] font-light"
            >
              Sign up now to meeting other singles around your area. Circuit Sparks have a 43x chance to meet their significant others compared to other apps.
            </p>
            <Link to="/create-account" className="inline-block">
              <button
                className="flex items-center justify-center gap-3 px-4 rounded-lg bg-[#E2FF65] text-black font-poppins leading-normal transition-all hover:scale-105 hover:opacity-60 w-[114px] md:w-[127px] lg:w-[147px] h-[34px] lg:h-[48px] text-[12px] md:text-[14px] lg:text-[16px] whitespace-nowrap"
              >
                Sign up now
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Waiting;
