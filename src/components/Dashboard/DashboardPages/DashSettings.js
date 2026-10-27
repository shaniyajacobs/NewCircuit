import React from 'react';
import { useNavigate } from 'react-router-dom';

const DashSettings = () => {
    return (
      <div className="p-7 pt-3 h-screen bg-white overflow-hidden">
        <div className="w-full md:w-3/4 lg:w-1/2 mx-auto flex flex-col h-full"> 
          <h1 
            className="text-[#211F20] font-bricolage text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-[32px] font-medium leading-[130%] mb-4 pt-4 pb-2"
            style={{
              fontFamily: '"Bricolage Grotesque", sans-serif',
              fontStyle: 'normal',
              fontWeight: 500,
              lineHeight: '130%'
            }}
          >
            Settings
          </h1>
          <div className="space-y-3 flex-1">
            <SettingItem title="Change password" path="/dashboard/dashChangePassword" clickable={true} />
            <SettingItem title="Payment history" path="/dashboard/dashPaymentHistory" clickable={true} />
            <SettingItem title="Deactivate account" path="/dashboard/dashDeactivateAccount" clickable={true} />
            <SettingItem title="Delete account" path="/dashboard/dashDeleteAccount" clickable={true} />
          </div>
        </div>
      </div>
    );
  }

  function SettingItem({ title, path, clickable }) {
    const navigate = useNavigate(); 
    const baseClass = `
      flex items-center justify-between w-full
      px-4 sm:px-6 md:px-8 lg:px-[24px] 
      py-2 sm:py-3 md:py-4 lg:py-[12px]
      rounded-[8px]
      border border-[rgba(0,0,0,0.10)]
      bg-white
      font-poppins
      align-stretch
      transition-all duration-200
      ${clickable ? 'cursor-pointer hover:bg-blue-50 hover:shadow-md' : ''}
    `;
    const content = (
      <>
        <span className="text-[#211F20] font-poppins text-sm sm:text-base font-medium leading-normal break-words">{title}</span>
        <span className="text-[rgba(33,31,32,0.75)] text-xl sm:text-2xl lg:text-3xl flex-shrink-0">{'>'}</span>
      </>
    );
    return clickable ? (
      <button
        className={baseClass}
        onClick={() => navigate(path)}
        type="button"
      >
        {content}
      </button>
    ) : (
      <div className={baseClass}>
        {content}
      </div>
    );
  }

  export default DashSettings;