import React, { useEffect } from "react";
import Sidebar from "../components/Dashboard/DashboardHelperComponents/Sidebar";
import Header from "../components/Dashboard/DashboardHelperComponents/Header";
import DashHome from "../components/Dashboard/DashboardPages/DashHome";
import { Route, Routes, useLocation } from "react-router-dom";
import DashMyConnections from "../components/Dashboard/DashboardPages/DashMyConnections";
import DashDateCalendar from "../components/Dashboard/DashboardPages/DashDateCalendar";
import DashMyCoupons from "../components/Dashboard/DashboardPages/DashMyCoupons";
import { useState } from "react";

const Dashboard = () => {
  const [currPath, setCurrPath] = useState("/");
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (path !== currPath) {
      setCurrPath(path);
      console.log("Changed path");
    }
    console.log("Called function");
  }, [location, currPath]);

  return (
    <div className="flex gap-5 p-5 min-h-screen bg-gray-50 max-md:flex-col">
      <Sidebar />
      <div className="flex flex-col flex-1 gap-8">
        <Header path={currPath} />
          <Routes>
            <Route path="/" element={<DashHome />}/> 
            <Route path="dashMyConnections" element={<DashMyConnections />} /> 
            <Route path="dashDateCalendar" element={<DashDateCalendar />} /> 
            <Route path="dashMyCoupons" element={<DashMyCoupons />} />
          </Routes>
      </div>
    </div> 
  );
};

export default Dashboard;
