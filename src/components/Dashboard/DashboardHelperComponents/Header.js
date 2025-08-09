import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from '../../../pages/firebaseConfig';
import { IoPersonCircle } from 'react-icons/io5';
import { ReactComponent as VectorIcon } from '../../../images/Vector 6.svg';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatUserName } from "../../../utils/nameFormatter";


const Header = (props) => {
  const auth = getAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(() => {
    const cached = localStorage.getItem("userData");
    return cached ? JSON.parse(cached) : null;
  });

  // Listen for profile updates from localStorage
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'userDataUpdated') {
        // Refetch user data when profile is updated
        if (user) {
          getUserData();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events within the same tab
    const handleCustomUpdate = () => {
      if (user) {
        getUserData();
      }
    };
    window.addEventListener('userProfileUpdated', handleCustomUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userProfileUpdated', handleCustomUpdate);
    };
  }, [user]);
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  const getUserData = async () => {
    if (!user) return;
    const userTable = collection(db, "users");
    const userQuery = query(userTable, where("email", "==", user.email));
    const loggedInUserQuery = await getDocs(userQuery);
    const loggedInUserData = loggedInUserQuery.docs.at(0);
    setUserData(loggedInUserData);
    localStorage.setItem("userData", JSON.stringify(loggedInUserData.data()));
    setIsLoading(false);
  };

  useEffect(() => {
    getUserData();
  }, [user]);


  const PathTitleMappings = {"/dashboard": "Home", "/dashboard/dashMyConnections": "Sparks", 
    "/dashboard/dashDateCalendar": "Date Calendar", "/dashboard/DashCheckout": "Checkout", "/dashboard/dashMyCoupons": "My Coupons", 
    "/dashboard/dashMyProfile": "My Profile", "/dashboard/dashSettings": "Settings", "/dashboard/dashChangePassword": "Change Password", 
    "/dashboard/dashDeleteAccount": "Delete Account", "/dashboard/dashDeactivateAccount": "Deactivate Account", "/dashboard/dashSignOut": "Sign Out"}
  const { path } = props;
  const currentPath = location.pathname;

  if (isLoading) {
    return (
      <div className="flex justify-between items-center p-6 bg-white rounded-xl">
        <div className="text-4xl font-semibold text-indigo-950">Loading...</div>
        <div className="flex gap-5 items-center animate-pulse">
          <div className="h-[60px] w-[60px] bg-gray-200 rounded-2xl" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-3 w-32 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    );
  }
  

  return (
    <div className={`flex justify-between items-center p-6 bg-white border border-[rgba(33,31,32,0.10)] max-md:hidden max-sm:p-6`}>
      {/* Desktop: Always show normal page title */}
      <div 
        className={`${["/dashboard/dashChangePassword", "/dashboard/dashDeleteAccount", "/dashboard/dashDeactivateAccount"].includes(currentPath) ? "cursor-pointer hover:opacity-70" : ""}`}
        style={{
          color: 'var(--Raisin_Black, #211F20)',
          fontFamily: '"Bricolage Grotesque"',
          fontSize: 'var(--H8, 16px)',
          fontStyle: 'normal',
          fontWeight: '500',
          lineHeight: '130%',
          textTransform: 'uppercase'
        }}
        onClick={["/dashboard/dashChangePassword", "/dashboard/dashDeleteAccount", "/dashboard/dashDeactivateAccount"].includes(currentPath) ? () => navigate('/dashboard/dashSettings') : undefined}
      >
        {["/dashboard/dashChangePassword", "/dashboard/dashDeleteAccount", "/dashboard/dashDeactivateAccount"].includes(currentPath) ? (
          <span className="flex items-center">
            <img src="/arrow-left.svg" alt="Back" className="w-4 h-4 mr-2" />
            {PathTitleMappings[currentPath]}
          </span>
        ) : (
          PathTitleMappings[currentPath] || "MY PROFILE"
        )}
      </div>


      
      <div className={`flex gap-5 items-center`}>
        <div className="flex justify-center items-center h-[66px] w-[62px]">
          <i className="ti ti-bell text-2xl text-slate-500" />
        </div>
        {userData ? (
          userData.get("image") ? (
            <div className="flex items-center gap-2">
              {/* Profile Picture - Direct image */}
              <img
                src={userData.get("image")}
                alt="User Profile"
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '60px',
                  border: '1px solid rgba(33, 31, 32, 0.10)',
                  objectFit: 'cover'
                }}
              />
              
              {/* User Info */}
              <div className="flex flex-col">
                {/* Name - Body-S-Med */}
                <div style={{
                  color: 'var(--Raisin_Black, #211F20)',
                  fontFamily: 'Poppins',
                  fontSize: 'var(--Body-S-Med, 14px)',
                  fontStyle: 'normal',
                  fontWeight: '500',
                  lineHeight: 'normal'
                }}>
                  {formatUserName(userData.data())}
                </div>
                {/* Email - Body-S-Reg */}
                <div style={{
                  color: 'rgba(33, 31, 32, 0.75)',
                  fontFamily: 'Poppins',
                  fontSize: 'var(--Body-S-Reg, 14px)',
                  fontStyle: 'normal',
                  fontWeight: '400',
                  lineHeight: 'normal'
                }}>
                  {userData.get("email")}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Profile Picture - Fallback icon */}
              <div style={{
                display: 'flex',
                width: '48px',
                height: '48px',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: '60px',
                border: '1px solid rgba(33, 31, 32, 0.10)',
                backgroundColor: '#f3f4f6',
                overflow: 'hidden'
              }}>
                <IoPersonCircle style={{ width: '80px', height: '80px', color: '#9ca3af', transform: 'scale(1.5)' }} />
              </div>
              
              {/* User Info */}
              <div className="flex flex-col">
                {/* Name - Body-S-Med */}
                <div style={{
                  color: 'var(--Raisin_Black, #211F20)',
                  fontFamily: 'Poppins',
                  fontSize: 'var(--Body-S-Med, 14px)',
                  fontStyle: 'normal',
                  fontWeight: '500',
                  lineHeight: 'normal'
                }}>
                  {formatUserName(userData.data())}
                </div>
                {/* Email - Body-S-Reg */}
                <div style={{
                  color: 'rgba(33, 31, 32, 0.75)',
                  fontFamily: 'Poppins',
                  fontSize: 'var(--Body-S-Reg, 14px)',
                  fontStyle: 'normal',
                  fontWeight: '400',
                  lineHeight: 'normal'
                }}>
                  {userData.get("email")}
                </div>
              </div>
            </div>
          )
        ) : null}
      </div>
    </div>
  );
};

export default Header;
