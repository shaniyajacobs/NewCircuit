import React, { useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import BusinessSidebar from "../components/Business/BusinessHelperComponents/BusinessSidebar";
import BusinessHeader from "../components/Business/BusinessHelperComponents/BusinessHeader";
import BusinessHome from "../components/Business/BusinessPages/BusinessHome";
// import BusinessCoupons from "../components/Business/BusinessPages/BusinessCoupons";
import BusinessAnalytics from "../components/Business/BusinessPages/BusinessAnalytics";
import BusinessProfile from "../components/Business/BusinessPages/BusinessProfile";
import BusinessSettings from "../components/Business/BusinessPages/BusinessSettings";
import BusinessDeactivateAccount from "../components/Business/BusinessPages/BusinessDeactivateAccount";
import BusinessDeleteAccount from "../components/Business/BusinessPages/BusinessDeleteAccount";

const EnterpriseDash = () => {
  const [currPath, setCurrPath] = useState("/");
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (path !== currPath) {
      setCurrPath(path);
    }
  }, [location, currPath]);

  return (
    <div className="flex gap-5 p-5 min-h-screen bg-gray-50 max-md:flex-col">
      <BusinessSidebar />
      <div className="flex flex-col flex-1 gap-8">
        <BusinessHeader path={currPath} />
        <Routes>
          <Route index element={<BusinessHome />} />
          {/* <Route path="coupons/*" element={<BusinessCoupons />} /> */}
          <Route path="analytics/*" element={<BusinessAnalytics />} />
          <Route path="profile/*" element={<BusinessProfile />} />
          <Route path="settings/*" element={<BusinessSettings />} />
          <Route path="settings/deactivate" element={<BusinessDeactivateAccount />} />
          <Route path="settings/delete" element={<BusinessDeleteAccount />} />
        </Routes>
      </div>
    </div>
  );
};

export default EnterpriseDash;
