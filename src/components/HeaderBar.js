import React from 'react';
import { useNavigate } from 'react-router-dom';

const HeaderBar = ({ 
    showBack = false, 
    title = '', 
    logo,
    logoHeight = 'h-32',
    titleSize = 'text-6xl'
}) => {
    const navigate = useNavigate();

    return (
        <div className="bg-[#211F20] py-4 px-8 relative">
            <div className="max-w-7xl mx-auto flex items-center relative">
                
                {/* Left Side: Back Button + Logo */}
                <div className="flex items-center">
                    {showBack && (
                        <button 
                            onClick={() => navigate(-1)}
                            className="flex items-center text-[#F3F3F3] hover:text-[#F3F3F3] transition-colors mr-4"
                        >
                            <svg 
                                className="w-6 h-6 mr-2" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M15 19l-7-7 7-7" 
                                />
                            </svg>
                            Back
                        </button>
                    )}

                    {logo && (
                        <img 
                            src={logo} 
                            alt="Logo" 
                            className={`${logoHeight} mr-4`}
                        />
                    )}
                </div>

                {/* Centered Title */}
                {title && (
                    <h1 className={`absolute left-1/2 transform -translate-x-1/2 text-[#F3F3F3] ${titleSize} font-bold`}>
                        {title}
                    </h1>
                )}

                {/* Right-Side Spacer for Balance */}
                <div className="flex-1"></div>
            </div>
        </div>
    );
};

export default HeaderBar;
