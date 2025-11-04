import React from 'react';
import NavBar from '../components/Navbar/NavBar';
import Footer from '../components/Footer';
import Pricing from '../components/Pricing';
// import PricingFAQ from '../components/PricingFAQ';

const PricingPage = () => {
  return (
    <>
      <NavBar />
      <Pricing />
      {/* <PricingFAQ /> */}
      <Footer />
    </>
  );
};

export default PricingPage; 