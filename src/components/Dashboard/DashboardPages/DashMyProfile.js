import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db, storage } from "../../../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import ImageUploading from 'react-images-uploading';
import { IoPersonCircle, IoLocationSharp, IoCameraOutline } from 'react-icons/io5';
import { formatUserName } from "../../../utils/nameFormatter";

// Utility function to format a JavaScript Date to MM/DD/YYYY
const formatDate = (date) => {
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

const DashMyProfile = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const [images, setImages] = useState([]);
  const maxNumber = 1;

  // State for form values (firstName, lastName, etc.)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    location: "",
    gender: "", // new
    sexualPreference: "", // new
    profilePicture: ""
  });

  // This holds the "committed" profile data used in the header
  const [savedData, setSaveData] = useState({
    firstName: "",
    lastName: "",
  });

  // Firestore document ID for updates
  const [docId, setDocId] = useState(null);
  // Are we in "edit" mode?
  const [isEditing, setIsEditing] = useState(false);
  
  // State for success popup
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // On mount, fetch the user's profile and initialize both formData and savedData
  useEffect(() => {
    if (!user) return;

    async function getUserData() {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", user.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docSnapshot = querySnapshot.docs[0];
          const userDoc = docSnapshot.data();

          // Format birthDate for display - handle multiple formats
          let formattedDate = "";
          if (userDoc.birthDate) {
            // If it's already in MM/DD/YYYY format, use it directly
            if (typeof userDoc.birthDate === 'string' && userDoc.birthDate.includes('/')) {
              formattedDate = userDoc.birthDate;
            }
            // If it's a Firestore Timestamp
            else if (userDoc.birthDate && typeof userDoc.birthDate.toDate === "function") {
              formattedDate = formatDate(userDoc.birthDate.toDate());
            }
            // If it's a number (timestamp)
            else if (typeof userDoc.birthDate === 'number') {
              formattedDate = formatDate(new Date(userDoc.birthDate));
            }
            // If it's a string date that can be parsed
            else if (typeof userDoc.birthDate === 'string') {
              const parsedDate = new Date(userDoc.birthDate);
              if (!isNaN(parsedDate.getTime())) {
                formattedDate = formatDate(parsedDate);
              }
            }
          }

          // Populate the form fields
          setFormData({
            firstName:  userDoc.firstName  || "",
            lastName:   userDoc.lastName   || "",
            dateOfBirth: formattedDate,
            location:    userDoc.location  || "",
            gender:      userDoc.gender || "", // new
            sexualPreference: userDoc.sexualPreference || "", // new
            profilePicture: userDoc.image || ""
          });

          // Initialize the "saved" header data from Firestore values
          setSaveData({
            firstName: userDoc.firstName || "",
            lastName:  userDoc.lastName  || "",
          });

          setDocId(docSnapshot.id);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }

    getUserData();
  }, [user]);

  // Helper function to convert MM/DD/YYYY to YYYY-MM-DD for date input
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const [month, day, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateString;
  };

  // Helper function to convert YYYY-MM-DD to MM/DD/YYYY for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${month.padStart(2, '0')}/${day.padStart(2, '0')}/${year}`;
    }
    return dateString;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'dateOfBirth') {
      // If it's a date input (YYYY-MM-DD), convert to MM/DD/YYYY
      const formattedValue = e.target.type === 'date' ? formatDateForDisplay(value) : value;
      setFormData((prev) => ({
        ...prev,
        [name]: formattedValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleImageChange = async (imageList) => {
    setImages(imageList);
    
    if (imageList.length > 0) {
      try {
        const timestamp = new Date().getTime();
        const filename = `${timestamp}_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const storageRef = ref(storage, `profilePictures/${filename}`);
        
        // Convert base64 to blob
        const response = await fetch(imageList[0].data_url);
        const blob = await response.blob();
        
        // Upload to Firebase Storage
        const uploadResult = await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(uploadResult.ref);
        
        setFormData(prev => ({
          ...prev,
          profilePicture: downloadURL
        }));

        // Update Firebase immediately with new profile picture
        if (docId) {
          try {
            const userDocRef = doc(db, "users", docId);
            await updateDoc(userDocRef, {
              image: downloadURL
            });
          } catch (error) {
            console.error("Error updating profile picture in Firebase:", error);
          }
        }

        // Trigger header refresh for profile picture update
        window.dispatchEvent(new CustomEvent('userProfileUpdated'));
        localStorage.setItem('userDataUpdated', Date.now().toString());
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload profile picture. Please try again.');
      }
    }
  };

  const handleSave = async () => {
    if (!docId) return;

    try {
      const userDocRef = doc(db, "users", docId);
      await updateDoc(userDocRef, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        birthDate: formData.dateOfBirth,
        location: formData.location,
        gender: formData.gender,
        sexualPreference: formData.sexualPreference,
        image: formData.profilePicture
      });

      // Exit edit mode
      setIsEditing(false);

      // Commit the edits to savedData (so header updates)
      setSaveData({
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      // Trigger header refresh by dispatching custom event
      window.dispatchEvent(new CustomEvent('userProfileUpdated'));
      localStorage.setItem('userDataUpdated', Date.now().toString());

      // Show success popup instead of alert
      setShowSuccessPopup(true);
    } catch (error) {
      console.error("Error updating user data:", error);
      alert("Error updating profile. Please try again.");
    }
  };

  const inputClassName =
    "flex-1 px-4 py-3.5 text-2xl bg-white rounded-lg border border-solid border-neutral-800 text-neutral-800 max-md:pr-5 max-md:max-w-full";

  return (
    <div style={{
      display: 'flex',
      padding: '0 var(--LeftRight-S, 32px)',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 'var(--Gap-L, 32px)',
      flex: '1 0 0',
      alignSelf: 'stretch',
      background: 'transparent'
    }}>
      <div className="flex flex-col items-start pt-8 pr-20 pb-7 pl-8 w-full rounded-3xl max-md:px-5 max-sm:px-4">
        {/* Main My Profile Title */}
        <h1 style={{
          alignSelf: 'stretch',
          color: 'var(--Raisin_Black, #211F20)',
          fontFamily: '"Bricolage Grotesque"',
          fontSize: 'var(--H6, 32px)',
          fontStyle: 'normal',
          fontWeight: '500',
          lineHeight: '130%',
          marginBottom: '32px'
        }} className="max-md:hidden">
          My Profile
        </h1>
        <div className="flex items-center gap-4 max-sm:gap-3 max-w-full">
          <div className="flex-shrink-0 relative max-sm:w-20 max-sm:h-20 overflow-hidden">
              {isEditing ? (
                <ImageUploading
                  multiple={false}
                  value={images}
                  onChange={handleImageChange}
                  maxNumber={maxNumber}
                  dataURLKey="data_url"
                >
                  {({
                    imageList,
                    onImageUpload,
                    onImageRemove,
                    isDragging,
                    dragProps,
                  }) => (
                    <div className="upload__image-wrapper max-sm:w-20 max-sm:h-20">
                      {imageList.length > 0 ? (
                        <img
                          src={imageList[0].data_url}
                          alt="Profile"
                          style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '150px',
                            border: '1px solid rgba(33, 31, 32, 0.10)',
                            objectFit: 'cover',
                            cursor: 'pointer'
                          }}
                          className="max-sm:!w-20 max-sm:!h-20"
                          onClick={onImageUpload}
                        />
                      ) : formData.profilePicture ? (
                        <img
                          src={formData.profilePicture}
                          alt="Profile"
                          style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '150px',
                            border: '1px solid rgba(33, 31, 32, 0.10)',
                            objectFit: 'cover',
                            cursor: 'pointer'
                          }}
                          className="max-sm:!w-20 max-sm:!h-20"
                          onClick={onImageUpload}
                        />
                      ) : (
                        <div
                          onClick={onImageUpload}
                          {...dragProps}
                          style={{
                            display: 'flex',
                            width: '120px',
                            height: '120px',
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: '150px',
                            border: '1px solid rgba(33, 31, 32, 0.10)',
                            background: '#f3f4f6',
                            cursor: 'pointer',
                            overflow: 'hidden'
                          }}
                          className="max-sm:!w-20 max-sm:!h-20"
                        >
                          <IoPersonCircle style={{ width: '200px', height: '200px', color: '#9ca3af', transform: 'scale(1.5)' }} />
                        </div>
                      )}
                    </div>
                  )}
                </ImageUploading>
              ) : (
                formData.profilePicture ? (
                  <img
                    src={formData.profilePicture}
                    alt="Profile"
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '150px',
                      border: '1px solid rgba(33, 31, 32, 0.10)',
                      objectFit: 'cover'
                    }}
                    className="max-sm:!w-20 max-sm:!h-20"
                  />
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      width: '120px',
                      height: '120px',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderRadius: '150px',
                      border: '1px solid rgba(33, 31, 32, 0.10)',
                      background: '#f3f4f6',
                      overflow: 'hidden'
                    }}
                    className="max-sm:!w-20 max-sm:!h-20"
                  >
                    <IoPersonCircle style={{ width: '200px', height: '200px', color: '#9ca3af', transform: 'scale(1.5)' }} />
                  </div>
                )
              )}
              
              {/* Camera Icon Overlay */}
              <div
                className="max-sm:!w-20 max-sm:!h-20"
                style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  width: '120px',
                  height: '120px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '150px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = async (event) => {
                        const imageData = event.target.result;
                        // Handle the image upload similar to ImageUploading
                        try {
                          const timestamp = new Date().getTime();
                          const filename = `${timestamp}_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
                          const storageRef = ref(storage, `profilePictures/${filename}`);
                          
                          const response = await fetch(imageData);
                          const blob = await response.blob();
                          
                          const uploadResult = await uploadBytes(storageRef, blob);
                          const downloadURL = await getDownloadURL(uploadResult.ref);
                          
                          setFormData(prev => ({
                            ...prev,
                            profilePicture: downloadURL
                          }));

                          // Update Firebase immediately with new profile picture
                          if (docId) {
                            try {
                              const userDocRef = doc(db, "users", docId);
                              await updateDoc(userDocRef, {
                                image: downloadURL
                              });
                            } catch (error) {
                              console.error("Error updating profile picture in Firebase:", error);
                            }
                          }

                          // Trigger header refresh for profile picture update
                          window.dispatchEvent(new CustomEvent('userProfileUpdated'));
                          localStorage.setItem('userDataUpdated', Date.now().toString());
                        } catch (error) {
                          console.error('Error uploading image:', error);
                          alert('Failed to upload profile picture. Please try again.');
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  };
                  input.click();
                }}
              >
                <IoCameraOutline style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex flex-col">
                <div 
                  className="max-sm:text-2xl"
                  style={{
                  alignSelf: 'stretch',
                  color: 'var(--Raisin_Black, #211F20)',
                  fontFamily: '"Bricolage Grotesque"',
                  fontSize: 'var(--H6, 32px)',
                  fontStyle: 'normal',
                  fontWeight: '500',
                  lineHeight: '130%'
                }}>
                  {savedData.firstName && savedData.lastName
                    ? formatUserName(savedData)
                    : "User"}
                </div>
                <div className="flex items-center gap-1 mt-2 max-sm:mt-1">
                  <div 
                    className="max-sm:w-5 max-sm:h-5"
                    style={{
                    display: 'flex',
                    width: '24px',
                    height: '24px',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <svg className="max-sm:w-5 max-sm:h-5" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5S14.5 7.62 14.5 9S13.38 11.5 12 11.5Z" fill="var(--Raisin_Black, #211F20)"/>
                    </svg>
                  </div>
                  <div 
                    className="max-sm:text-sm"
                    style={{
                    color: 'var(--Raisin_Black, #211F20)',
                    fontFamily: '"Bricolage Grotesque"',
                    fontSize: 'var(--H8, 16px)',
                    fontStyle: 'normal',
                    fontWeight: '500',
                    lineHeight: '130%',
                    textTransform: 'uppercase'
                  }}>
                    {formData.location || "Location not set"}
                  </div>
                </div>
              </div>
            </div>
        </div>

        {/* First Name */}
        <div className="flex flex-col gap-2 mt-8 max-w-full w-full">
          <label style={{
            alignSelf: 'stretch',
            color: 'var(--Raisin_Black, #211F20)',
            fontFamily: '"Bricolage Grotesque"',
            fontSize: 'var(--H8, 16px)',
            fontStyle: 'normal',
            fontWeight: '500',
            lineHeight: '130%',
            textTransform: 'uppercase'
          }}>
            First name
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            readOnly={!isEditing}
            style={{
              display: 'flex',
              padding: 'var(--TopBottom-S, 12px) var(--Left-Right-M, 24px)',
              alignItems: 'center',
              gap: 'var(--Gap-S, 24px)',
              alignSelf: 'stretch',
              borderRadius: 'var(--Radius-S, 8px)',
              border: '1px solid rgba(0, 0, 0, 0.10)',
              flex: '1 0 0',
              color: 'var(--Raisin_Black, #211F20)',
              fontFamily: 'Poppins',
              fontSize: 'var(--Body-S-Med, 16px)',
              fontStyle: 'normal',
              fontWeight: '500',
              lineHeight: 'normal',
              background: 'transparent',
              outline: 'none'
            }}
          />
        </div>

        {/* Last Name */}
        <div className="flex flex-col gap-2 mt-4 max-w-full w-full">
          <label style={{
            alignSelf: 'stretch',
            color: 'var(--Raisin_Black, #211F20)',
            fontFamily: '"Bricolage Grotesque"',
            fontSize: 'var(--H8, 16px)',
            fontStyle: 'normal',
            fontWeight: '500',
            lineHeight: '130%',
            textTransform: 'uppercase'
          }}>
            Last name
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            readOnly={!isEditing}
            style={{
              display: 'flex',
              padding: 'var(--TopBottom-S, 12px) var(--Left-Right-M, 24px)',
              alignItems: 'center',
              gap: 'var(--Gap-S, 24px)',
              alignSelf: 'stretch',
              borderRadius: 'var(--Radius-S, 8px)',
              border: '1px solid rgba(0, 0, 0, 0.10)',
              flex: '1 0 0',
              color: 'var(--Raisin_Black, #211F20)',
              fontFamily: 'Poppins',
              fontSize: 'var(--Body-S-Med, 16px)',
              fontStyle: 'normal',
              fontWeight: '500',
              lineHeight: 'normal',
              background: 'transparent',
              outline: 'none'
            }}
          />
        </div>

        {/* Date of Birth */}
        <div className="flex flex-col gap-2 mt-4 max-w-full w-full">
          <label style={{
            alignSelf: 'stretch',
            color: 'var(--Raisin_Black, #211F20)',
            fontFamily: '"Bricolage Grotesque"',
            fontSize: 'var(--H8, 16px)',
            fontStyle: 'normal',
            fontWeight: '500',
            lineHeight: '130%',
            textTransform: 'uppercase'
          }}>
            Date of birth
          </label>
          <input
            type={isEditing ? "date" : "text"}
            name="dateOfBirth"
            value={isEditing ? formatDateForInput(formData.dateOfBirth) : formData.dateOfBirth}
            onChange={handleInputChange}
            placeholder="MM/DD/YYYY"
            readOnly={!isEditing}
            style={{
              display: 'flex',
              padding: 'var(--TopBottom-S, 12px) var(--Left-Right-M, 24px)',
              alignItems: 'center',
              gap: 'var(--Gap-S, 24px)',
              alignSelf: 'stretch',
              borderRadius: 'var(--Radius-S, 8px)',
              border: '1px solid rgba(0, 0, 0, 0.10)',
              flex: '1 0 0',
              color: 'var(--Raisin_Black, #211F20)',
              fontFamily: 'Poppins',
              fontSize: 'var(--Body-S-Med, 16px)',
              fontStyle: 'normal',
              fontWeight: '500',
              lineHeight: 'normal',
              background: 'transparent',
              outline: 'none'
            }}
          />
        </div>

        {/* Location */}
        <div className="flex flex-col gap-2 mt-4 max-w-full w-full">
          <label style={{
            alignSelf: 'stretch',
            color: 'var(--Raisin_Black, #211F20)',
            fontFamily: '"Bricolage Grotesque"',
            fontSize: 'var(--H8, 16px)',
            fontStyle: 'normal',
            fontWeight: '500',
            lineHeight: '130%',
            textTransform: 'uppercase'
          }}>
            Location
          </label>
          {isEditing ? (
            <select
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              style={{
                display: 'flex',
                padding: 'var(--TopBottom-S, 12px) var(--Left-Right-M, 24px)',
                alignItems: 'center',
                gap: 'var(--Gap-S, 24px)',
                alignSelf: 'stretch',
                borderRadius: 'var(--Radius-S, 8px)',
                border: '2px solid rgba(0, 0, 0, 0.15)',
                flex: '1 0 0',
                color: 'var(--Raisin_Black, #211F20)',
                fontFamily: 'Poppins',
                fontSize: 'var(--Body-S-Med, 16px)',
                fontStyle: 'normal',
                fontWeight: '500',
                lineHeight: 'normal',
                background: 'white',
                outline: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 12px center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '16px',
                paddingRight: '48px'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(0, 0, 0, 0.3)';
                e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(0, 0, 0, 0.15)';
                e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
              }}
            >
              <option value="">Select your city</option>
              <option value="Atlanta">Atlanta</option>
              <option value="Chicago">Chicago</option>
              <option value="Dallas">Dallas</option>
              <option value="Houston">Houston</option>
              <option value="Los Angeles">Los Angeles</option>
              <option value="Louisville">Louisville</option>
              <option value="Miami">Miami</option>
              <option value="New York City">New York City</option>
              <option value="Sacramento">Sacramento</option>
              <option value="San Francisco / Bay Area">San Francisco / Bay Area</option>
              <option value="Seattle">Seattle</option>
              <option value="Washington D.C.">Washington D.C.</option>
            </select>
          ) : (
            <input
              type="text"
              name="location"
              value={formData.location}
              readOnly
              style={{
                display: 'flex',
                padding: 'var(--TopBottom-S, 12px) var(--Left-Right-M, 24px)',
                alignItems: 'center',
                gap: 'var(--Gap-S, 24px)',
                alignSelf: 'stretch',
                borderRadius: 'var(--Radius-S, 8px)',
                border: '1px solid rgba(0, 0, 0, 0.10)',
                flex: '1 0 0',
                color: 'var(--Raisin_Black, #211F20)',
                fontFamily: 'Poppins',
                fontSize: 'var(--Body-S-Med, 16px)',
                fontStyle: 'normal',
                fontWeight: '500',
                lineHeight: 'normal',
                background: 'transparent',
                outline: 'none'
              }}
            />
          )}
        </div>

        {/* Gender */}
        <div className="flex flex-col gap-2 mt-4 max-w-full w-full">
          <label style={{
            alignSelf: 'stretch',
            color: 'var(--Raisin_Black, #211F20)',
            fontFamily: '"Bricolage Grotesque"',
            fontSize: 'var(--H8, 16px)',
            fontStyle: 'normal',
            fontWeight: '500',
            lineHeight: '130%',
            textTransform: 'uppercase'
          }}>
            Gender
          </label>
          {isEditing ? (
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              style={{
                display: 'flex',
                padding: 'var(--TopBottom-S, 12px) var(--Left-Right-M, 24px)',
                alignItems: 'center',
                gap: 'var(--Gap-S, 24px)',
                alignSelf: 'stretch',
                borderRadius: 'var(--Radius-S, 8px)',
                border: '2px solid rgba(0, 0, 0, 0.15)',
                flex: '1 0 0',
                color: 'var(--Raisin_Black, #211F20)',
                fontFamily: 'Poppins',
                fontSize: 'var(--Body-S-Med, 16px)',
                fontStyle: 'normal',
                fontWeight: '500',
                lineHeight: 'normal',
                background: 'white',
                outline: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 12px center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '16px',
                paddingRight: '48px'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(0, 0, 0, 0.3)';
                e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(0, 0, 0, 0.15)';
                e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
              }}
            >
              <option value="">Select your gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          ) : (
            <input
              type="text"
              name="gender"
              value={formData.gender}
              readOnly
              style={{
                display: 'flex',
                padding: 'var(--TopBottom-S, 12px) var(--Left-Right-M, 24px)',
                alignItems: 'center',
                gap: 'var(--Gap-S, 24px)',
                alignSelf: 'stretch',
                borderRadius: 'var(--Radius-S, 8px)',
                border: '1px solid rgba(0, 0, 0, 0.10)',
                flex: '1 0 0',
                color: 'var(--Raisin_Black, #211F20)',
                fontFamily: 'Poppins',
                fontSize: 'var(--Body-S-Med, 16px)',
                fontStyle: 'normal',
                fontWeight: '500',
                lineHeight: 'normal',
                background: 'transparent',
                outline: 'none'
              }}
            />
          )}
        </div>

        {/* Sexual Preference */}
        <div className="flex flex-col gap-2 mt-4 max-w-full w-full">
          <label style={{
            alignSelf: 'stretch',
            color: 'var(--Raisin_Black, #211F20)',
            fontFamily: '"Bricolage Grotesque"',
            fontSize: 'var(--H8, 16px)',
            fontStyle: 'normal',
            fontWeight: '500',
            lineHeight: '130%',
            textTransform: 'uppercase'
          }}>
            Sexual Preference
          </label>
          {isEditing ? (
            <select
              name="sexualPreference"
              value={formData.sexualPreference}
              onChange={handleInputChange}
              style={{
                display: 'flex',
                padding: 'var(--TopBottom-S, 12px) var(--Left-Right-M, 24px)',
                alignItems: 'center',
                gap: 'var(--Gap-S, 24px)',
                alignSelf: 'stretch',
                borderRadius: 'var(--Radius-S, 8px)',
                border: '2px solid rgba(0, 0, 0, 0.15)',
                flex: '1 0 0',
                color: 'var(--Raisin_Black, #211F20)',
                fontFamily: 'Poppins',
                fontSize: 'var(--Body-S-Med, 16px)',
                fontStyle: 'normal',
                fontWeight: '500',
                lineHeight: 'normal',
                background: 'white',
                outline: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 12px center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '16px',
                paddingRight: '48px'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(0, 0, 0, 0.3)';
                e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(0, 0, 0, 0.15)';
                e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
              }}
            >
              <option value="">Select your preference</option>
              <option value="Men">Men</option>
              <option value="Women">Women</option>
              <option value="Both">Both</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          ) : (
            <input
              type="text"
              name="sexualPreference"
              value={formData.sexualPreference}
              readOnly
              style={{
                display: 'flex',
                padding: 'var(--TopBottom-S, 12px) var(--Left-Right-M, 24px)',
                alignItems: 'center',
                gap: 'var(--Gap-S, 24px)',
                alignSelf: 'stretch',
                borderRadius: 'var(--Radius-S, 8px)',
                border: '1px solid rgba(0, 0, 0, 0.10)',
                flex: '1 0 0',
                color: 'var(--Raisin_Black, #211F20)',
                fontFamily: 'Poppins',
                fontSize: 'var(--Body-S-Med, 16px)',
                fontStyle: 'normal',
                fontWeight: '500',
                lineHeight: 'normal',
                background: 'transparent',
                outline: 'none'
              }}
            />
          )}
        </div>

        {/* Edit / Save Button */}
        {isEditing ? (
          <button
            onClick={handleSave}
            style={{
              display: 'flex',
              padding: 'var(--TopBottom-S, 12px) var(--Left-Right-M, 24px)',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 'var(--Gap-XXS, 12px)',
              alignSelf: 'stretch',
              borderRadius: 'var(--Radius-S, 8px)',
              background: 'var(--Raisin_Black, #211F20)',
              color: 'white',
              border: 'none',
              marginTop: '24px',
              cursor: 'pointer'
            }}
          >
            Save
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              display: 'flex',
              padding: 'var(--TopBottom-S, 12px) var(--Left-Right-M, 24px)',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 'var(--Gap-XXS, 12px)',
              alignSelf: 'stretch',
              borderRadius: 'var(--Radius-S, 8px)',
              background: 'var(--Raisin_Black, #211F20)',
              color: 'white',
              border: 'none',
              marginTop: '24px',
              cursor: 'pointer'
            }}
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Success Popup Modal */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 relative">
            {/* Close button */}
            <button
              onClick={() => setShowSuccessPopup(false)}
              className="absolute top-4 right-4 text-2xl font-bold text-gray-600 hover:text-gray-800"
            >
              ×
            </button>
            
            {/* Success icon */}
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              {/* Title */}
              <h2
                style={{
                  flex: '1 0 0',
                  color: 'var(--Raisin_Black, #211F20)',
                  fontFamily: '"Bricolage Grotesque"',
                  fontSize: 'var(--H6, 32px)',
                  fontStyle: 'normal',
                  fontWeight: '500',
                  lineHeight: '130%'
                }}
              >
                Profile Updated!
              </h2>
            </div>
            
            {/* Readable text */}
            <p
              style={{
                alignSelf: 'stretch',
                color: 'var(--Raisin_Black, #211F20)',
                fontFamily: 'Poppins',
                fontSize: 'var(--Body-M-Reg, 20px)',
                fontStyle: 'normal',
                fontWeight: '400',
                lineHeight: '130%',
                marginBottom: '24px'
              }}
            >
              Your profile has been successfully updated with the latest information.
            </p>
            
            {/* Primary button */}
            <button
              onClick={() => setShowSuccessPopup(false)}
              style={{
                display: 'flex',
                padding: 'var(--TopBottom-S, 12px) var(--Left-Right-M, 24px)',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 'var(--Gap-XXS, 12px)',
                borderRadius: 'var(--Radius-S, 8px)',
                background: 'var(--Raisin_Black, #211F20)',
                border: 'none',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              <span
                style={{
                  color: '#FFF',
                  fontFamily: 'Poppins',
                  fontSize: 'var(--Body-S-Med, 16px)',
                  fontStyle: 'normal',
                  fontWeight: '500',
                  lineHeight: 'normal'
                }}
              >
                Continue
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashMyProfile;
