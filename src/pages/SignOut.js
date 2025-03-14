import React from 'react';

function SignOut() {
  return (
    <div className="flex items-center justify-center h-[20vw] bg-gray-100">
      {/* Modal container */}
      <div className="bg-white rounded-xl shadow-md p-6 max-w-sm border border-gray-500 ">
        <h2 className="text-xl font-semibold mb-4">Are you sure you want to logout?</h2>
        
        <div className="flex justify-center space-x-4">
          {/* Cancel Button */}
          <button className="px-4 py-2 rounded-md border border-gray-300 bg-gray-200 text-black hover:bg-gray-300">
            Cancel
          </button>

          {/* Logout Button */}
          <button className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default SignOut;
