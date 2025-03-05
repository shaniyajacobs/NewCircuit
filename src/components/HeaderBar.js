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
        <div className="bg-white py-4 px-8">
            <div className="max-w-7xl mx-auto flex items-center">
                {showBack && (
                    <button 
                        onClick={() => navigate(-1)}
                        className="flex items-center text-[#151D48] hover:text-[#2a357d] transition-colors mr-8"
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
                        className={logoHeight}
                    />
                )}
                {title && (
                    <h1 className={`text-[#151D48] ${titleSize} font-bold flex-1 text-center`}>
                        {title}
                    </h1>
                )}
                <div className="min-w-[4rem]"></div>
            </div>
        </div>
    );
};

export default HeaderBar; 