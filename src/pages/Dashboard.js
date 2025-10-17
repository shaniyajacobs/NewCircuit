import React, { useEffect, useState, useRef } from "react";
import Sidebar from "../components/Dashboard/DashboardHelperComponents/Sidebar";
import Header from "../components/Dashboard/DashboardHelperComponents/Header";
import DashHome from "../components/Dashboard/DashboardPages/DashHome";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import DashMyConnections from "../components/Dashboard/DashboardPages/DashMyConnections";
import DashDateCalendar from "../components/Dashboard/DashboardPages/DashDateCalendar";
import DashCheckout from "../components/Dashboard/DashboardPages/DashCheckout";
import DashMyCoupons from "../components/Dashboard/DashboardPages/DashMyCoupons";
import DashMyProfile from "../components/Dashboard/DashboardPages/DashMyProfile";
import DashSettings from "../components/Dashboard/DashboardPages/DashSettings";
import DashChangePassword from "../components/Dashboard/DashboardPages/DashChangePassword";
import DashDeleteAccount from "../components/Dashboard/DashboardPages/DashDeleteAccount";
import DashDeactivateAccount from "../components/Dashboard/DashboardPages/DashDeactivateAccount";
import MyMatches from "../components/Dashboard/DashboardPages/MyMatches";
import SeeAllMatches from "../components/Dashboard/DashboardPages/SeeAllMatches";
import DashPaymentHistory from "../components/Dashboard/DashboardPages/DashPaymentHistory";
import MatchmakingTest from "../components/Dashboard/DashboardPages/MatchmakingTest";
import DashOrderConfirmation from "../components/Dashboard/DashboardPages/DashOrderConfirmation";

import SignOut from "../components/Dashboard/DashboardPages/SignOut";

const Dashboard = () => {
  const [currPath, setCurrPath] = useState("/");
  const [activeConnection, setActiveConnection] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const connectionsRef = useRef();

  useEffect(() => {
    const path = location.pathname;
    if (path !== currPath) {
      setCurrPath(path);
    }
  }, [location, currPath]);

  // Function to handle going back to connections list
  const handleBackToConnections = () => {
    setActiveConnection(null);
    // Call the reset method on the connections component
    if (connectionsRef.current) {
      connectionsRef.current.resetConnection();
    }
  };

  // Set white background for dashboard
  useEffect(() => {
    // Add dashboard background class to body and html
    document.body.classList.add('dashboard-bg');
    document.documentElement.classList.add('dashboard-bg');
    
    // Cleanup function to remove classes when component unmounts
    return () => {
      document.body.classList.remove('dashboard-bg');
      document.documentElement.classList.remove('dashboard-bg');
    };
  }, []);

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div className="dashboard-container flex min-h-screen max-md:flex-col">
      <Sidebar />
      <div className="flex flex-col flex-1 bg-white md:ml-[280px]">
        <Header 
          path={currPath} 
          activeConnection={activeConnection}
          onBackToConnections={handleBackToConnections}
        />
          <Routes>
            <Route path="/" element={<DashHome />}/> 
            <Route path="dashMyConnections" element={
              <DashMyConnections 
                ref={connectionsRef}
                onConnectionSelect={setActiveConnection}
                onConnectionDeselect={() => setActiveConnection(null)}
              />
            }/> 
            <Route path="dashDateCalendar" element={<DashDateCalendar />} /> 
            <Route path="dashCheckout" element={<DashCheckout />} />
            <Route path="dashMyCoupons" element={<DashMyCoupons />} />
            <Route path="dashSettings" element={<DashSettings />} /> 
            <Route path="dashChangePassword" element={<DashChangePassword />} />
            <Route path="dashDeleteAccount" element={<DashDeleteAccount />} />
            <Route path="dashDeactivateAccount" element={<DashDeactivateAccount />} />
            <Route path="dashMyProfile" element={<DashMyProfile />} />
            <Route path="myMatches" element={<MyMatches />} />
            <Route path="myMatches/seeAllMatches" element={<SeeAllMatches />} />
            <Route path="seeAllMatches" element={<SeeAllMatches />} />
            <Route path="dashSignOut" element={<SignOut />} />
            <Route path="dashPaymentHistory" element={<DashPaymentHistory />} />
            <Route path="matchmakingTest" element={<MatchmakingTest />} />
            <Route path="dashOrderConfirmation" element={<DashOrderConfirmation />} />
          </Routes>
      </div>
    </div>
  );
};

export default Dashboard;
