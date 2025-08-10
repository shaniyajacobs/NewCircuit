import React, { useEffect, useState, useRef } from "react";
import Sidebar from "../components/Dashboard/DashboardHelperComponents/Sidebar";
import Header from "../components/Dashboard/DashboardHelperComponents/Header";
import DashHome from "../components/Dashboard/DashboardPages/DashHome";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import DashMyConnections from "../components/Dashboard/DashboardPages/DashMyConnections";
import DashDateCalendar from "../components/Dashboard/DashboardPages/DashDateCalendar";
import DashCheckout from "../components/Dashboard/DashboardPages/DashCheckout";
// import DashMyCoupons from "../components/Dashboard/DashboardPages/DashMyCoupons";
import DashMyProfile from "../components/Dashboard/DashboardPages/DashMyProfile";
import DashSettings from "../components/Dashboard/DashboardPages/DashSettings";
import DashChangePassword from "../components/Dashboard/DashboardPages/DashChangePassword";
import DashDeleteAccount from "../components/Dashboard/DashboardPages/DashDeleteAccount";
import DashDeactivateAccount from "../components/Dashboard/DashboardPages/DashDeactivateAccount";
import MyMatches from "../components/Dashboard/DashboardPages/MyMatches";
import SeeAllMatches from "../components/Dashboard/DashboardPages/SeeAllMatches";
import DashPaymentHistory from "../components/Dashboard/DashboardPages/DashPaymentHistory";
import MatchmakingTest from "../components/Dashboard/DashboardPages/MatchmakingTest";

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

  return (
    <div className="flex min-h-screen max-md:flex-col">
      <Sidebar />
      <div className="flex flex-col flex-1 bg-white">
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
            {/* <Route path="dashMyCoupons" element={<DashMyCoupons />} /> */}
            <Route path="dashSettings" element={<DashSettings />} /> 
            <Route path="dashChangePassword" element={<DashChangePassword />} />
            <Route path="dashDeleteAccount" element={<DashDeleteAccount />} />
            <Route path="dashDeactivateAccount" element={<DashDeactivateAccount />} />
            <Route path="DashMyProfile" element={<DashMyProfile />} />
            <Route path="myMatches" element={<MyMatches />} />
            <Route path="myMatches/seeAllMatches" element={<SeeAllMatches />} />
            <Route path="seeAllMatches" element={<SeeAllMatches />} />
            <Route path="dashSignOut" element={<SignOut />} />
            <Route path="dashPaymentHistory" element={<DashPaymentHistory />} />
            <Route path="matchmakingTest" element={<MatchmakingTest />} />
          </Routes>
      </div>
    </div>
  );
};

export default Dashboard;
