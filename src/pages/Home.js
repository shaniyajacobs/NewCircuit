import React from 'react';
import Navbar from '../components/Navbar/NavBar';
import Clients from '../components/Clients';
import PersonalityQuiz from "../components/PersonalityQuiz";
import ClientTestimonials from "../components/ClientTestimonials";
import Cta from '../components/Cta';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import Intro from '../components/Intro';
import Portfolio from '../components/Portfolio';
import Services from '../components/Services';
import {HowItWorks} from '../components/CircuitHowItWorks';
import {AboutSection} from '../components/About'
import {RestaurantPartnerships} from '../components/RestaurantPartnerships';
import MapPage from '../components/MapPage/MapPage'


const Home = () => {
    return (
        <>            
            <Navbar />
            <Hero />
            <HowItWorks />
            <MapPage />
            <ClientTestimonials />
            <PersonalityQuiz />
            <RestaurantPartnerships/>
            <AboutSection />
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
