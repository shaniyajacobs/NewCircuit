import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../pages/firebaseConfig";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const DashDeactivateAccount = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  const handleDeactivateAccount = async () => {
    if (!password) {
      setError('Please enter your password to confirm deactivation');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const user = auth.currentUser;

      if (!user) {
        throw new Error('No user is currently logged in');
      }

      // Reauthenticate user before deactivation
      const credential = EmailAuthProvider.credential(
        user.email,
        password
      );
      await reauthenticateWithCredential(user, credential);

      // Update user's active status in Firestore
      await updateDoc(doc(db, "users", user.uid), {
        isActive: false,
        deactivatedAt: new Date()
      });

      // Sign out and redirect to home
      await signOut(auth);
      navigate('/', { replace: true });

    } catch (error) {
      console.error('Error deactivating account:', error);
      if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else {
        setError('Failed to deactivate account. Please try again.');
      }
    } finally {
      setLoading(false);
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
        Deactivate Account
      </h1>

      {/* Content Area - Takes up remaining space */}
      <div className="flex-1 space-y-6">
        {/* What happens section */}
        <div 
          className="p-6 rounded-[8px] border border-[rgba(0,0,0,0.10)]"
          style={{
            background: "radial-gradient(50% 50% at 50% 50%, rgba(226,255,101,0.50) 0%, rgba(210,255,215,0.50) 100%)"
          }}
        >
          <h2
            className="text-[#211F20] font-bricolage text-base sm:text-lg md:text-xl lg:text-2xl xl:text-[24px] font-medium leading-[130%] mb-2"
            style={{
              fontFamily: '"Bricolage Grotesque", sans-serif',
              fontStyle: 'normal',
              fontWeight: 500,
              lineHeight: '130%'
            }}
          >
            What happens when you deactivate?
          </h2>
          <ul className="space-y-2 text-[#211F20] font-poppins text-sm sm:text-base font-normal leading-normal">
            <li>• Your profile will be hidden from other users</li>
            <li>• Your matches and connections will be temporarily suspended</li>
            <li>• You can reactivate your account at any time by logging back in</li>
            <li>• Your data and history will be preserved</li>
          </ul>
        </div>

        {/* Note section */}
        <div className="p-4 bg-yellow-50 rounded-[8px] border border-[rgba(0,0,0,0.10)]">
          <p className="text-[#211F20] font-poppins text-sm sm:text-base font-normal leading-normal">
            Note: You can reactivate your account at any time by logging back in. Your data will be preserved.
          </p>
        </div>

        {/* Password Field */}
        <div>
          <h2 className="text-[#211F20] font-poppins text-sm sm:text-base font-medium leading-normal mb-2">
            Enter your password to confirm deactivation
          </h2>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 sm:px-6 md:px-8 lg:px-[24px] py-2 sm:py-3 md:py-4 lg:py-[12px] rounded-[8px] border border-[rgba(0,0,0,0.10)] bg-white font-poppins text-sm sm:text-base font-medium leading-normal text-[#211F20] placeholder-[rgba(33,31,32,0.75)] transition-all duration-200"
              placeholder="Enter your password"
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
              onClick={() => navigate('/dashboard/dashSettings')}
              disabled={loading}
          >
              Back
          </button>

          {/* Deactivate Button */}
          <button 
              className="w-full sm:flex-1 bg-red-600 text-white font-medium hover:bg-red-700 transition-colors text-center rounded-lg py-2 sm:py-2 xl:py-2 2xl:py-2 px-6 sm:px-5 xl:px-5 2xl:px-5 font-poppins leading-normal text-[12px] sm:text-[12px] lg:text-[14px] 2xl:text-[16px]"
              onClick={handleDeactivateAccount}
              disabled={loading || !password}
          >
              {loading ? 'Deactivating...' : 'Deactivate my account'}
          </button>
      </div>
    </div>
  );
};

export default DashDeactivateAccount;
