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
            className="text-left rounded-[8px] sm:rounded-[10px] md:rounded-[12px] lg:rounded-[16px] w-[358px] sm:w-[696px] md:w-[1216px] lg:w-[1340px] pl-[16px] sm:pl-[24px] md:pl-[32px] lg:pl-[50px] pr-[16px] sm:pr-[24px] md:pr-[32px] lg:pr-[50px] pt-[12px] sm:pt-[16px] md:pt-[24px] lg:pt-[32px] pb-[16px] sm:pb-[24px] md:pb-[32px] lg:pb-[50px]"
        >
            <h2 
                style={{
                    fontFamily: '"Bricolage Grotesque", sans-serif',
                    fontWeight: 520,
                    lineHeight: '120%',
                }}
                className="text-[24px] sm:text-[24px] md:text-[32px] lg:text-[40px] text-[#211F20] mb-[16px] sm:mb-[16px] md:mb-[20px] lg:mb-[24px]"
            >
                → {headerText}
            </h2>
            <p 
                style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 400,
                    lineHeight: '150%',
                }}
                className="text-[12px] sm:text-[12px] md:text-[14px] lg:text-[16px] text-[#211F20]"
            >
                {bodyText}
            </p>
        </div>
    );
};

export default GradientDescription; 