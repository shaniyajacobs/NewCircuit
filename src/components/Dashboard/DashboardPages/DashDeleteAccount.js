import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { getAuth, deleteUser, signOut, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../../../pages/firebaseConfig";

const DashDeleteAccount = () => {
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

      // Delete user data from Firestore
      await deleteDoc(doc(db, "users", user.uid));

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
    <div className="p-10 rounded-lg shadow-md w-3/4 min-h-[500px] bg-white">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Delete Account</h1>
        <p className="text-gray-700 mb-6">
          Warning: This action cannot be undone. All your data will be permanently deleted.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-600 rounded-md">
          {error}
        </div>
      )}

      <div className="mb-8">
        <label className="block text-gray-700 text-lg font-semibold mb-2">
          Enter your password to confirm:
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-4 border rounded-md text-lg"
          placeholder="Enter your password"
        />
      </div>

      <div className="space-y-4">
        <button
          onClick={handleDeleteAccount}
          disabled={loading || !password}
          className={`w-full py-4 ${
            password ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-300'
          } text-white rounded-md text-xl font-semibold transition-colors`}
        >
          {loading ? 'Deleting Account...' : 'Delete My Account'}
        </button>

        <button
          onClick={() => navigate('/dashboard/dashSettings')}
          disabled={loading}
          className="w-full py-4 bg-gray-100 text-gray-700 rounded-md text-xl font-semibold hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-md">
        <h2 className="text-xl font-bold mb-2">Before You Delete</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>All your profile information will be permanently deleted</li>
          <li>Your matches and connections will be removed</li>
          <li>Your account cannot be recovered once deleted</li>
          <li>Any active coupons or rewards will be forfeited</li>
        </ul>
      </div>
    </div>
  );
};

export default DashDeleteAccount;
