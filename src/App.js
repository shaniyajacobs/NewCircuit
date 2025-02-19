import React, { useEffect } from 'react';
import AOS from 'aos';
import "aos/dist/aos.css";
import './index.css';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom';
// All pages
import Home from './pages/Home';
import Contact from './pages/Contact';
import DemoProduct from './pages/DemoProduct';
import LocationScreen from './pages/LocationScreen';
import QuizStartScreen from './pages/QuizStartScreen';
import {useDocTitle} from './components/CustomHook';
import ScrollToTop from './components/ScrollToTop';
import Dashboard from './pages/Dashboard';
import NavBar from './components/Navbar/NavBar';

// Preload function
const preloadImages = () => {
  const images = [
    require('./images/atlanta.jpeg').default,
    require('./images/chicago.jpeg').default,
    require('./images/dallas.jpg').default,
    require('./images/houston.jpeg').default,
    require('./images/la.jpeg').default,
    require('./images/louisville.jpg').default,
    require('./images/miami.jpeg').default,
    require('./images/nyc.jpeg').default,
    require('./images/sacremento.jpg').default,
    require('./images/seattle.jpeg').default,
    require('./images/sf.jpeg').default,
    require('./images/washington.jpeg').default
  ];

  images.forEach(src => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      // Optional: log when each image is loaded
      console.log(`Preloaded: ${src}`);
    };
  });
};

function App() {
  useEffect(() => {
    /*const aos_init = () => {
      AOS.init({
        once: true,
        duration: 1000,
        easing: 'ease-out-cubic',
      });
    }

    window.addEventListener('load', () => {
      aos_init();
    });*/
    preloadImages();
  }, []);

  useDocTitle("MLD | Molad e Konsult - Bespoke Web and Mobile Applications");

  return (
    <>
      <Router>
        <ScrollToTop>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard/*" element={<Dashboard />} /> 
            <Route path="/contact" element={<Contact />} />
            <Route path="/get-demo" element={<DemoProduct />} />
            <Route path="/signin" element={<LocationScreen />} />
            <Route path="/quiz-start" element={<QuizStartScreen />} />
          </Routes>
        </ScrollToTop>
      </Router>
    </>
  );
}


export default App;
