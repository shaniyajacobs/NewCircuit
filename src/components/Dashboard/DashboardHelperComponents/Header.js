import React from "react";

const Header = (props) => {
  const PathTitleMappings = {"/dashboard": "Home", "/dashboard/dashMyConnections": "My Connections", 
    "/dashboard/dashDateCalendar": "Date Calendar", "/dashboard/dashMyCoupons": "My Coupons", 
    "/dashboard/dashMyProfile": "My Profile", "/dashboard/dashSettings": "Settings", "/dashboard/dashSignOut": "Sign Out"}
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
        <img
          src="https://via.placeholder.com/60x60"
          alt="User"
          className="object-cover rounded-2xl h-[60px] w-[60px]"
        />
        <div className="flex flex-col gap-1">
          <div className="text-base font-medium text-indigo-950">Musfiq</div>
          <div className="text-sm text-slate-500">Admin</div>
        </div>
      </div>
    </div>
  );
};

export default Header;
