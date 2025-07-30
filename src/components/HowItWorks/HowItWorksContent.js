import React from 'react';
import { ThirdDatesOnUs } from '../ThirdDatesOnUs';
import MapHeroSection from '../MapPage/MapHeroSection';
import Waiting from '../Waiting';
import HIWDescription from './HIWDescription';
import NewFeatureCard from '../NewFeatureCard';
import FeatureCards from '../FeatureCards';

const HowItWorksContent = () => {
    return (
        <div className="min-h-screen bg-white">
            <HIWDescription />
            <ThirdDatesOnUs showHeader={false} />
            <NewFeatureCard />
            <FeatureCards />
            <MapHeroSection />
            <Waiting />
        </div>
    );
};

export default HowItWorksContent; 