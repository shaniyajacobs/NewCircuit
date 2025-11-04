import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../../../firebaseConfig";
import { signOut } from "firebase/auth";
import secondaryLogo from "../../../images/Cir_Secondary_RGB_Mixed Black.svg";
import circuitLogo from "../../../images/Cir_Primary_RGB_Mixed Black.png";
import { ReactComponent as VectorIcon } from "../../../images/Vector 6.svg";
import xIcon from "../../../images/x.svg";
import * as FaIcons from "react-icons/fa";
import * as AiIcons from "react-icons/ai";
import * as IoIcons from "react-icons/io";
import * as RiIcons from "react-icons/ri";
import * as MdIcons from "react-icons/md";
import PopUp from '../../Dashboard/DashboardHelperComponents/PopUp';

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showTabletMenu, setShowTabletMenu] = useState(false);

  const handleSignOut = (e) => {
    if (e) {
      e.preventDefault();
    }
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

  const handleTabletMenuToggle = () => {
    setShowTabletMenu(!showTabletMenu);
  };

  const SidebarData = [
    {
      title: "Website",
      path: "/admin-dashboard/website-management",
      icon: <FaIcons.FaGlobe className="w-5 h-5" />,
      cName: "nav-text",
    },
    {
      title: "Events",
      path: "/admin-dashboard/events",
      icon: <FaIcons.FaCalendarAlt className="w-5 h-5" />,
      cName: "nav-text",
    },
    {
      title: "Users",
      path: "/admin-dashboard/users",
      icon: <FaIcons.FaUsers className="w-5 h-5" />,
      cName: "nav-text",
    },
    {
      title: "Coupons",
      path: "/admin-dashboard/coupons",
      icon: <RiIcons.RiCoupon3Line className="w-5 h-5" />,
      cName: "nav-text",
    },
    {
      title: "Businesses",
      path: "/admin-dashboard/businesses",
      icon: <FaIcons.FaBuilding className="w-5 h-5" />,
      cName: "nav-text",
    },
    {
      title: "Analytics",
      path: "/admin-dashboard/analytics",
      icon: <MdIcons.MdAnalytics className="w-5 h-5" />,
      cName: "nav-text",
    },
    {
      title: "Settings",
      path: "/admin-dashboard/settings",
      icon: <RiIcons.RiSettings4Line className="w-5 h-5" />,
      cName: "nav-text",
    },
    {
      title: "Log out",
      path: "#",
      icon: <IoIcons.IoMdLogOut className="w-5 h-5" />,
      cName: "nav-text",
      onClick: handleSignOut
    },
  ];

  return (
    <>
      {/* Desktop Sidebar (1280px and above) */}
      <div className="hidden md:flex flex-col h-screen px-5 py-10 bg-white rounded-xl w-[280px] max-md:p-5 max-md:w-full border border-[rgba(33,31,32,0.10)] fixed left-0 top-0">  
        <Link to="/admin-dashboard" className="p-6 sm:p-6 md:p-6 lg:p-6">
          <img
            loading="lazy"
            src={secondaryLogo}
            alt="SecondaryLogo"
            className="object-contain"
          />
        </Link>

        {/* Main navigation items with top padding */}
        <div className="pt-6 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-2"> {/* Add vertical gap between options */}
            {SidebarData.slice(0, -2).map((item, index) => (
              <Link key={item.path} to={item.path} className="w-full">
                <div className={`flex items-center justify-between w-full px-4 py-3 text-lg rounded-xl transition-all cursor-pointer duration-200 text-slate-500 border
                  ${location.pathname === item.path
                    ? "bg-[#1C50D81A] border-[#1C50D840] text-[#1C50D8]"
                    : "border-transparent hover:bg-[#F5F7FB] hover:text-[#1C50D8] hover:border-[#1C50D840]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div style={{
                      color: location.pathname === item.path ? "#1C50D8" : "#211f20"
                    }}>
                      {item.icon}
                    </div>
                    <span>{item.title}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Settings and Sign Out at bottom - fixed */}
        <div className="pb-6 flex flex-col gap-2 mt-auto"> {/* Add vertical gap between settings and logout */}
          {SidebarData.slice(-2).map((item, index) => (
            <div key={index}>
              {item.onClick ? (
                // Sign Out button with onClick handler
                <div
                  className={`flex gap-2 sm:gap-2 md:gap-3 lg:gap-4 items-center px-5 py-3 sm:px-5 sm:py-3 md:px-6 md:py-4 lg:px-6 lg:py-4 text-lg rounded-2xl transition-all cursor-pointer duration-[0.2s] border
                    ${item.title === "Log out" 
                      ? "text-[#FF4848] bg-[rgba(255,72,72,0.10)] border-[rgba(255,72,72,0.20)] hover:bg-[rgba(255,72,72,0.15)]"
                      : location.pathname === item.path
                      ? "bg-[#1C50D81A] border-[#1C50D840] text-[#1C50D8]"
                      : "text-slate-500 border-transparent hover:bg-gray-50 hover:border-[#1C50D840]"
                    }`}
                  onClick={item.onClick}
                >
                  <div style={{
                    color: item.title === "Log out" ? "#FF4848" : (location.pathname === item.path ? "#1C50D8" : "#211f20")
                  }}>
                    {item.icon}
                  </div>
                  <span>{item.title}</span>
                </div>
              ) : (
                // Settings link
                <Link to={item.path}>
                  <div
                    className={`flex gap-2 sm:gap-2 md:gap-3 lg:gap-4 items-center px-5 py-3 sm:px-5 sm:py-3 md:px-6 md:py-4 lg:px-6 lg:py-4 text-lg rounded-2xl transition-all cursor-pointer duration-[0.2s] text-slate-500 border
                      ${location.pathname === item.path
                        ? "bg-[#1C50D81A] border-[#1C50D840] text-[#1C50D8]"
                        : "border-transparent hover:bg-gray-50 hover:border-[#1C50D840]"
                      }`}
                  >
                    <div style={{
                      color: location.pathname === item.path ? "#1C50D8" : "#211f20"
                    }}>
                      {item.icon}
                    </div>
                    <span>{item.title}</span>
                  </div>
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tablet Header Bar (under 1280px) */}
      <div className="flex md:hidden justify-between items-center px-6 py-4 bg-white border-b border-[rgba(33,31,32,0.10)] w-full">
        {/* Left side - Circuit logo / Page title text */}
        <div className="flex items-center">
          {/* Desktop: Show Circuit logo */}
          <Link to="/admin-dashboard" className="max-md:hidden">
            <img
              loading="lazy"
              src={circuitLogo}
              alt="Circuit Logo"
              className="object-contain h-8"
            />
          </Link>
          {/* Mobile & Tablet: Show page title text */}
          <div 
            className="hidden max-md:block"
            style={{
              color: 'var(--Raisin_Black, #211F20)',
              fontFamily: '"Bricolage Grotesque"',
              fontSize: 'var(--H8, 16px)',
              fontStyle: 'normal',
              fontWeight: '500',
              lineHeight: '130%',
              textTransform: 'uppercase'
            }}
          >
            {(() => {
              const path = location.pathname;
              if (path.includes("events")) return "EVENTS MANAGEMENT";
              if (path.includes("users")) return "USER MANAGEMENT";
              if (path.includes("coupons")) return "COUPONS MANAGEMENT";
              if (path.includes("businesses")) return "BUSINESS MANAGEMENT";
              if (path.includes("analytics")) return "ANALYTICS";
              if (path.includes("settings")) return "SETTINGS";
              return "ADMIN DASHBOARD";
            })()}
          </div>
        </div>

        {/* Right side - Vectors (clickable) */}
        <div 
          className="flex flex-col items-center gap-3 cursor-pointer"
          onClick={handleTabletMenuToggle}
        >
          <VectorIcon className="w-6 h-1" />
          <VectorIcon className="w-6 h-1" />
        </div>
      </div>

      {/* Tablet Menu Overlay (full screen) */}
      {showTabletMenu && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 md:hidden">
          <div className="flex flex-col h-full bg-white w-[744px] max-w-full">
            {/* Tablet Menu Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-[rgba(33,31,32,0.10)]">
              <Link to="/admin-dashboard" onClick={() => setShowTabletMenu(false)}>
                <img
                  loading="lazy"
                  src={circuitLogo}
                  alt="Circuit Logo"
                  className="object-contain h-8"
                />
              </Link>
              <button 
                onClick={handleTabletMenuToggle}
                className="text-2xl font-bold text-gray-600 hover:text-gray-800"
              >
                <img src={xIcon} alt="Close" className="w-6 h-6" />
              </button>
            </div>

            {/* Tablet/Mobile Menu Items */}
            <div className="flex-1 px-6 py-4">
              {SidebarData.map((item, index) => (
                <div key={index} className="mb-2">
                  {item.onClick ? (
                    // Logout button with onClick handler
                    <button
                      onClick={() => {
                        setShowTabletMenu(false);
                        item.onClick();
                      }}
                      className="flex gap-4 items-center px-4 py-3 text-lg rounded-xl transition-all cursor-pointer duration-[0.2s] text-red-600 border border-transparent hover:bg-red-50 hover:border-[rgba(255,72,72,0.20)] w-full text-left"
                    >
                      {item.icon}
                      <span>{item.title}</span>
                    </button>
                  ) : (
                    <Link to={item.path} onClick={() => setShowTabletMenu(false)}>
                      <div
                        className={`flex gap-4 items-center px-4 py-3 text-lg rounded-xl transition-all cursor-pointer duration-[0.2s] text-slate-500 border
                          ${location.pathname === item.path
                            ? "bg-[#1C50D81A] border-[#1C50D840] text-[#1C50D8]"
                            : "border-transparent hover:bg-gray-50 hover:border-[#1C50D840]"
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
          </div>
        </div>
      )}

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

export default AdminSidebar; 