import React from 'react';
import { Link } from 'react-router-dom';
import Howitworks2 from '../images/Howitworks2.webp';


const NewFeatureCard = () => {
    return (
        <div className="w-full py-16 bg-[#FAFFE7] flex items-center justify-center">
            <div className="container mx-auto px-4 flex flex-col items-center">
                
                <div className="relative flex flex-col md:flex-row items-center justify-center gap-0 w-full">
                    {/* Text Box */}
                    <div
                        className="w-[358px] h-[450px] sm:w-[696px] sm:h-[400px] md:w-[608px] md:h-[700px] lg:w-[670px] lg:h-[850px] flex flex-col items-start gap-[16px] sm:gap-[20px] md:gap-[24px] lg:gap-[32px] pt-[16px] pl-[16px] pr-[24px] pb-[64px] sm:pt-[24px] sm:pl-[24px] sm:pr-[50px] sm:pb-[72px] md:pt-[32px] md:pl-[32px] md:pr-[75px] md:pb-[70px] lg:pt-[50px] lg:pl-[50px] lg:pr-[100px] lg:pb-[80px] bg-[#F3F3F4] rounded-t-2xl md:rounded-l-2xl md:rounded-b-none md:rounded-r-none overflow-hidden"
                        style={{
                            background: 'radial-gradient(circle, #E2FF65 0%, #D2FFD7 100%)'
                        }}
                    >
                        <img
                            src="/Cir_Logomark_RGB_Mixed White.svg"
                            alt="Heart icon"
                            className="w-[24px] h-[24px] md:w-[32px] md:h-[32px] lg:w-[42px] lg:h-[42px]"
                        />
                        <div className="relative w-[303px] sm:w-[622px] md:w-[501px] lg:w-[520px]">
                            <h2 className="font-bricolage text-[32px] md:text-[48px] lg:text-[64px] font-semibold text-black leading-[130%]">
                                Take Our Personality Indicator Today
                            </h2>
                        </div>
                        <p className="text-[16px] md:text-[20px] lg:text-[24px] text-black font-poppins font-light leading-normal pb-[2px] sm:pb-[4px] md:pb-[8px] lg:pb-[18px]">
                        Discover your top 3 suggested connections, tailored by our personality insights.
                        </p>
                        <Link to="/create-account">
                            <button className="px-6 py-2 sm:px-6 sm:py-2 md:px-7 md:py-2.5 lg:px-8 lg:py-3 flex items-center justify-center rounded-[4px] sm:rounded-[6px] md:rounded-[6px] lg:rounded-[8px] bg-black text-white font-poppins text-[12px] sm:text-[12px] md:text-[14px] lg:text-[16px] leading-normal transition-transform hover:scale-105 hover:opacity-60 mb-16 sm:mb-20 md:mb-24 lg:mb-32">
                                Take the personality indicator
                            </button>
                        </Link>
                    </div>

                    {/* Divider */}
                    <div className="absolute left-1/2 top-[450px] sm:top-[400px] md:top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <img
                            src="/Minus.svg"
                            alt="Minus divider"
                            className="md:w-32 md:h-32 w-20 h-20 -rotate-6"
                        />
                    </div>

                    {/* Image Box */}
                    <div
                        className="w-[358px] flex justify-center items-center bg-[#F3F3F4] rounded-b-2xl md:rounded-r-2xl md:rounded-b-none overflow-hidden h-[350px] sm:h-[450px] sm:w-[696px] md:h-[700px] md:w-[608px] lg:h-[850px] lg:w-[670px]"
                    >
                        <img
                            src={Howitworks2}
                            alt="Matching feature card"
                            className="w-[358px] h-[350px] sm:h-[450px] sm:w-[696px] md:h-[700px] md:w-[608px] lg:h-[850px] lg:w-[670px] object-cover"
                            style={{
                                aspectRatio: '1/1',
                                minHeight: 0,
                                minWidth: 0,
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewFeatureCard; 