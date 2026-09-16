import React from 'react';

const GradientDescription = ({ 
    headerText,
    bodyText,
    gradientColors = {
        inside: "#8EFF7A",
        outside: "#D7FFF8"
    }
}) => {
    return (
        <div 
            style={{
                background: `radial-gradient(circle at center, ${gradientColors.inside} 0%, ${gradientColors.outside} 100%)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
            className="text-left rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl w-full px-4 sm:px-6 md:px-8 lg:px-12 py-3 sm:py-4 md:py-6 lg:py-8"
        >
            <h2 
                style={{
                    fontFamily: '"Bricolage Grotesque", sans-serif',
                    fontWeight: 520,
                    lineHeight: '120%',
                }}
                className="text-lg sm:text-xl md:text-2xl lg:text-4xl text-[#211F20] mb-3 sm:mb-4 md:mb-5 lg:mb-6"
            >
                → {headerText}
            </h2>
            <p 
                style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 400,
                    lineHeight: '150%',
                }}
                className="text-xs sm:text-sm md:text-base lg:text-lg text-[#211F20]"
            >
                {bodyText}
            </p>
        </div>
    );
};

export default GradientDescription; 