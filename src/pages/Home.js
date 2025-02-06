import React from "react";
import ClientTestimonials from "../components/ClientTestimonials";
import Clients from "../components/Clients";
import PersonalityQuiz from "../components/PersonalityQuiz";
import Cta from "../components/Cta";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import Intro from "../components/Intro";
import Portfolio from "../components/Portfolio";
import Services from "../components/Services";

const Home = () => {
  return (
    <>
      <Hero />
      <Intro />
      <Services />
      <ClientTestimonials />
      <PersonalityQuiz />
      <Portfolio />
      <Clients />
      <Cta />
      <Footer />
    </>
  );
};

export default Home;
