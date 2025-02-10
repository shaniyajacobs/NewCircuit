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


const Home = () => {
    return (
        <>
            <Navbar />
            <Hero />
            <HowItWorks />
            <ClientTestimonials />
            <PersonalityQuiz />
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
