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
import { IoPersonCircle } from 'react-icons/io5';

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

          // Format birthDate if it's a Firestore Timestamp or a raw numeric string
          let formattedDate = "";
          if (userDoc.birthDate && typeof userDoc.birthDate.toDate === "function") {
            formattedDate = formatDate(userDoc.birthDate.toDate());
          } else if (userDoc.birthDate) {
            formattedDate = formatDate(new Date(Number(userDoc.birthDate)));
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
        lastName:  formData.lastName,
        birthDate: formData.dateOfBirth,
        image: formData.profilePicture
      });

      // Exit edit mode
      setIsEditing(false);

      // Commit the edits to savedData (so header updates)
      setSaveData({
        firstName: formData.firstName,
        lastName:  formData.lastName,
      });

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating user data:", error);
      alert("Error updating profile. Please try again.");
    }
  };

  const inputClassName =
    "flex-1 px-4 py-3.5 text-2xl bg-white rounded-lg border border-solid border-neutral-800 text-neutral-800 max-md:pr-5 max-md:max-w-full";

  return (
    <div className="overflow-hidden">
      <div className="flex flex-col items-start pt-20 pr-20 pb-7 pl-8 w-full bg-white rounded-3xl border border-gray-50 shadow-[0px_4px_20px_rgba(238,238,238,0.502)] max-md:px-5">
        <div className="max-w-full w-[469px]">
          <div className="flex gap-5 max-md:flex-col">
            <div className="w-[42%] max-md:w-full">
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
                    <div className="upload__image-wrapper">
                      {imageList.length > 0 ? (
                        <img
                          src={imageList[0].data_url}
                          alt="Profile"
                          className="object-cover rounded-3xl w-[179px] h-[179px]"
                          onClick={onImageUpload}
                        />
                      ) : formData.profilePicture ? (
                        <img
                          src={formData.profilePicture}
                          alt="Profile"
                          className="object-cover rounded-3xl w-[179px] h-[179px]"
                          onClick={onImageUpload}
                        />
                      ) : (
                        <div
                          onClick={onImageUpload}
                          {...dragProps}
                          className="flex items-center justify-center w-[179px] h-[179px] rounded-3xl border-2 border-dashed border-gray-300 cursor-pointer"
                        >
                          <IoPersonCircle className="w-20 h-20 text-gray-400" />
                        </div>
                      )}
                    </div>
                  )}
                </ImageUploading>
              ) : (
                <img
                  src={formData.profilePicture || "https://via.placeholder.com/179"}
                  alt="Profile"
                  className="object-cover rounded-3xl w-[179px] h-[179px]"
                />
              )}
            </div>
            <div className="ml-5 w-[58%] max-md:ml-0 max-md:w-full">
              <div className="flex flex-col self-stretch my-auto text-black max-md:mt-10">
                <div className="self-start text-4xl font-bold">
                  {savedData.firstName && savedData.lastName
                    ? `${savedData.firstName} ${savedData.lastName}`
                    : "User"}
                </div>
                <div className="mt-2.5 text-3xl">
                  {formData.location || "Location not set"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* First Name */}
        <div className="flex items-center gap-10 mt-14 max-w-full">
          <label className="text-3xl font-bold text-black w-[250px]">
            First name
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            readOnly={!isEditing}
            className={inputClassName}
          />
        </div>

        {/* Last Name */}
        <div className="flex items-center gap-10 mt-11 max-w-full">
          <label className="text-3xl font-bold text-black w-[250px]">
            Last name
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            readOnly={!isEditing}
            className={inputClassName}
          />
        </div>

        {/* Date of Birth */}
        <div className="flex items-center gap-10 mt-10 max-w-full">
          <label className="text-3xl font-bold text-black w-[250px]">
            Date of birth
          </label>
          <input
            type="text"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            placeholder="MM/DD/YYYY"
            readOnly
            className={inputClassName}
          />
        </div>

        {/* Location */}
        <div className="flex items-center gap-10 mt-10 max-w-full">
          <label className="text-3xl font-bold text-black w-[250px]">
            Location
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            readOnly
            className={inputClassName}
          />
        </div>

        {/* Gender */}
        <div className="flex items-center gap-10 mt-10 max-w-full">
          <label className="text-3xl font-bold text-black w-[250px]">
            Gender
          </label>
          <input
            type="text"
            name="gender"
            value={formData.gender}
            readOnly
            className={inputClassName}
          />
        </div>

        {/* Sexual Preference */}
        <div className="flex items-center gap-10 mt-10 max-w-full">
          <label className="text-3xl font-bold text-black w-[250px]">
            Sexual Preference
          </label>
          <input
            type="text"
            name="sexualPreference"
            value={formData.sexualPreference}
            readOnly
            className={inputClassName}
          />
        </div>

        {/* Edit / Save Button */}
        {isEditing ? (
          <button
            onClick={handleSave}
            className="self-stretch px-6 py-5 mt-20 text-lg font-semibold text-white bg-blue-700 rounded-2xl shadow-2xl max-md:mt-10"
          >
            Save
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="self-stretch px-6 py-5 mt-20 text-lg font-semibold text-white bg-blue-700 rounded-2xl shadow-2xl max-md:mt-10"
          >
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
};

export default DashMyProfile;
