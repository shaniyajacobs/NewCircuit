import React from 'react';
import Navbar from '../components/Navbar/NavBar';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
// import {ThirdDatesOnUs} from '../components/ThirdDatesOnUs'; 
import MapPage from '../components/MapPage/MapPage';
import Current from '../components/Current';
import Waiting from '../components/Waiting';
import { Values } from '../components/Values';
import NewsletterSignup from './NewsletterSignup';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <>            
            <Navbar />
            <Hero />

            {/* ---- Events Preview ---- */}
            <section className="py-16 px-4 max-w-7xl mx-auto text-center">
                <h2 className="text-4xl font-bold mb-6 font-bricolage text-[#211F20]">
                    Upcoming Events
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                    Find your next speed‑dating event in your city.
                </p>
                <Link
                    to="/events"
                    className="inline-block bg-[#211F20] text-white font-semibold py-3 px-8 rounded-lg hover:bg-[#3a3a3a] transition"
                >
                    Browse All Events →
                </Link>
            </section>

            {/* ---- Newsletter Signup ---- */}
            <section className="py-16 px-4 bg-gray-50">
                <div className="max-w-2xl mx-auto">
                    <NewsletterSignup />
                </div>
            </section>

            {/* ---- Original components (kept) ---- */}
            <MapPage />
            <Current />
            <Values />
            <Waiting />

            <Footer />
        </>
    );
};

export default Home;