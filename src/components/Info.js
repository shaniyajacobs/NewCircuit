import React from 'react';

const Info = () => {
    return (
        <div className="w-full py-16 bg-white">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    {/* Text Box */}
                    <div
                        className="w-full md:w-1/2 flex flex-col items-start gap-m self-stretch"
                        style={{
                            background: 'radial-gradient(circle, #E2FF65 0%, #D2FFD7 100%)'
                        }}
                    >
                        <img
                            src="/cir_cross_PBlue.svg"
                            alt="Decorative icon"
                            className="mb-4 w-12 h-12"
                        />
                        <div className="relative w-fit">
                            {/* Header */}
                            <h2 className="font-bricolage text-h3 md:text-h2 xl:text-h1 font-semibold text-[#211F20]">
                                {/* "We'll" */}
                                <span>We'll </span>
                                {/* "plug" with scribble */}
                                <span className="relative inline-block">
                                    plug
                                    <img
                                        src="/smaller_scribble.svg"
                                        alt="Scribble decoration"
                                        className="absolute left-[-8px] bottom-[-73px] opacity-50 pointer-events-none"
                                        style={{ width: '215px', height: '215px' }}
                                    />
                                </span>
                                {/* Rest of the text */}
                                <span> you with single locals</span>
                            </h2>
                        </div>
                        <p className="text-body-l text-[#211F20] font-poppins font-normal leading-normal">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                            Suspendisse mattis metus neque, ac hendrerit risus pharetra ac. 
                            This is where you can put your main content text.
                        </p>
                        <button className="flex items-center justify-center gap-3 py-3 px-6 rounded-lg bg-[#211F20] text-[#FAFFE7] font-poppins text-base leading-normal hover:bg-gray-800 transition-colors">
                            Find me a partner
                        </button>
                    </div>

                    {/* Image Box */}
                    <div
                        className="w-full md:w-1/2 flex justify-center items-center gap-[10px] flex-1 self-stretch bg-[#F3F3F4] rounded-r-2xl overflow-hidden"
                        style={{
                            borderRadius: '0px 16px 16px 0px',
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
