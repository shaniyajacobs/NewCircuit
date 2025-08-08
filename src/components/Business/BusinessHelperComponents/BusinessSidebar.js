import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../../../firebaseConfig";
import { signOut } from "firebase/auth";
import secondaryLogo from "../../../images/Cir_Secondary_RGB_Mixed Black.svg";
import * as FaIcons from "react-icons/fa";
import * as AiIcons from "react-icons/ai";
import * as IoIcons from "react-icons/io";
import * as RiIcons from "react-icons/ri";
import * as MdIcons from "react-icons/md";
import PopUp from '../../Dashboard/DashboardHelperComponents/PopUp';

const BusinessSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const handleSignOut = (e) => {
    e.preventDefault();
    setShowSignOutModal(true);
    setShowSettingsDropdown(false);
  };

  const handleSignOutConfirm = async () => {
    try {
      await signOut(auth);
      setShowSignOutModal(false);
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const SidebarData = [
    {
      title: "Home",
      path: "/enterprise-dash",
      icon: <AiIcons.AiFillHome />,
      cName: "nav-text",
    },
    {
      title: "Analytics",
      path: "/enterprise-dash/analytics",
      icon: <MdIcons.MdAnalytics />,
      cName: "nav-text",
    },
    // {
    //   title: "Coupons",
    //   path: "/enterprise-dash/coupons",
    //   icon: <RiIcons.RiCoupon3Line />,
    //   cName: "nav-text",
    // },
    {
      title: "Profile",
      path: "/enterprise-dash/profile",
      icon: <FaIcons.FaUser />,
      cName: "nav-text",
    },
    {
      title: "Settings",
      path: "/enterprise-dash/settings",
      icon: <RiIcons.RiSettings4Line />,
      cName: "nav-text",
      hasDropdown: true,
      dropdownItems: [
        {
          title: "Settings",
          path: "/enterprise-dash/settings",
          icon: <RiIcons.RiSettings4Line />,
        },
        {
          title: "Sign Out",
          path: "#",
          icon: <IoIcons.IoMdLogOut />,
          onClick: handleSignOut
        },
      ],
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-12 px-5 py-10 bg-white rounded-xl w-[280px] max-md:p-5 max-md:w-full">  
        <Link to="/enterprise-dash">
          <img
            loading="lazy"
            src={secondaryLogo}
            alt="SecondaryLogo"
            className="object-contain"
          />
        </Link>

        {SidebarData.map((item, index) => (
          <div key={index}>
            {item.hasDropdown ? (
              <div className="relative group">
                <div
                  className={`flex gap-6 items-center px-6 py-5 text-lg rounded-2xl transition-all cursor-pointer duration-[0.2s] text-slate-500 ${
                    location.pathname === item.path ? "bg-[#0043F1] text-white" : "hover:bg-gray-50"
                  }`}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </div>
              
                <div 
                  className="absolute left-[calc(100%-10px)] top-0 bg-white rounded-lg shadow-lg overflow-hidden z-50 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-200"
                  style={{ minWidth: '200px' }}
                >
                  {item.dropdownItems.map((dropdownItem, dropIndex) => (
                    <Link 
                      to={dropdownItem.path} 
                      key={dropIndex}
                      className="flex gap-6 items-center px-6 py-4 text-lg hover:bg-[#0043F1] hover:text-white text-slate-500 whitespace-nowrap transition-colors duration-200"
                      onClick={dropdownItem.onClick}
                    >
                      {dropdownItem.icon}
                      <span>{dropdownItem.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link to={item.path}>
                <div
                  className={`flex gap-6 items-center px-6 py-5 text-lg rounded-2xl transition-all cursor-pointer duration-[0.2s] text-slate-500 ${
                    location.pathname === item.path ? "bg-[#0043F1] text-white" : "hover:bg-gray-50"
                  }`}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </div>
              </Link>
            )}
          </div>
        ))}
      </div>

      <PopUp
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        title="Sign Out"
        subtitle="Are you sure you want to sign out?"
        icon="🚪"
        iconColor="blue"
        primaryButton={{
          text: "Sign Out",
          onClick: handleSignOutConfirm
        }}
        secondaryButton={{
          text: "Cancel",
          onClick: () => setShowSignOutModal(false)
        }}
      />
    </>
  );
};

export default BusinessSidebar; 