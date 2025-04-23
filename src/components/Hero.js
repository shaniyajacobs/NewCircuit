import React from 'react';
import { Link } from 'react-router-dom';
import ladyImage from '../images/lady.png'; // Import the lady image

const Hero = () => {
    return (
        <div className="w-full h-[1000px] overflow-hidden pt-16"> {/* Reduced height and padding */}
            <div className="w-full bg-[#0E49E8] h-[600px] flex items-center relative">
                <div className="container mx-auto">
                    <div className="flex justify-between items-center">
                        <div className="max-w-2xl -ml-4">
                            <div className="space-y-4"> {/* Reduced space-y */}
                                <h4 className="text-[#E2FF65] font-semibold text-lg">Our Mission</h4> {/* Reduced text size */}
                                <h1 className="text-4xl font-bold leading-tight text-white"> {/* Reduced text size */}
                                    Creating Sparks<br />
                                    that last a lifetime
                                </h1>
                                <p className="text-base text-white/90"> {/* Reduced text size */}
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse
                                    mattis metus neque, ac hendrerit risus pharetra ac.
                                </p>
                                <Link to="/signup" className="inline-block">
                                    <button className="bg-[#E2FF65] text-[#0E49E8] px-6 py-2 rounded-full font-semibold hover:bg-yellow-300 transition-colors"> {/* Reduced padding */}
                                        Spark Your Connection
                                    </button>
                                </Link>
                            </div>
                        </div>
                        
                        {/* Image Container */}
                        <div className="flex-shrink-0">
                            <img 
                                src={ladyImage} 
                                alt="Happy woman" 
                                className="rounded-3xl w-[400px] h-auto" 
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Testimonials Section */}
            <div className="bg-white h-[80vh] py-12"> {/* Reduced height and padding */}
                <div className="container mx-auto">
                    <div className="-ml-4">
                        <h2 className="text-[#0E49E8] text-xl font-bold mb-6">What are they saying?</h2> {/* Reduced text size and margin */}
                        
                        <div className="grid md:grid-cols-2 gap-8"> {/* Reduced gap */}
                            {/* First Testimonial */}
                            <div className="space-y-3"> {/* Reduced space-y */}
                                <p className="text-lg"> {/* Reduced text size */}
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
                            <div className="space-y-3"> {/* Reduced space-y */}
                                <p className="text-lg"> {/* Reduced text size */}
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
