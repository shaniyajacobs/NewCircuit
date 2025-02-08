import React from 'react';
import Clients from '../components/Clients';
import Cta from '../components/Cta';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import Intro from '../components/Intro';
import Portfolio from '../components/Portfolio';
import Services from '../components/Services';
import {HowItWorks} from '../components/CircuitHowItWorks';
import {AboutSection} from '../components/About'
import {RestaurantPartnerships} from '../components/RestaurantPartnerships';

const Home = () => {
    return (
        <>
            
            <HowItWorks />
            <RestaurantPartnerships/>
            <AboutSection />
            {/* <Hero /> */}
            <Intro />
            <Services />
            <Portfolio />
            <Clients />
            <Cta/>
            <Footer />
        </>

    )
}

export default Home;

