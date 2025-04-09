import React from "react";
import { Link, useLocation } from "react-router-dom";
import secondaryLogo from "../../../images/Cir_Secondary_RGB_Mixed Black.svg";
import * as FaIcons from "react-icons/fa";
import * as AiIcons from "react-icons/ai";
import * as IoIcons from "react-icons/io";
import * as RiIcons from "react-icons/ri";


const Sidebar = () => {
  const location = useLocation();

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
    path: "/dashboard/dashMyProfile",
    icon: <FaIcons.FaUser />,
    cName: "nav-text",
  },
  {
    title: "Settings",
    path: "/dashboard/dashSettings",
    icon: <RiIcons.RiSettings4Line />,
    cName: "nav-text",
  },
  {
    title: "Sign Out",
    path: "/dashboard/dashSignOut",
    icon: <IoIcons.IoMdHelpCircle />,
    cName: "nav-text",
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
        <Link to={item.path} key = {index}> 
          <div
            key={index}
            className={`flex gap-6 items-center px-6 py-5 text-lg rounded-2xl transition-all cursor-pointer duration-[0.2s] text-slate-500 ${
              location.pathname === item.path ? "bg-[#0043F1] text-white" : "hover:bg-gray-50"
            }`}
          >
            {/* GET DIV WITH FLEX SPACING HORIZ */}
              {item.icon}
              <span>{item.title}</span>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default Sidebar;
