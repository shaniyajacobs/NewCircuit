import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../pages/firebaseConfig";

const BusinessDeactivateAccount = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
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

      // Update business's active status in Firestore
      await updateDoc(doc(db, "businesses", user.uid), {
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
    <div className="p-8 rounded-lg shadow-md w-full min-h-[calc(100vh-100px)] bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-[#0043F1] mb-6">Deactivate Business Account</h1>
          <div className="p-8 bg-[#0043F1]/5 rounded-lg border border-[#0043F1]/20 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-[#0043F1]">What happens when you deactivate?</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-4 text-lg">
              <li>Your business profile will be hidden from users</li>
              <li>Your active coupons will be temporarily suspended</li>
              <li>You can reactivate your account at any time by logging back in</li>
              <li>Your business data and history will be preserved</li>
            </ul>
          </div>
          
          <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200 mb-8">
            <p className="text-yellow-700 font-medium text-lg">
              Note: You can reactivate your account at any time by logging back in. Your data will be preserved.
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
              Enter your password to confirm deactivation:
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
              onClick={handleDeactivateAccount}
              disabled={loading || !password}
              className={`w-full py-5 ${
                password ? 'bg-[#0043F1] hover:bg-[#0034BD]' : 'bg-gray-300'
              } text-white rounded-lg text-xl font-semibold transition-colors`}
            >
              {loading ? 'Deactivating Account...' : 'Deactivate My Business Account'}
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

export default BusinessDeactivateAccount; 