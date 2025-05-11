import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../pages/firebaseConfig';
import { FaEdit, FaSave } from 'react-icons/fa';

const BusinessProfile = () => {
  //const [isEditing, setIsEditing] = useState(false);
  const [businessData, setBusinessData] = useState({
    businessName: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    logo: '',
    website: '',
    cuisine: '',
    openingHours: '',
    priceRange: ''
  });

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

  /* const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBusinessData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const businessRef = doc(db, 'businesses', businessId);
      await updateDoc(businessRef, businessData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating business data:', error);
    }
  }; */

  const ProfileField = ({ label, name, type = 'text', value, onChange, disabled }) => (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {type === 'textarea' ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          rows="4"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
          readOnly
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
          readOnly
        />
      )}
    </div>
  );

  return (
    <div className="p-7 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)] max-sm:p-5 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold text-indigo-950">Business Profile</h1>
        {/* <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 px-6 py-3 bg-[#0043F1] text-white rounded-xl hover:bg-[#0034BD] transition-colors"
        >
          {isEditing ? (
            <>
              <FaSave />
              Save Changes
            </>
          ) : (
            <>
              <FaEdit />
              Edit Profile
            </>
          )}
        </button> */}
      </div>

      <div className="max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-32 h-32 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
              {businessData.logo ? (
                <img
                  src={businessData.logo}
                  alt="Business Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400">No logo</span>
              )}
            </div>
            {/* {isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Logo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-[#0043F1] file:text-white
                    hover:file:bg-[#0034BD]"
                />
              </div>
            )} */}
          </div>
        </div>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileField
            label="Business Name"
            name="businessName"
            value={businessData.businessName}
            //onChange={handleInputChange}
            //disabled={!isEditing}
          />
          <ProfileField
            label="Email"
            name="email"
            type="email"
            value={businessData.email}
            //onChange={handleInputChange}
            //disabled={true}
          />
          <ProfileField
            label="Phone"
            name="phone"
            type="tel"
            value={businessData.phone}
            //onChange={handleInputChange}
            //disabled={!isEditing}
          />
          <ProfileField
            label="Website"
            name="website"
            type="url"
            value={businessData.website}
            //onChange={handleInputChange}
            //disabled={!isEditing}
          />
          <ProfileField
            label="Cuisine Type"
            name="cuisine"
            value={businessData.cuisine}
            //onChange={handleInputChange}
            //disabled={!isEditing}
          />
          <ProfileField
            label="Price Range"
            name="priceRange"
            value={businessData.priceRange}
            //onChange={handleInputChange}
            //disabled={!isEditing}
          />
        </div>

        <ProfileField
          label="Address"
          name="address"
          value={businessData.address}
          //onChange={handleInputChange}
          //disabled={!isEditing}
        />

        <ProfileField
          label="Description"
          name="description"
          type="textarea"
          value={businessData.description}
          //onChange={handleInputChange}
          //disabled={!isEditing}
        />

        <ProfileField
          label="Opening Hours"
          name="openingHours"
          type="textarea"
          value={businessData.openingHours}
          //onChange={handleInputChange}
          //disabled={!isEditing}
        />

        {/* {isEditing && (
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0043F1] text-white rounded-lg hover:bg-[#0034BD] transition-colors"
            >
              Save Changes
            </button>
          </div>
        )} */}
    </div>
  );
};

export default BusinessProfile;
