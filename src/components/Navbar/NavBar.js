import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../images/Cir_Primary_RGB_Mixed Black.png'; // Adjust the path based on your image location

const NavBar = () => {
    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-10 bg-white shadow-sm">
            <div className="container mx-auto py-4">
                <div className="flex justify-between h-20 items-center">
                    <div className="flex-shrink-0 -ml-4">
                        <Link to="/" className="flex items-center">
                            <img 
                                src={logo} 
                                alt="Circuit Logo" 
                                className="h-16" // Increased from h-12 to h-16
                            />
                        </Link>
                    </div>
                    
                    <div className="flex space-x-12 pr-4">
                        <button 
                            onClick={() => scrollToSection('partnerships')}
                            className="text-gray-900 hover:text-[#0E49E8] px-3 py-2 text-base font-medium flex items-center"
                        >
                            Partnerships
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={() => scrollToSection('about')}
                            className="text-gray-900 hover:text-[#0E49E8] px-3 py-2 text-base font-medium flex items-center"
                        >
                            About
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        <button className="text-gray-900 hover:text-[#0E49E8] px-3 py-2 text-base font-medium">
                            Sign In
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default NavBar;
