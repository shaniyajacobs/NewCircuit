import React from 'react';
import Navbar from '../components/Navbar/NavBar';
import PersonalityQuiz from "../components/PersonalityQuiz";
import ClientTestimonials from "../components/ClientTestimonials";
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import Info from '../components/Info';
import Pricing from '../components/Pricing';
import FAQSection from '../components/FAQ/FAQSection';
import {HowItWorks} from '../components/CircuitHowItWorks';
import {ThirdDatesOnUs} from '../components/ThirdDatesOnUs';
import {AboutSection} from '../components/About'
import {RestaurantPartnerships} from '../components/RestaurantPartnerships';
import MapPage from '../components/MapPage/MapPage'
import Current from '../components/Current';
import Waiting from '../components/Waiting';
import {Values} from '../components/Values'


const Home = () => {
    return (
        <>            
            <Navbar />
            <Hero />  
            <ThirdDatesOnUs />
            {/* <MapPage /> */}
            <Current />
            {/* <Values/> */}
            <Pricing/>
            {/* <FAQSection/> */}
            <Waiting />
            <Footer />
        </>
    )
}

export default Home;