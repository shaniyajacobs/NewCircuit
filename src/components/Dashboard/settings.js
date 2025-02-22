import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export function SettingsPage() {
    return (
      <div className="flex h-screen bg-#F3F3F3">
        {/* Sidebar */}
        <Sidebar />
  
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <Header />
  
          {/* Settings Content */}
          <main className="p-10">
            {/* <h1 className="text-3xl font-bold mb-6">Settings</h1> */}
            <div className="space-y-4 w-1/2"> 
              <SettingItem title="Change password" />
              <SettingItem title="Payment history" />
              <SettingItem title="Deactivate account" />
              <SettingItem title="Delete account" />
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  function SettingItem({ title }) {
    return (
      <div className="w-full py-8 px-6 bg-[#F3F3F3] rounded-lg shadow-md cursor-pointer hover:shadow-lg flex justify-between items-center font-[poppins]">
        <span className="text-gray-800 text-2xl font-light">{title}</span> {/* Bigger & bolder text */}
        <span className="text-gray-500 text-3xl">{'>'}</span> {/* Larger arrow */}
      </div>
    );
  }
  
  
