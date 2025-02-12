import React from "react";
import { Link } from "react-router-dom";
import secondaryLogo from "../../images/Cir_Secondary_RGB_Mixed Black.svg";

const Sidebar = () => {

  const navItems = [
    { icon: "ti ti-home", text: "Home", active: true },
    { icon: "ti ti-users", text: "My Connections" },
    { icon: "ti ti-calendar", text: "Date Calendar" },
    { icon: "ti ti-ticket", text: "My Coupons" },
    { icon: "ti ti-user", text: "My Profile" },
    { icon: "ti ti-settings", text: "Settings" },
    { icon: "ti ti-logout", text: "Sign Out" },
  ];

  return (
    <div className="flex flex-col gap-12 px-5 py-10 bg-white rounded-xl w-[280px] max-md:p-5 max-md:w-full">
      <img
          loading="lazy"
          src={secondaryLogo}
          alt="SecondaryLogo"
          className="object-contain"
        />

      {navItems.map((item, index) => (
        <div
          key={index}
          className={`flex gap-6 items-center px-6 py-5 text-lg rounded-2xl transition-all cursor-pointer duration-[0.2s] text-slate-500 ${
            item.active ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50"
          }`}
        >
          <i className={item.icon + " text-2xl"} />
          <span>{item.text}</span>
        </div>
      ))}
    </div>
  );
};

export default Sidebar;
