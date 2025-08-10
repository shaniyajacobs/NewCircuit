import React from 'react';
import { Link } from 'react-router-dom';

const Current = () => {
    return (
        <div className="w-full py-16 bg-mindaro-light flex items-center justify-center">
            <div className="w-full px-4 flex flex-col items-center">          
                <div className="relative flex flex-col md:flex-row items-center justify-center gap-0 w-full">
                    {/* Text Box */}
                    <div
                        className="w-full md:w-1/2 xl:w-[670px] h-[396px] sm:h-[329px] md:h-[650px] lg:h-[800px] flex flex-col items-start gap-[16px] sm:gap-[20px] md:gap-[24px] lg:gap-[32px] pt-[16px] pl-[16px] pr-[24px] sm:pt-[24px] sm:pl-[24px] sm:pr-[50px] md:pt-[32px] md:pl-[32px] md:pr-[75px] lg:pt-[50px] lg:pl-[50px] lg:pr-[100px] bg-[#F3F3F4] rounded-t-2xl md:rounded-l-2xl md:rounded-b-none md:rounded-r-none overflow-hidden"
                        style={{
                            background: 'radial-gradient(circle, #B4FFF2 0%, #E1FFD6 100%)'
                        }}
                    >
                        <img
                            src="/Cir_Logomark_RGB_Mixed White.svg"
                            alt="Circuit Logo"
                            className="w-[24px] h-[24px] md:w-[32px] md:h-[32px] lg:w-[42px] lg:h-[42px]"
                        />
                        <div className="relative w-[303px] sm:w-[622px] md:w-[501px] lg:w-[520px]">
                            {/* Header */}
                            <h2 className="font-bricolage text-[32px] md:text-[48px] lg:text-[64px] font-semibold text-black leading-[130%]">
                                {/* "We'll" */}
                                <span> Our app will make you feel the </span>
                                {/* "plug" with scribble */}
                                <span className="relative inline-block ml-[12px] mr-[12px]">
                                    current
                                    <img 
                                        src="/bigger_scribble.svg"
                                        alt="Scribble decoration"
                                        className="absolute bottom-[11px] pointer-events-none"
                                        style={{
                                            transform: 'scale(1.2)',
                                        }}
                                    />
                                </span>
                            </h2>
                        </div>
                        <p className="text-[16px] md:text-[20px] lg:text-[24px] text-black font-poppins font-light leading-normal pb-[2px] sm:pb-[4px] md:pb-[8px] lg:pb-[18px]">
                        From the instant you connect to the moment you meet in person, Circuit keeps the energy alive and turns first impressions into unforgettable experiences.
                        </p>
                        <Link to="/create-account">
                            <button className="w-[114px] h-[34px] sm:w-[114px] sm:h-[34px] md:w-[127px] md:h-[41px] lg:w-[147px] lg:h-[48px] flex items-center justify-center rounded-[4px] sm:rounded-[6px] md:rounded-[6px] lg:rounded-[8px] bg-black text-mindaro-light font-poppins text-[12px] sm:text-[12px] md:text-[14px] lg:text-[16px] leading-normal transition-transform hover:scale-105 hover:opacity-60">
                                Sign up now
                            </button>
                        </Link>
                    </div>

                    {/* Divider */}
                    <div className="absolute left-1/2 top-[400px] sm:top-[330px] transform -translate-x-1/2 -translate-y-1/2 scale-[125%] md:scale-[135%]">
                        <img
                            src="/Heart2.svg"
                            alt="Heart divider"
                            className="md:w-24 md:h-24 w-12 h-12 rotate-6"
                        />
                    </div>

                    {/* Image Box */}
                    <div
                        className="w-full md:w-1/2 xl:w-[670px] flex justify-center items-center bg-[#F3F3F4] rounded-b-2xl md:rounded-r-2xl md:rounded-b-none overflow-hidden h-[350px] sm:h-[450px] md:h-[650px] lg:h-[800px]"
                    >
                        <img
                            src="/ourappcard.webp"
                            alt="Our app card"
                            className="w-full h-[350px] sm:h-[450px] md:h-[650px] lg:h-[800px] xl:w-[670px] object-cover"
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

export default Current;
