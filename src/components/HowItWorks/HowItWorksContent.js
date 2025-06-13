import React from 'react';
import { ThirdDatesOnUs } from '../ThirdDatesOnUs';
import MapHeroSection from '../MapPage/MapHeroSection';
import Waiting from '../Waiting';

const HowItWorksContent = () => {
    return (
        <div className="min-h-screen bg-white">
            <ThirdDatesOnUs />
            <MapHeroSection />
            <Waiting />
        </div>
    );
};

export default HowItWorksContent; 