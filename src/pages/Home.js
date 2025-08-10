import React from 'react';
import Navbar from '../components/Navbar/NavBar';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import Pricing from '../components/Pricing';
import FAQSection from '../components/FAQ/FAQSection';
import {ThirdDatesOnUs} from '../components/ThirdDatesOnUs';
import MapPage from '../components/MapPage/MapPage'
import Current from '../components/Current';
import Waiting from '../components/Waiting';
import {Values} from '../components/Values'
import UpcomingEventsHome from '../components/UpcomingEventsHome';

const Home = () => {
    return (
        <>            
            <Navbar />
            <Hero />  
            <ThirdDatesOnUs />
            <UpcomingEventsHome />
            <MapPage />
            <Current />
            <Values/>
            <Pricing/>
            <FAQSection/>
            <Waiting />
            <Footer />
        </>
    )
}

export default Home;