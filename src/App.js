import React, { useEffect, useState } from 'react';
import AOS from 'aos';
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import "aos/dist/aos.css";
import './index.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Contact from './pages/Contact';
import DemoProduct from './pages/DemoProduct';
import Login from './pages/Login';
import CreateAccount from './pages/CreateAccount';
import ForgotPassword from './pages/ForgotPassword';
import ReEnterPassword from './pages/ReEnterPassword';
import Profile from './pages/Profile';
import VerifyPhone from './pages/VerifyPhone';
import LocationScreen from './pages/LocationScreen';
import QuizStartScreen from './pages/QuizStartScreen';
import PersonalityQuizPage from './pages/PersonalityQuizPage';
import Reactivate from './pages/Reactivate';
import AdminDashboard from './pages/AdminDashboard';
import FAQPage from './pages/FAQPage';
import HowItWorks from './pages/HowItWorks';
import Legal from './pages/Legal';

import AllDates from './components/Dashboard/DashboardPages/AllDates';
import EventsPage from './pages/EventsPage';
import EventProfile from './pages/EventProfile';
import Checkout from './pages/Checkout';
import ClaimSpot from './pages/ClaimSpot';
import MyWaitlist from './pages/MyWaitlist';
import NewsletterSignup from './pages/NewsletterSignup';
import VerifyEventOTP from './pages/VerifyEventOTP';
import EventRegistration from './pages/EventRegistration';
import AdminLogin from './pages/AdminLogin';
import OutfitDescription from './pages/OutfitDescription';
import CheckIn from './pages/CheckIn';
import EventLobby from './pages/EventLobby';
import EventNight from './pages/EventNight';
import VerifyLoginOTP from './pages/VerifyLoginOTP';

import RoundSchedule from './components/Dashboard/DashboardPages/RoundSchedule';
import MySparks from './components/Dashboard/DashboardPages/MySparks';
import Messages from './components/Dashboard/DashboardPages/Messages';
import EventSelections from './components/Dashboard/DashboardPages/EventSelections';

// ===== Firebase, etc. =====
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { ProfileProvider } from './contexts/ProfileContext';
import usePageTitle from './utils/usePageTitle';
import ScrollToTop from './components/ScrollToTop';
import Dashboard from './pages/Dashboard';
import NavBar from './components/Navbar/NavBar';
import FinalQuizPage from './pages/finalQuizPage';
import PreferencePage from './pages/preferencePage';
import { db } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const stripePromise = loadStripe("pk_live_51REM95LgZqiosvkbaTHHl20wxFjRNEVJ1xs3T3htfGH3AmUekBLp1PyyjHhdSxEiMqOCjjmxSqH8PMohpHVUBZln003ObBv1Eh");

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
    img.onload = () => console.log(`Preloaded: ${src}`);
  });
};

// ============================================================
// PrivateRoute – Now allows guests with a guestUid
// ============================================================
const PrivateRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const auth = getAuth();
  const location = useLocation();
  const guestUid = location.state?.guestUid || localStorage.getItem('guestUid');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  if (authLoading) return <div className="p-4 text-center">Loading...</div>;

  // Allow access if user is logged in OR if a guestUid is present
  if (!user && !guestUid) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  useEffect(() => {
    preloadImages();
  }, []);
  return (
    <ProfileProvider>
      <Router>
        <AppContent />
      </Router>
    </ProfileProvider>
  );
}

function AppContent() {
  usePageTitle();
  return (
    <ScrollToTop>
      <Routes>
        {/* ===== PUBLIC ROUTES (No login required) ===== */}
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/get-demo" element={<DemoProduct />} />
        <Route path="/login" element={<Login />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reenter-password" element={<ReEnterPassword />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/verify-phone" element={<VerifyPhone />} />
        <Route path="/locations" element={<LocationScreen />} />
        <Route path="/quiz-start" element={<QuizStartScreen />} />
        <Route path="/personalityquizpage/:step" element={<PersonalityQuizPage />} />
        <Route path="/reactivate" element={<Reactivate />} />
        <Route path="/admin-dashboard/*" element={<AdminDashboard />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/privacy-policy" element={<Legal />} />
        <Route path="/cookie-policy" element={<Legal />} />
        <Route path="/terms-of-service" element={<Legal />} />
        <Route path="/all-dates" element={<AllDates />} />

        
        <Route path="/events" element={<EventsPage />} />
        <Route path="/event-profile" element={<EventProfile />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/claim-spot" element={<ClaimSpot />} />
        <Route path="/my-waitlist" element={<MyWaitlist />} />
        <Route path="/newsletter-signup" element={<NewsletterSignup />} />
        <Route path="/verify-event-otp" element={<VerifyEventOTP />} />
        <Route path="/event-registration" element={<EventRegistration />} />
        <Route path="/admin-login" element={<Navigate to="/login" replace />} />
        

        <Route path="/outfit/:eventId/:phone" element={<OutfitDescription />} />
        <Route path="/checkin/:eventId/:phone" element={<CheckIn />} />
        <Route path="/event/:eventId/lobby/:phone" element={<EventLobby />} />
        <Route path="/event/:eventId/night/:phone" element={<EventNight />} />
        <Route path="/event/:eventId/selections/:phone" element={<EventSelections />} />
        <Route path="/verify-login-otp" element={<VerifyLoginOTP />} />
        
        <Route path="/dashboard/*" element={
          <PrivateRoute>
            <Elements stripe={stripePromise}>
              <Dashboard />
            </Elements>
          </PrivateRoute>
        } />

        
        <Route path="/dashboard/event-selections/:eventId" element={<PrivateRoute><EventSelections /></PrivateRoute>} />
        <Route path="/dashboard/mysparks" element={<PrivateRoute><MySparks /></PrivateRoute>} />
        <Route path="/dashboard/messages/:partnerId/:eventId" element={<PrivateRoute><Messages /></PrivateRoute>} />
        <Route path="/dashboard/event-schedule/:eventId" element={<PrivateRoute><RoundSchedule /></PrivateRoute>} />

        
        <Route path="/dashboard/myMatches" element={<PrivateRoute><div>MyMatches</div></PrivateRoute>} />
        <Route path="/dashboard/seeAllMatches" element={<PrivateRoute><div>SeeAllMatches</div></PrivateRoute>} />
        <Route path="/dashboard/dashMyConnections" element={<PrivateRoute><div>DashMyConnections</div></PrivateRoute>} />
        <Route path="/dashboard/dashDateCalendar" element={<PrivateRoute><div>DashDateCalendar</div></PrivateRoute>} />
        <Route path="/dashboard/dashCheckout" element={<PrivateRoute><div>DashCheckout</div></PrivateRoute>} />
        <Route path="/dashboard/dashMyProfile" element={<PrivateRoute><div>DashMyProfile</div></PrivateRoute>} />
        <Route path="/dashboard/dashSettings" element={<PrivateRoute><div>DashSettings</div></PrivateRoute>} />
        <Route path="/dashboard/dashChangePassword" element={<PrivateRoute><div>DashChangePassword</div></PrivateRoute>} />
        <Route path="/dashboard/dashDeleteAccount" element={<PrivateRoute><div>DashDeleteAccount</div></PrivateRoute>} />
        <Route path="/dashboard/dashDeactivateAccount" element={<PrivateRoute><div>DashDeactivateAccount</div></PrivateRoute>} />
        <Route path="/dashboard/dashPaymentHistory" element={<PrivateRoute><div>DashPaymentHistory</div></PrivateRoute>} />
        
      </Routes>
    </ScrollToTop>
  );
}

export default App;