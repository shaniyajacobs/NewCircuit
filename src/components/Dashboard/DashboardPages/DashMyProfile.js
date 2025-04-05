import React, { useState, useEffect } from "react";

const DashMyProfile = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    location: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSave = () => {
    setIsEditing(false);
    alert("Profile updated successfully!");
  };

  const inputClassName =
    "flex-1 px-4 py-3.5 text-2xl bg-white rounded-lg border border-solid border-neutral-800 text-neutral-800 max-md:pr-5 max-md:max-w-full";

  return (
    <div className="overflow-hidden">
      <div className="flex flex-col items-start pt-20 pr-20 pb-7 pl-8 w-full bg-white rounded-3xl border border-gray-50 border-solid shadow-[0px_4px_20px_rgba(238,238,238,0.502)] max-md:px-5 max-md:max-w-full">
        <div className="max-w-full w-[469px]">
          <div className="flex gap-5 max-md:flex-col">
            <div className="w-[42%] max-md:ml-0 max-md:w-full">
              <img
                src="https://via.placeholder.com/179"
                alt="Profile"
                className="object-contain grow shrink-0 max-w-full rounded-3xl aspect-[0.94] w-[179px] max-md:mt-10"
              />
            </div>
            <div className="ml-5 w-[58%] max-md:ml-0 max-md:w-full">
              <div className="flex flex-col self-stretch my-auto text-black max-md:mt-10">
                <div className="self-start text-4xl font-bold">
                  {formData.firstName || "User"}
                </div>
                <div className="mt-2.5 text-3xl">
                  {formData.location || "Location not set"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* First Name */}
        <div className="flex items-center gap-10 mt-14 max-w-full w-[976px] max-md:mt-10">
          <label className="text-3xl font-bold text-black w-[250px]">First name</label>
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
        <div className="flex items-center gap-10 mt-11 max-w-full w-[976px] max-md:mt-10">
          <label className="text-3xl font-bold text-black w-[250px]">Last name</label>
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
        <div className="flex items-center gap-10 mt-10 max-w-full w-[976px]">
          <label className="text-3xl font-bold text-black w-[250px]">Date of birth</label>
          <input
            type="text"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
            placeholder="MM/DD/YYYY"
            readOnly={!isEditing}
            className={inputClassName}
          />
        </div>

        {/* Location */}
        <div className="flex items-center gap-10 mt-10 max-w-full w-[976px]">
          <label className="text-3xl font-bold text-black w-[250px]">Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            readOnly={!isEditing}
            className={inputClassName}
          />
        </div>

        {/* Buttons */}
        {isEditing ? (
          <button
            onClick={handleSave}
            className="gap-6 self-stretch px-6 py-5 mt-20 text-lg font-semibold text-white whitespace-nowrap bg-blue-700 rounded-2xl shadow-2xl min-h-16 max-md:px-5 max-md:mt-10"
          >
            Save
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="gap-6 self-stretch px-6 py-5 mt-20 text-lg font-semibold text-white whitespace-nowrap bg-blue-700 rounded-2xl shadow-2xl min-h-16 max-md:px-5 max-md:mt-10"
          >
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
};

export default DashMyProfile;
