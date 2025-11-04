import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../../../pages/firebaseConfig";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const AdminDeleteAccount = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  const handleDeleteAccount = async () => {
    if (!password) {
      setError('Please enter your password to confirm deletion');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const user = auth.currentUser;

      if (!user) {
        throw new Error('No user is currently logged in');
      }

      // Reauthenticate user before deletion
      const credential = EmailAuthProvider.credential(
        user.email,
        password
      );
      await reauthenticateWithCredential(user, credential);

      // Invoke backend cleanup
      const functions = getFunctions();
      const deleteFn = httpsCallable(functions, "deleteUser");
      await deleteFn({ userId: user.uid });

      // Sign out and redirect to home
      await signOut(auth);
      navigate('/', { replace: true });

    } catch (error) {
      console.error('Error deleting account:', error);
      if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else {
        setError('Failed to delete account. Please try again.');
      }
    } finally {
      setLoading(false);
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
          Delete Account
        </h1>
        
        <div className="space-y-6 flex-1">
          <div className="p-4 bg-red-50 rounded-[8px] border border-red-200">
            <p className="text-[#211F20] font-poppins text-sm sm:text-base font-normal leading-normal">
              <strong>Warning:</strong> This action cannot be undone. All your data will be permanently deleted.
            </p>
          </div>

          {/* Password Field */}
          <div>
            <h2 className="text-[#211F20] font-poppins text-sm sm:text-base font-medium leading-normal mb-2">
              Enter your password to confirm deletion
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
            onClick={() => navigate('/admin-dashboard/settings')}
            disabled={loading}
          >
            Back
          </button>

          {/* Delete Button */}
          <button 
            className="w-full sm:flex-1 bg-red-600 text-white font-medium hover:bg-red-700 transition-colors text-center rounded-lg py-2 sm:py-2 xl:py-2 2xl:py-2 px-6 sm:px-5 xl:px-5 2xl:px-5 font-poppins leading-normal text-[12px] sm:text-[12px] lg:text-[14px] 2xl:text-[16px]"
            onClick={handleDeleteAccount}
            disabled={loading || !password}
          >
            {loading ? 'Deleting...' : 'Delete my account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDeleteAccount;
