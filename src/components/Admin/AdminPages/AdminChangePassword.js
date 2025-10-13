import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useNavigate } from 'react-router-dom';
import { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

const AdminChangePassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate(); 
  const auth = getAuth();

  const handleSavePassword = async () => {
    // Reset error state
    setError('');
    
    // Validate passwords
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('No user is currently logged in');
      }

      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      
      // Clear the form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Navigate back to settings with success message
      navigate('/admin-dashboard/settings');
    } catch (err) {
      console.error('Password update error:', err);
      
      if (err.code === 'auth/wrong-password') {
        setError('Current password is incorrect');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please choose a stronger password.');
      } else if (err.code === 'auth/requires-recent-login') {
        setError('Please log in again before changing your password');
      } else {
        setError('Failed to update password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

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
          Change Password
        </h1>
        
        <div className="space-y-6 flex-1">
          {/* Current Password */}
          <div>
            <label className="block text-[#211F20] font-poppins text-sm sm:text-base font-medium leading-normal mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 sm:px-6 md:px-8 lg:px-[24px] py-2 sm:py-3 md:py-4 lg:py-[12px] rounded-[8px] border border-[rgba(0,0,0,0.10)] bg-white font-poppins text-sm sm:text-base font-medium leading-normal text-[#211F20] placeholder-[rgba(33,31,32,0.75)] transition-all duration-200"
                placeholder="Enter your current password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-4 flex items-center"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeSlashIcon className="w-7 h-7 text-gray-600" />
                ) : (
                  <EyeIcon className="w-7 h-7 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-[#211F20] font-poppins text-sm sm:text-base font-medium leading-normal mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 sm:px-6 md:px-8 lg:px-[24px] py-2 sm:py-3 md:py-4 lg:py-[12px] rounded-[8px] border border-[rgba(0,0,0,0.10)] bg-white font-poppins text-sm sm:text-base font-medium leading-normal text-[#211F20] placeholder-[rgba(33,31,32,0.75)] transition-all duration-200"
                placeholder="Enter your new password"
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

          {/* Confirm New Password */}
          <div>
            <label className="block text-[#211F20] font-poppins text-sm sm:text-base font-medium leading-normal mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 sm:px-6 md:px-8 lg:px-[24px] py-2 sm:py-3 md:py-4 lg:py-[12px] rounded-[8px] border border-[rgba(0,0,0,0.10)] bg-white font-poppins text-sm sm:text-base font-medium leading-normal text-[#211F20] placeholder-[rgba(33,31,32,0.75)] transition-all duration-200"
                placeholder="Confirm your new password"
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

          {/* Error Display */}
          {error && (
            <div className="text-red-600 font-poppins text-sm font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Bottom Buttons */}
        <div className="mt-auto pt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          {/* Back Button */}
          <button 
            className="w-full sm:flex-1 bg-white text-[#211F20] font-medium hover:bg-gray-50 transition-colors text-center rounded-lg py-2 sm:py-2 xl:py-2 2xl:py-2 px-6 sm:px-5 xl:px-5 2xl:px-5 font-poppins leading-normal text-[12px] sm:text-[12px] lg:text-[14px] 2xl:text-[16px] border border-[#211F20]"
            onClick={() => navigate('/admin-dashboard/settings')}
            disabled={isLoading}
          >
            Back
          </button>

          {/* Save Button */}
          <button 
            className="w-full sm:flex-1 bg-[#1C50D8] text-white font-medium hover:bg-[#1C50D8]/90 transition-colors text-center rounded-lg py-2 sm:py-2 xl:py-2 2xl:py-2 px-6 sm:px-5 xl:px-5 2xl:px-5 font-poppins leading-normal text-[12px] sm:text-[12px] lg:text-[14px] 2xl:text-[16px]"
            onClick={handleSavePassword}
            disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminChangePassword;
