import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../pages/firebaseConfig';
import { FaEdit, FaSave } from 'react-icons/fa';

const BusinessProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [businessData, setBusinessData] = useState({
    legalBusinessName: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const auth = getAuth();
  const businessId = auth.currentUser?.uid;

  useEffect(() => {
    fetchBusinessData();
  }, []);

  const fetchBusinessData = async () => {
    try {
      const businessRef = doc(db, 'businesses', businessId);
      const businessSnap = await getDoc(businessRef);
      
      if (businessSnap.exists()) {
        setBusinessData(businessSnap.data());
      }
    } catch (error) {
      console.error('Error fetching business data:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBusinessData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!businessId) return;

    try {
      setLoading(true);
      setError('');
      
      const businessRef = doc(db, 'businesses', businessId);
      await updateDoc(businessRef, {
        legalBusinessName: businessData.legalBusinessName,
        email: businessData.email
      });

      // Exit edit mode
      setIsEditing(false);
      alert("Business profile updated successfully!");
    } catch (error) {
      console.error('Error updating business data:', error);
      setError('Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to original data and exit edit mode
    fetchBusinessData();
    setIsEditing(false);
    setError('');
  };

  return (
    <div className="p-7 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)] max-sm:p-5 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold text-indigo-950">Business Profile</h1>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#0043F1] text-white rounded-xl hover:bg-[#0034BD] transition-colors"
          >
            <FaEdit />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-[#0043F1] text-white rounded-xl hover:bg-[#0034BD] transition-colors disabled:opacity-50"
            >
              <FaSave />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center gap-6 mb-6">
            {/* Logo upload functionality can be added here later */}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
            <input
              type="text"
              name="legalBusinessName"
              value={businessData.legalBusinessName || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={businessData.email || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessProfile;
