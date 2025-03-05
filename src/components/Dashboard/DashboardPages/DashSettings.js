import React from 'react';
import { useNavigate } from 'react-router-dom';

const DashSettings = () => {
    return (
      <div className="space-y-4 w-1/2"> 
        <SettingItem title="Change password" clickable={true}  />
        <SettingItem title="Payment history" clickable={false} />
        <SettingItem title="Deactivate account" clickable={false} />
        <SettingItem title="Delete account" clickable={false} />
      </div>
    );
  }
  
  function SettingItem({ title, clickable }) {
    const navigate = useNavigate(); 
    return (
      clickable ? 
      <button 
        className="w-full py-8 px-6 bg-[#F3F3F3] rounded-lg shadow-md cursor-pointer hover:shadow-lg flex justify-between items-center font-[poppins]"
        onClick={() => navigate('/dashboard/dashChangePassword')}
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