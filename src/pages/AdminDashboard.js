import React, { useEffect, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { auth, db } from "./firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import AdminCoupons from "../components/Admin/AdminPages/AdminCoupons";
import AdminUserManagement from "../components/Admin/AdminPages/AdminUserManagement";
import AdminBusinessManagement from "../components/Admin/AdminPages/AdminBusinessManagement";
import AdminAnalytics from "../components/Admin/AdminPages/AdminAnalytics";
import AdminEvents from "../components/Admin/AdminPages/AdminEvents";
import AdminDirectMatching from "../components/Admin/AdminPages/AdminDirectMatching";
import AdminSettings from "../components/Admin/AdminPages/AdminSettings";
import AdminChangePassword from "../components/Admin/AdminPages/AdminChangePassword";
import AdminDeactivateAccount from "../components/Admin/AdminPages/AdminDeactivateAccount";
import AdminDeleteAccount from "../components/Admin/AdminPages/AdminDeleteAccount";
import AdminHeader from "../components/Admin/AdminHelperComponents/AdminHeader";
import AdminSidebar from "../components/Admin/AdminHelperComponents/AdminSidebar";
// Import other admin components as needed

const AdminDashboard = () => {
  const [currPath, setCurrPath] = useState("/");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!auth.currentUser) {
        navigate('/login/');
        return;
      }

      const adminDoc = await getDoc(doc(db, 'adminUsers', auth.currentUser.uid));
      if (!adminDoc.exists()) {
        navigate('/login/');
      }
    };

    checkAdminStatus();
  }, [navigate]);

  useEffect(() => {
    if (location.pathname === "/admin-dashboard" || location.pathname === "/admin-dashboard/") {
      navigate("/admin-dashboard/events", { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    const path = location.pathname;
    if (path !== currPath) {
      setCurrPath(path);
    }
  }, [location, currPath]);

  return (
    <div className="flex min-h-screen bg-gray-50 max-md:flex-col">
      <AdminSidebar />
      <div className="flex flex-col flex-1 gap-8 md:ml-[280px] p-5">
        <AdminHeader path={currPath} />
        <Routes>
          <Route path="/coupons/*" element={<AdminCoupons />} />
          <Route path="/users/*" element={<AdminUserManagement />} />
          <Route path="/matching" element={<AdminDirectMatching />} />
          <Route path="/businesses/*" element={<AdminBusinessManagement />} />
          <Route path="/events/*" element={<AdminEvents />} />
          <Route path="/analytics/*" element={<AdminAnalytics />} />
          <Route path="/settings" element={<AdminSettings />} />
          <Route path="/settings/change-password" element={<AdminChangePassword />} />
          <Route path="/settings/deactivate" element={<AdminDeactivateAccount />} />
          <Route path="/settings/delete" element={<AdminDeleteAccount />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminDashboard; 