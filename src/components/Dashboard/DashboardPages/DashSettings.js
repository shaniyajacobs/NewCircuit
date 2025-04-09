import React from 'react';
import { useNavigate } from 'react-router-dom';

const DashSettings = () => {
    return (
      <div className="space-y-4 w-1/2"> 
        <SettingItem title="Change password" path="/dashboard/dashChangePassword" clickable={true} />
        <SettingItem title="Payment history" path="/dashboard/dashPaymentHistory" clickable={true} />
        <SettingItem title="Deactivate account" path="/dashboard/dashDeactivateAccount" clickable={true} />
        <SettingItem title="Delete account" path="/dashboard/dashDeleteAccount" clickable={true} />
      </div>
    );
  }

  function SettingItem({ title, path, clickable }) {
    const navigate = useNavigate(); 
    return (
      clickable ? 
      <button 
        className="w-full py-8 px-6 bg-[#F3F3F3] rounded-lg shadow-md cursor-pointer hover:shadow-lg flex justify-between items-center font-[poppins]"
        onClick={() => navigate(path)}
      >
        <span className="text-gray-800 text-2xl font-light">{title}</span> {/* Bigger & bolder text */}
        <span className="text-gray-500 text-3xl">{'>'}</span> {/* Larger arrow */}
    </button>
      :
      <div className="w-full py-8 px-6 bg-[#F3F3F3] rounded-lg shadow-md cursor-pointer hover:shadow-lg flex justify-between items-center font-[poppins]">
        <span className="text-gray-800 text-2xl font-light">{title}</span> {/* Bigger & bolder text */}
        <span className="text-gray-500 text-3xl">{'>'}</span> {/* Larger arrow */}
      </div>
    );
  }

  export default DashSettings;