import React from 'react';
import { useNavigate } from 'react-router-dom';
import {logoutUser} from '../../../auth'


function SignOut() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    // Call logoutUser from auth.js
    console.log('Logging out in process');
    const result = await logoutUser();
    if (result.success) {
      console.log('yayyyy')
      // Redirect to the login page after successful logout
      navigate('/Login', { replace: true });
    } else {
      console.error('Logout failed:', result.error);
      // Optionally, display an error message to the user
    }
  };

  const handleCancel = () => {
    console.log("Cancel button clicked"); // Debug log
    navigate(-1);
  };

  return (
    <div className="flex items-center justify-center h-screen bg-white rounded-xl">
      <div className="bg-white rounded-xl shadow-md p-6 max-w-sm border border-gray-300 ">
        <h2 className="text-xl font-semibold mb-4">Are you sure you want to logout?</h2>
        <div className="flex justify-center space-x-4">
          <button 
            className="px-4 py-2 rounded-md border border-gray-300 bg-gray-200 text-black hover:bg-gray-300"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default SignOut;
