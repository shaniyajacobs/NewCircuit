import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"; // Importing eye icons
import { useNavigate } from 'react-router-dom';

const DashChangePassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate(); 

  const handleSavePassword = async () => {
    // Reset error state
    setError('');
    
    // Validate passwords
    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Here you would typically call your authentication service
      // For example, if using Firebase Auth:
      // await updatePassword(auth.currentUser, newPassword);
      
      // For now, we'll simulate the password change
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clear the form
      setNewPassword('');
      setConfirmPassword('');
      
      // Navigate back to settings with success message
      navigate('/dashboard/dashSettings');
    } catch (err) {
      setError('Failed to update password. Please try again.');
      console.error('Password update error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-10 w-full min-h-screen bg-white relative flex flex-col">
        {/* Header */}
        <h1 
          className="text-[#211F20] font-bricolage text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-[32px] font-medium leading-[130%] mb-4 pt-4 pb-2"
          style={{
            fontFamily: '"Bricolage Grotesque", sans-serif',
            fontStyle: 'normal',
            fontWeight: 500,
            lineHeight: '130%'
          }}
        >
          Change Password
        </h1>

        {/* Content Area - Takes up remaining space */}
        <div className="flex-1 space-y-6">
            {/* Password Fields */}
            <div className="space-y-3">
                {/* New Password Section */}
                <div>
                    <h2 className="text-[#211F20] font-poppins text-sm sm:text-base font-medium leading-normal mb-2">
                        New Password
                    </h2>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            className="w-full px-4 sm:px-6 md:px-8 lg:px-[24px] py-2 sm:py-3 md:py-4 lg:py-[12px] rounded-[8px] border border-[rgba(0,0,0,0.10)] bg-white font-poppins text-sm sm:text-base font-medium leading-normal text-[#211F20] placeholder-[rgba(33,31,32,0.75)] transition-all duration-200"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
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

                {/* Confirm Password Section */}
                <div>
                    <h2 className="text-[#211F20] font-poppins text-sm sm:text-base font-medium leading-normal mb-2">
                        Confirm New Password
                    </h2>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            className="w-full px-4 sm:px-6 md:px-8 lg:px-[24px] py-2 sm:py-3 md:py-4 lg:py-[12px] rounded-[8px] border border-[rgba(0,0,0,0.10)] bg-white font-poppins text-sm sm:text-base font-medium leading-normal text-[#211F20] placeholder-[rgba(33,31,32,0.75)] transition-all duration-200"
                            placeholder="Retype new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
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
            </div>

            {/* Error Display */}
            {error && (
                <div className="text-red-600 font-poppins text-sm font-medium">
                    {error}
                </div>
            )}

            {/* Security Notice */}
            <div>
                <h2 className="text-[#211F20] font-poppins text-sm sm:text-base font-medium leading-normal mb-2">
                    Security
                </h2>
                <p className="font-poppins text-sm sm:text-base font-normal leading-normal text-[#211F20] mb-1">
                    Note: If you suspect your account has been compromised, please consider changing your password first. {" "}
                    <a
                        href="#"
                        className="font-bold underline text-[#211F20] hover:text-blue-700 transition-colors"
                    >
                        Instructions for changing your password can be found on our support site.
                    </a>
                </p>
            </div>
        </div>

        {/* Bottom Buttons */}
        <div className="mt-auto pt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            {/* Back Button */}
            <button 
                className="w-full sm:flex-1 bg-white text-[#211F20] font-medium hover:bg-gray-50 transition-colors text-center rounded-lg py-2 sm:py-2 xl:py-2 2xl:py-2 px-6 sm:px-5 xl:px-5 2xl:px-5 font-poppins leading-normal text-[12px] sm:text-[12px] lg:text-[14px] 2xl:text-[16px] border border-[#211F20]"
                onClick={() => navigate('/dashboard/dashSettings')}
            >
                Back
            </button>

            {/* Save New Password Button */}
            <button 
                className="w-full sm:flex-1 bg-[#211F20] text-white font-medium hover:bg-gray-800 transition-colors text-center rounded-lg py-2 sm:py-2 xl:py-2 2xl:py-2 px-6 sm:px-5 xl:px-5 2xl:px-5 font-poppins leading-normal text-[12px] sm:text-[12px] lg:text-[14px] 2xl:text-[16px]"
                onClick={handleSavePassword}
                disabled={isLoading}
            >
                {isLoading ? 'Saving...' : 'Save new password'}
            </button>
        </div>
    </div>
  );
}

export default DashChangePassword;
