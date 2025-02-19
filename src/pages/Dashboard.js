import React from "react";
import Sidebar from "../components/Dashboard/DashboardHelperComponents/Sidebar";
import Header from "../components/Dashboard/DashboardHelperComponents/Header";
import DashHome from "../components/Dashboard/DashboardPages/DashHome";
import { Route, Routes } from "react-router-dom";
import DashMyConnections from "../components/Dashboard/DashboardPages/DashMyConnections";

const Dashboard = () => {
  return (
    <div className="flex gap-5 p-5 min-h-screen bg-gray-50 max-md:flex-col">
      <Sidebar />
      <div className="flex flex-col flex-1 gap-8">
        <Header />
          <Routes>
            <Route path="/" element={<DashHome />} /> 
            <Route path="dashMyConnections" element={<DashMyConnections />} /> 
          </Routes>
      </div>
    </div> 
  );
};

export default Dashboard;
