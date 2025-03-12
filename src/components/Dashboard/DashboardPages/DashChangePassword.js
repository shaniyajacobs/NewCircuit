import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"; // Importing eye icons
import { useNavigate } from 'react-router-dom';

const DashChangePassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate(); 

  return (
    <div className="p-10 w-full min-h-screen bg-white relative">
        {/* Password Fields */}
        <div className="mb-8 flex items-center justify-between">
            <label className="text-xl font-semibold w-1/3">New Password</label>
            <div className="relative w-2/3">
            <input
                type={showPassword ? "text" : "password"}
                className="w-full p-4 border rounded-md text-lg"
                placeholder="Enter new password"
            />
            <button
                type="button"
                className="absolute inset-y-0 right-4 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
            >
                {showPassword ? (
                <EyeSlashIcon className="w-7 h-7 text-gray-600" />
                ) : (
                <EyeIcon className="w-7 h-7 text-gray-600" />
                )}
            </button>
            </div>
        </div>

        <div className="mb-8 flex items-center justify-between">
            <label className="text-xl font-semibold w-1/3">Retype New Password</label>
            <div className="relative w-2/3">
            <input
                type={showConfirmPassword ? "text" : "password"}
                className="w-full p-4 border rounded-md text-lg"
                placeholder="Retype new password"
            />
            <button
                type="button"
                className="absolute inset-y-0 right-4 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
                {showConfirmPassword ? (
                <EyeSlashIcon className="w-7 h-7 text-gray-600" />
                ) : (
                <EyeIcon className="w-7 h-7 text-gray-600" />
                )}
            </button>
            </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-start">
            <button className="bg-blue-600 text-white py-4 px-6 rounded-md text-xl font-semibold hover:bg-blue-700">
                Change Password
            </button>
        </div>

        {/* Security Notice */}
        <div className="mt-6">
            <h2 className="text-xl font-bold">Security</h2>
            <p className="text-lg text-#211F20">
            Note: If you suspect your account has been compromised, please consider changing your password first. {" "}
            <a href="#" className="font-bold underline">Instructions for changing your password can be found on our support site.</a>
            </p>
        </div>

        {/* Back Button under Security Note */}
        <div className="mt-6 flex justify-start">
            <button 
                className="bg-blue-600 text-white py-2 px-6 rounded-md text-lg font-semibold hover:bg-blue-700"
                onClick={() => navigate('/dashboard/dashSettings')}
            >
                Back
            </button>
        </div>
    </div>
  );
}

export default DashChangePassword;
