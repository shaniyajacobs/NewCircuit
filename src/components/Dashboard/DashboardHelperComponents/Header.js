import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from '../../../pages/firebaseConfig';
import { IoPersonCircle } from 'react-icons/io5';

const Header = (props) => {
  const auth = getAuth();
  const user = auth.currentUser;
  const [userData, setUserData] = useState();

  useEffect(() => {
    async function getUserData() {
      const userTable = collection(db, "users");
      const userQuery = query(userTable, where("email", "==", user.email));
      const loggedInUserQuery = await getDocs(userQuery);
      const loggedInUserData = loggedInUserQuery;
      setUserData(loggedInUserData.docs.at(0))
    }
    getUserData();
  }, [user.email])

  const PathTitleMappings = {
    "/dashboard": "Home", 
    "/dashboard/dashMyConnections": "My Connections", 
    "/dashboard/dashDateCalendar": "Date Calendar", 
    "/dashboard/dashMyCoupons": "My Coupons", 
    "/dashboard/dashMyProfile": "My Profile", 
    "/dashboard/dashSettings": "Settings", 
    "/dashboard/dashSignOut": "Sign Out"
  }
  
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
        {userData ? (
          userData.get("image") ? (
            <img
              src={userData.get("image")}
              alt="User Profile"
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
            {userData ? `${userData.get("firstName")} ${userData.get("lastName")}` : ""}
          </div>
          <div className="text-sm text-slate-500">
            {userData ? userData.get("email") : ""}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
