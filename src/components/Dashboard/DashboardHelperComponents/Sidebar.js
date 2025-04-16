import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import secondaryLogo from "../../../images/Cir_Secondary_RGB_Mixed Black.svg";
import * as FaIcons from "react-icons/fa";
import * as AiIcons from "react-icons/ai";
import * as IoIcons from "react-icons/io";
import * as RiIcons from "react-icons/ri";

const Sidebar = () => {
  const location = useLocation();
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  const navItems = [
    { icon: "ti ti-home", text: "Home", active: true },
    { icon: "ti ti-users", text: "My Connections" },
    { icon: "ti ti-calendar", text: "Date Calendar" },
    { icon: "ti ti-ticket", text: "My Coupons" },
    { icon: "ti ti-user", text: "My Profile" },
    { icon: "ti ti-settings", text: "Settings" },
    { icon: "ti ti-logout", text: "Sign Out" },
  ];

  const SidebarData = [
    {
      title: "Home",
      path: "/dashboard",
      icon: <AiIcons.AiFillHome />,
      cName: "nav-text",
    },
    {
      title: "My Connections",
      path: "/dashboard/dashMyConnections",
      icon: <FaIcons.FaUsers />,
      cName: "nav-text",
    },
    {
      title: "Date Calendar",
      path: "/dashboard/dashDateCalendar",
      icon: <FaIcons.FaCalendar />,
      cName: "nav-text",
    },
    {
      title: "My Coupons",
      path: "/dashboard/dashMyCoupons",
      icon: <RiIcons.RiCoupon3Line />,
      cName: "nav-text",
    },
    {
      title: "My Profile",
      path: "/dashboard/DashMyProfile",
      icon: <FaIcons.FaUser />,
      cName: "nav-text",
    },
    {
      title: "Settings",
      path: "/dashboard/dashSettings",
      icon: <RiIcons.RiSettings4Line />,
      cName: "nav-text",
      hasDropdown: true,
      dropdownItems: [
        {
          title: "Settings",
          path: "/dashboard/dashSettings",
          icon: <RiIcons.RiSettings4Line />,
        },
        {
          title: "Sign Out",
          path: "/dashboard/dashSignOut",
          icon: <IoIcons.IoMdLogOut />,
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-12 px-5 py-10 bg-white rounded-xl w-[280px] max-md:p-5 max-md:w-full">
      <img
        loading="lazy"
        src={secondaryLogo}
        alt="SecondaryLogo"
        className="object-contain"
      />

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
  );
};

export default Sidebar;
