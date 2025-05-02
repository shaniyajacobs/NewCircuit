import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from '../../../pages/firebaseConfig';
import { IoPersonCircle } from 'react-icons/io5';

const BusinessHeader = (props) => {
  const auth = getAuth();
  const user = auth.currentUser;
  const [businessData, setBusinessData] = useState();

  useEffect(() => {
    async function getBusinessData() {
      const businessTable = collection(db, "businesses");
      const businessQuery = query(businessTable, where("email", "==", user.email));
      const loggedInBusinessQuery = await getDocs(businessQuery);
      const loggedInBusinessData = loggedInBusinessQuery;
      setBusinessData(loggedInBusinessData.docs.at(0));
    }
    getBusinessData();
  }, [user.email]);

  const PathTitleMappings = {
    "/enterprise-dash": "Home",
    "/enterprise-dash/coupons": "Coupons",
    "/enterprise-dash/analytics": "Analytics",
    "/enterprise-dash/profile": "Business Profile",
    "/enterprise-dash/settings": "Settings"
  };
  
  const { path } = props;

  return (
    <div className="flex justify-between items-center px-10 py-7 bg-white rounded-xl max-sm:flex-col max-sm:gap-5 max-sm:p-5">
      <div className="text-4xl font-semibold text-indigo-950 max-sm:text-2xl">
        {PathTitleMappings[path]}
      </div>
      <div className="flex gap-5 items-center">
        <div className="flex justify-center items-center h-[66px] w-[62px]">
          <i className="ti ti-bell text-2xl text-slate-500" />
        </div>
        {businessData ? (
          businessData.get("logo") ? (
            <img
              src={businessData.get("logo")}
              alt="Business Logo"
              className="object-cover rounded-2xl h-[60px] w-[60px]"
            />
          ) : (
            <div className="flex items-center justify-center rounded-2xl h-[60px] w-[60px] bg-gray-200">
              <IoPersonCircle className="w-full h-full text-gray-400" />
            </div>
          )
        ) : (
          <div className="flex items-center justify-center rounded-2xl h-[60px] w-[60px] bg-gray-200">
            <IoPersonCircle className="w-full h-full text-gray-400" />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <div className="text-base font-medium text-indigo-950">
            {businessData ? businessData.get("businessName") : ""}
          </div>
          <div className="text-sm text-slate-500">
            {businessData ? businessData.get("email") : ""}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessHeader; 