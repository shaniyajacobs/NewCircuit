import React from 'react';
import GradientDescription from './GradientDescription';
import { Link } from 'react-router-dom';

const HIWDescription = () => {
    return (
        <>
            <div className="w-full bg-[#FAFFE7] py-8 sm:py-12 md:py-16 lg:py-[100px]">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-[100px]">
                    <div className="flex flex-col items-center text-center w-full">
                        <h1 
                            style={{
                                fontFamily: '"Bricolage Grotesque", sans-serif',
                                fontWeight: 520,
                                lineHeight: '120%',
                            }}
                            className="text-2xl sm:text-3xl md:text-4xl lg:text-[64px] text-[#211F20] mb-6 sm:mb-8 md:mb-12 lg:mb-[100px] w-full"
                        >
                            How It Works
                        </h1>
                        <div className="flex flex-col items-center text-center gap-4 sm:gap-6 md:gap-8 lg:gap-[50px] w-full">
                            <GradientDescription 
                                headerText="Sign Up on Circuit"
                                bodyText="Create your profile and take our personality indicator so we can connect you with potential sparks in your area."
                                gradientColors={{
                                    inside: "#79FFC7",
                                    outside: "#FFF9A1"
                                }}
                            />
                            <GradientDescription 
                                headerText="Find a Speed Date in Your City"
                                bodyText="Choose from upcoming virtual speed dating events designed to help you meet new people face-to-face, all from your home."
                                gradientColors={{
                                    inside: "#8EFF7A",
                                    outside: "#D7FFF8"
                                }}
                            />
                            <GradientDescription 
                                headerText="Join the Event"
                                bodyText="Hop into the virtual room and enjoy a series of quick, engaging conversations that let you make real first impressions"
                                gradientColors={{
                                    inside: "#B0EEFF",
                                    outside: "#E7E9FF"
                                }}
                            />
                            <GradientDescription 
                                headerText="Select Up to 3 Connections"
                                bodyText="After the event, choose the people you’d like to connect with further. If they choose you too, it’s a spark! Time to start Chatting!"
                                gradientColors={{
                                    inside: "#B4FFF2",
                                    outside: "#E1FFD6"
                                }}
                            />
                            <GradientDescription 
                                headerText="Take It Offline"
                                bodyText="Plan your first two in-person dates, then claim your free drinks or appetizers when you reach your third date together with our Third Date On Us offer."
                                gradientColors={{
                                    inside: "#E2FF65",
                                    outside: "#D2FFD7"
                                }}
                            />
                        </div>
                        <Link to="/create-account" className="inline-block mt-6 sm:mt-8 md:mt-12 lg:mt-[100px]">
                            <button
                                style={{
                                    background: '#211F20',
                                    borderRadius: '8px',
                                    color: '#FAFFE7',
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
                                className="transition-colors hover:scale-110 transition-transform"
                            >
                                Sign up now
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
            
            {/* Full-width image component */}
            <div className="w-full bg-[#FAFFE7] py-8 sm:py-12 md:py-16 lg:py-[100px]">
                <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12">
                    <div className="relative">
                        {/* Heart SVG Overlay */}
                        <div className="absolute -top-6 sm:-top-8 md:-top-10 lg:-top-12 left-4 sm:left-6 md:left-8 lg:left-8 z-20">
                            <img 
                                src="/Heart (1).svg" 
                                alt="Heart Icon"
                                className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 transform rotate-6"
                            />
                        </div>
                        
                        <div className="w-full h-80 sm:h-96 md:h-[456px] lg:h-[560px] relative overflow-hidden rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl">
                            <img 
                                src="/thirddate1.webp" 
                                alt="Circuit Hero Animation"
                                className="w-full h-full object-cover"
                            />
                            
                            {/* Black Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl"></div>
                            
                            {/* Text Overlay */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                                <h2 
                                    style={{
                                        color: '#FAFFE7',
                                        textAlign: 'center',
                                        fontFamily: '"Bricolage Grotesque", sans-serif',
                                        fontWeight: 600,
                                        lineHeight: '110%',
                                        alignSelf: 'stretch',
                                    }}
                                    className="text-[32px] sm:text-[32px] md:text-[48px] lg:text-[64px] pb-[16px] sm:pb-[16px] md:pb-[20px] lg:pb-[24px] drop-shadow-lg"
                                >
                                    Third Date On Us
                                </h2>
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
                                    className="text-[14px] sm:text-[14px] md:text-[16px] lg:text-[20px] max-w-[350px] md:max-w-[500px] lg:max-w-[800px] font-light drop-shadow-lg mb-4 sm:mb-6 md:mb-8 lg:mb-10"
                                >
                                    Some connections are worth celebrating. We’ll treat you on date number three.
                                </p>
                                
                                {/* Arrow SVG */}
                                <div className="flex justify-center mt-7">
                                    <img 
                                        src="/thirddatearrow.svg" 
                                        alt="Arrow Icon"
                                        className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default HIWDescription; 