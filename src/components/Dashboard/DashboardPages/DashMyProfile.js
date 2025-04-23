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
import { db } from "../../../firebaseConfig";

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

  // State for form values (firstName, lastName, etc.)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    location: "",
  });

  // This holds the “committed” profile data used in the header
  const [savedData, setSaveData] = useState({
    firstName: "",
    lastName: "",
  });

  // Firestore document ID for updates
  const [docId, setDocId] = useState(null);
  // Are we in “edit” mode?
  const [isEditing, setIsEditing] = useState(false);

  // On mount, fetch the user’s profile and initialize both formData and savedData
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

          // Format birthDate if it’s a Firestore Timestamp or a raw numeric string
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
          });

          // Initialize the “saved” header data from Firestore values
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

  const handleSave = async () => {
    if (!docId) return;

    try {
      const userDocRef = doc(db, "users", docId);
      await updateDoc(userDocRef, {
        firstName: formData.firstName,
        lastName:  formData.lastName,
        birthDate: formData.dateOfBirth,
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
              <img
                src="https://via.placeholder.com/179"
                alt="Profile"
                className="object-contain rounded-3xl aspect-[0.94] w-[179px] max-md:mt-10"
              />
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
