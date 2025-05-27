import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { getAuth, deleteUser, signOut, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../../../pages/firebaseConfig";

const BusinessDeleteAccount = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
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

      // Delete business data from Firestore
      await deleteDoc(doc(db, "businesses", user.uid));

      // Delete user from Firebase Auth
      await deleteUser(user);

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
    <div className="p-8 rounded-lg shadow-md w-full min-h-[calc(100vh-100px)] bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-[#0043F1] mb-6">Delete Business Account</h1>
          <div className="p-8 bg-[#0043F1]/5 rounded-lg border border-[#0043F1]/20 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-[#0043F1]">Before You Delete</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-4 text-lg">
              <li>All your business profile information will be permanently deleted</li>
              <li>Your active coupons and promotions will be removed</li>
              <li>Your account cannot be recovered once deleted</li>
              <li>Any pending transactions or revenue will be forfeited</li>
            </ul>
          </div>
          
          <div className="p-6 bg-red-50 rounded-lg border border-red-200 mb-8">
            <p className="text-red-600 font-medium text-lg">
              Warning: This action cannot be undone. All your business data will be permanently deleted.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-6 bg-red-50 text-red-600 rounded-lg border border-red-200 text-lg">
            {error}
          </div>
        )}

        <div className="mt-12">
          <div className="mb-8">
            <label className="block text-gray-700 text-xl font-semibold mb-3">
              Enter your password to confirm deletion:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-5 border rounded-lg text-lg focus:border-[#0043F1] focus:ring-1 focus:ring-[#0043F1] outline-none"
              placeholder="Enter your password"
            />
          </div>

          <div className="space-y-5">
            <button
              onClick={handleDeleteAccount}
              disabled={loading || !password}
              className={`w-full py-5 ${
                password ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-300'
              } text-white rounded-lg text-xl font-semibold transition-colors`}
            >
              {loading ? 'Deleting Account...' : 'Delete My Business Account'}
            </button>

            <button
              onClick={() => navigate('/enterprise-dash/settings')}
              disabled={loading}
              className="w-full py-5 bg-[#0043F1]/5 text-[#0043F1] rounded-lg text-xl font-semibold hover:bg-[#0043F1]/10 transition-colors border border-[#0043F1]/20"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDeleteAccount; 