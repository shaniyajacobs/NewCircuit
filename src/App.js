import React, { useEffect, useState } from 'react';
import AOS from 'aos';
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import "aos/dist/aos.css";
import './index.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// All pages
import Home from './pages/Home';
import Contact from './pages/Contact';
import DemoProduct from './pages/DemoProduct';
import Login from './pages/Login';
import CreateAccount from './pages/CreateAccount';
import ForgotPassword from './pages/ForgotPassword';
import ReEnterPassword from './pages/ReEnterPassword';
import Profile from './pages/Profile';
import VerifyPhone from './pages/VerifyPhone';
import VerifyEmail from './pages/VerifyEmail';
import LocationScreen from './pages/LocationScreen';
import QuizStartScreen from './pages/QuizStartScreen';
import PersonalityQuizPage from './pages/PersonalityQuizPage';
import Reactivate from './pages/Reactivate';
import EnterpriseLogin from './pages/EnterpriseLogin';
import EnterpriseCreateAccount from './pages/EnterpriseCreateAccount';
import EnterpriseProfile from './pages/EnterpriseProfile';
import EnterpriseUserProfile from './pages/EnterpriseUserProfile';
import EnterpriseVerifyEmail from './pages/EnterpriseVerifyEmail';
import EnterpriseDash from './pages/EnterpriseDash';
import AdminDashboard from './pages/AdminDashboard';
import PricingPage from './pages/Pricing';
import FAQPage from './pages/FAQPage';
import HowItWorks from './pages/HowItWorks';

import { getAuth, onAuthStateChanged } from "firebase/auth";
import { ProfileProvider } from './contexts/ProfileContext';
import {useDocTitle} from './components/CustomHook';
import ScrollToTop from './components/ScrollToTop';
import Dashboard from './pages/Dashboard';
import NavBar from './components/Navbar/NavBar';
import FinalQuizPage from './pages/finalQuizPage';
import PreferencePage from './pages/preferencePage';
import Legal from './pages/Legal';
import AllDates from './components/Dashboard/DashboardPages/AllDates';
import { db } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const stripePromise = loadStripe("pk_test_51RHbstPpnLZEC8ZQlHoFbnmUGkkKT52aCLMYlMN6fgzmWnVFEPVv8mulHh1PJJaQJRN5yghwIJTfTgumFXt0H3Y400P8jrINGs");

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

// Move PrivateRoute component definition before App component
const PrivateRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        try {
          const docSnap = await getDoc(doc(db, 'users', currentUser.uid));
          if (docSnap.exists()) {
            setProfile(docSnap.data());
          }
        } catch (err) {
          console.error('Failed to fetch user profile:', err);
        }
      }
      setProfileLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  if (authLoading || profileLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (profile) {
    if (!profile.preferencesComplete) {
      return <Navigate to="/preferencePage" replace />;
    }
    if (!profile.locationSet) {
      return <Navigate to="/locations" replace />;
    }
    if (!profile.quizComplete) {
      return <Navigate to="/quiz-start" replace />;
    }
  }

  return children;
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
    <ProfileProvider>
      <Router>
        <ScrollToTop>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard/*" element={
              <PrivateRoute>
                <Elements stripe={stripePromise}>
                  <Dashboard />
                </Elements>
              </PrivateRoute>
            } />
            <Route path="/all-dates" element={<AllDates />} />
            <Route path = "/preferencePage" element={<PreferencePage/>}/>
            <Route path ="/finalQuizPage" element={<FinalQuizPage/>}/>
            <Route path="/contact" element={<Contact />} />
            <Route path="/get-demo" element={<DemoProduct />} />
            <Route path="/login" element={<Login />} />
            <Route path="/create-account" element={<CreateAccount />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reenter-password" element={<ReEnterPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/verify-phone" element={<VerifyPhone />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/locations" element={<LocationScreen />} />
            <Route path="/quiz-start" element={<QuizStartScreen />} />
            <Route path="/personalityquizpage/:step" element={<PersonalityQuizPage/>} />
            <Route path="/reactivate" element={<Reactivate />} />
            <Route path="/enterprise-login" element={<EnterpriseLogin />} />
            <Route path="/enterprise-create-account" element={<EnterpriseCreateAccount />} />
            <Route path="/enterprise-profile" element={<EnterpriseProfile />} />
            <Route path="/enterprise-user-profile" element={<EnterpriseUserProfile />} />
            <Route path="/enterprise-verify-email" element={<EnterpriseVerifyEmail />} />
            <Route path="/enterprise-dash/*" element={<EnterpriseDash />} />
            <Route path="/admin-dashboard/*" element={<AdminDashboard />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/privacy-policy" element={<Legal />} />
            <Route path="/cookie-policy" element={<Legal />} />
            <Route path="/terms-of-service" element={<Legal />} />
            <Route path="/admin-dashboard/*" element={<AdminDashboard />} />
          </Routes>
        </ScrollToTop>
      </Router>
    </ProfileProvider>
  );
}

export default App;
