import React from 'react';
import { useNavigate } from 'react-router-dom';

const DashSettings = () => {
    return (
      <div className="p-7 pt-10 min-h-screen">
        <div className="bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)] p-7 h-full">
          <div className="space-y-4 w-1/2 mx-auto flex flex-col items-center"> 
            <SettingItem title="Change password" path="/dashboard/dashChangePassword" clickable={true} />
            <SettingItem title="Payment history" clickable={false} />
            <SettingItem title="Deactivate account" path="/dashboard/dashDeactivateAccount" clickable={true} />
            <SettingItem title="Delete account" path="/dashboard/dashDeleteAccount" clickable={true} />
          </div>
        </div>
      </div>
    );
  }

  function SettingItem({ title, path, clickable }) {
    const navigate = useNavigate(); 
    return (
      clickable ? 
      <button 
        className="w-full py-8 px-6 bg-white rounded-lg shadow-md cursor-pointer hover:shadow-lg hover:bg-blue-50 flex justify-between items-center font-[poppins]"
        onClick={() => navigate(path)}
      >
        <span className="text-gray-800 text-2xl font-light">{title}</span>
        <span className="text-gray-500 text-3xl">{'>'}</span>
      </button>
      :
      <div 
        className="w-full py-8 px-6 bg-white rounded-lg shadow-md cursor-pointer hover:shadow-lg hover:bg-blue-50 flex justify-between items-center font-[poppins]"
      >
        <span className="text-gray-800 text-2xl font-light">{title}</span>
        <span className="text-gray-500 text-3xl">{'>'}</span>
      </div>
    );
  }

  export default DashSettings;