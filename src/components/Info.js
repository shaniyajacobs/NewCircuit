import React from 'react';
import { Link } from 'react-router-dom';

const Info = () => {
    return (
        <div className="w-full py-16 bg-mindaro-light">
            <div className="container mx-auto px-4">
                <div className="relative flex flex-col md:flex-row items-center gap-0">
                    {/* Text Box */}
                    <div
                        className="w-full md:w-1/2 flex flex-col items-start gap-m gap-[10px] flex-1 self-stretch bg-[#F3F3F4] rounded-t-2xl md:rounded-l-2xl md:rounded-b-none md:rounded-r-none overflow-hidden"
                        style={{
                            background: 'radial-gradient(circle, #E2FF65 0%, #D2FFD7 100%)'
                        }}
                    >
                        <img
                            src="/cir_cross_PBlue.svg"
                            alt="Decorative icon"
                            className="w-12 h-12 ml-s mt-s"
                        />
                        <div className="relative w-fit ml-s mr-m">
                            {/* Header */}
                            <h2 className="font-bricolage text-h3 md:text-h2 xl:text-h1 font-semibold text-black">
                                {/* "We'll" */}
                                <span>We'll </span>
                                {/* "plug" with scribble */}
                                <span className="relative inline-block">
                                    plug
                                    <img
                                        src="/smaller_scribble.svg"
                                        alt="Scribble decoration"
                                        className="absolute bottom-[5px] opacity-50 pointer-events-none"
                                    />
                                </span>
                                {/* Rest of the text */}
                                <span> you with single locals</span>
                            </h2>
                        </div>
                        <p className="text-body-m text-black font-poppins font-normal leading-normal ml-s mr-m">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                            Suspendisse mattis metus neque, ac hendrerit risus pharetra ac. 
                            This is where you can put your main content text.
                        </p>
                        <Link to="/create-account">
                            <button className="flex items-center justify-center gap-3 py-3 px-6 rounded-lg bg-black text-mindaro-light font-poppins text-base leading-normal hover:bg-gray-800 transition-colors ml-s mr-m mb-xxl">
                                Find me a partner
                            </button>
                        </Link>
                    </div>

                    {/* Divider */}
                    <div className="absolute left-1/2 md:top-[50%] sm:top-[432px] top-[500px] md:left-1/2 md:top-[50%] transform -translate-x-1/2 -translate-y-1/2">
                        <img
                            src="/Minus2.svg"
                            alt="Minus divider"
                            className="lg:w-24 lg:h-24 w-20 h-20 rotate-6"
                        />
                    </div>

                    {/* Image Box */}
                    <div
                        className="w-full md:w-1/2 flex justify-center items-center gap-[10px] flex-1 self-stretch bg-[#F3F3F4] rounded-b-2xl md:rounded-r-2xl md:rounded-b-none overflow-hidden"
                        style={{
                            maxWidth: '2048px',
                            maxHeight: '2048px',
                        }}
                    >
                        <img
                            src="/singlelocalscard.webp"
                            alt="Single locals card"
                            className="w-full h-full object-cover"
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
