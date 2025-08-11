import React from 'react';
import { Link } from 'react-router-dom';

const Info = () => {
    return (
        <div className="w-full py-16 bg-mindaro-light flex items-center justify-center">
            <div className="w-full px-4 flex flex-col items-center">
                {/* Text Section */}
                <div className="text-center pt-[100px] pb-[100px] pl-xs pr-xs md:pl-m md:pr-m md:pt-[150px] md:pb-[150px] lg:pl-l lg:pr-l lg:pt-[200px] lg:pb-[200px]">
                    <h2 className="font-bricolage text-[22px] lg:text-[36px] md:text-[30px] text-black font-light font-weight-[400] mb-16 max-w-[800px] mx-auto leading-[130%]">
                    Real chemistry starts with a conversation. Circuit brings singles together in a way that feels effortless and just a little electric.
 
                    </h2>
                </div>
                
                <div className="relative flex flex-col md:flex-row items-center justify-center gap-0 w-full">
                    {/* Text Box */}
                    <div
                        className="w-full md:w-1/2 xl:w-[670px] h-[396px] sm:h-[329px] md:h-[650px] lg:h-[800px] flex flex-col items-start gap-[16px] sm:gap-[20px] md:gap-[24px] lg:gap-[32px] pt-[16px] pl-[16px] pr-[24px] sm:pt-[24px] sm:pl-[24px] sm:pr-[50px] md:pt-[32px] md:pl-[32px] md:pr-[75px] lg:pt-[50px] lg:pl-[50px] lg:pr-[100px] bg-[#F3F3F4] rounded-t-2xl md:rounded-l-2xl md:rounded-b-none md:rounded-r-none overflow-hidden"
                        style={{
                            background: 'radial-gradient(circle, #E2FF65 0%, #D2FFD7 100%)'
                        }}
                    >
                        <img
                            src="/cir_cross_PBlue.svg"
                            alt="Decorative icon"
                            className="w-[24px] h-[24px] md:w-[32px] md:h-[32px] lg:w-[42px] lg:h-[42px]"
                        />
                        <div className="relative w-[303px] sm:w-[622px] md:w-[501px] lg:w-[520px]">
                            {/* Header */}
                            <h2 className="font-bricolage text-[32px] md:text-[48px] lg:text-[64px] font-semibold text-black leading-[130%]">
                                {/* "We'll" */}
                                <span>We'll </span>
                                {/* "plug" with scribble */}
                                <span className="relative inline-block ml-[12px] mr-[12px]">
                                    {'plug'}
                                    <img 
                                        src="/smaller_scribble.svg"
                                        alt="Scribble decoration"
                                        className="absolute bottom-[11px] pointer-events-none"
                                        style={{
                                            transform: 'scale(1.5)',
                                        }}
                                    />
                                </span>
                                {/* Rest of the text */}
                                <span> you with local singles</span>
                            </h2>
                        </div>
                        <p className="text-[16px] md:text-[20px] lg:text-[24px] text-black font-poppins font-light leading-normal pb-[2px] sm:pb-[4px] md:pb-[8px] lg:pb-[18px]">
                        Sign up, choose your age group, and we’ll guide you into real-time video dates with compatible singles in your area. 
                        </p>
                        <Link to="/create-account">
                            <button className="w-[148px] h-[34px] sm:w-[148px] sm:h-[34px] md:w-[166px] md:h-[41px] lg:w-[192px] lg:h-[48px] flex items-center justify-center rounded-[4px] sm:rounded-[6px] md:rounded-[6px] lg:rounded-[8px] bg-black text-mindaro-light font-poppins text-[12px] sm:text-[12px] md:text-[14px] lg:text-[16px] leading-normal transition-transform hover:scale-105 hover:opacity-60">
                                Meet someone new
                            </button>
                        </Link>
                    </div>

                    {/* Divider */}
                    <div className="absolute left-1/2 top-[400px] sm:top-[330px] transform -translate-x-1/2 -translate-y-1/2">
                        <img
                            src="/Minus2.svg"
                            alt="Minus divider"
                            className="md:w-32 md:h-32 w-20 h-20 rotate-6"
                        />
                    </div>

                    {/* Image Box */}
                    <div
                        className="w-full md:w-1/2 xl:w-[670px] flex justify-center items-center bg-[#F3F3F4] rounded-b-2xl md:rounded-r-2xl md:rounded-b-none overflow-hidden h-[350px] sm:h-[450px] md:h-[650px] lg:h-[800px]"
                    >
                        <img
                            src="/singlelocalscard.webp"
                            alt="Single locals card"
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

export default Info;
