import React from 'react';
import { Link } from 'react-router-dom';
import ladyImage from '../images/lady.png'; // Import the lady image


const Hero = () => {
    return (
        <div className="w-full h-[1200px] overflow-hidden pt-20">
            <div className="w-full bg-[#0E49E8] h-[700px] flex items-center relative">
                <div className="container mx-auto">
                    <div className="flex justify-between items-center">
                        <div className="max-w-2xl -ml-4">
                            <div className="space-y-8">
                                <h4 className="text-[#E2FF65] font-semibold text-xl">Our Mission</h4>
                                <h1 
                                    className="text-6xl font-bold leading-tight text-white"
                                    style={{
                                        fontFamily: "'Poppins', sans-serif",
                                        fontWeight: "700",
                                        fontStyle: "normal",
                                        fontSize: "50px",
                                        lineHeight: "60px",
                                        letterSpacing: "-2.7px",
                                    }}
                                    >
                                    Creating Sparks<br />
                                    That Last a Lifetime
                                </h1>
                                <p className="text-xl text-white/90">
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse
                                    mattis metus neque, ac hendrerit risus pharetra ac.
                                </p>
                                <Link to="/login" className="inline-block">
                                    <button className="w-[400px] px-6 py-4 bg-[#E2FF65] text-[#0E49E8] text-2xl font-semibold rounded-[20px] hover:bg-yellow-300 transition-colors shadow-[0px_5px_4px_rgba(0,0,0,0.25)] max-md:px-5 max-md:max-w-full">
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
            <div className="bg-white h-[500px] py-16">
                <div className="container mx-auto">
                    <div className="-ml-4">
                        <h1 
                        style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: "700", // Decreased the boldness of the header
                            fontStyle: "normal",
                            fontSize: "50px",
                            lineHeight: "60px",
                            letterSpacing: "-2.7px",
                            color: "#0E49E8", // Changed the color to a lighter black
                        }}
                        className="mb-8"
                            >What Are They Saying?</h1>
                        
                        <div className="grid md:grid-cols-2 gap-12">
                            {/* First Testimonial */}
                            <div className="space-y-4">
                                <p className="text-2xl">
                                    I was hesitant to try speed dating online, but Circuit made 
                                    the experience seamless and exciting. The events are 
                                    well-organized, and the platform is so easy to use. What 
                                    sets Circuit apart is the energy—it's vibrant, immersive, 
                                    and actually fun! Plus, the incentives motivated me to 
                                    meet my matches in person, which Highly recommend to 
                                    anyone tired of the usual swiping!
                                </p>
                                <p className="text-[#0E49E8] font-bold">— Taylor J., New York City</p>
                            </div>

                            {/* Second Testimonial */}
                            <div className="space-y-4">
                                <p className="text-2xl">
                                    Circuit is unlike anything I've tried before. The virtual speed 
                                    dating events are lively and engaging, and the focus on 
                                    real-life connections is so refreshing. I loved how easy it 
                                    was to meet intentional singles who are actually looking 
                                    for something meaningful. The incentives for meeting in 
                                    person are such a unique touch—it's like they really care 
                                    about their users finding love.
                                </p>
                                <p className="text-[#0E49E8] font-bold">— Jordan L., Chicago</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;