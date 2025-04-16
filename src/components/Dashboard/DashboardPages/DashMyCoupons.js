import React, { useState } from 'react';

const DashMyCoupons = () => {
  const [date1Photos, setDate1Photos] = useState({
    user: null,
    partner: null
  });
  const [date2Photos, setDate2Photos] = useState({
    user: null,
    partner: null
  });
  const [error, setError] = useState('');

  const handlePhotoUpload = (dateNum, person, event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (dateNum === 1) {
          setDate1Photos(prev => ({
            ...prev,
            [person]: e.target.result
          }));
        } else {
          setDate2Photos(prev => ({
            ...prev,
            [person]: e.target.result
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    setError('');
    
    if (!date1Photos.user || !date1Photos.partner || !date2Photos.user || !date2Photos.partner) {
      setError('Please upload all required photos before submitting');
      return;
    }

    // Handle successful submission here
    console.log('All photos uploaded, proceeding with submission');
    // Add your submission logic here
  };

  return (
    <div className="p-6 bg-white rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-[#151D48]">How it Works:</h2>
        <div className="px-4 py-2 bg-yellow-100 rounded-lg">
          <span className="text-gray-700">Status: Pending</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#85A2F2] rounded-lg p-4 flex items-center">
          <div className="w-10 h-10 bg-[#151D48] rounded-full flex items-center justify-center text-white font-bold mr-3">
            1
          </div>
          <p className="text-[#151D48] font-medium">
            Upload your pictures for 2 dates
          </p>
        </div>

        <div className="bg-[#85A2F2] rounded-lg p-4 flex items-center">
          <div className="w-10 h-10 bg-[#151D48] rounded-full flex items-center justify-center text-white font-bold mr-3">
            2
          </div>
          <p className="text-[#151D48] font-medium">
            Once approved, receive your special 3rd date coupon by email!
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-[#151D48] mb-3">Date 1:</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="border-2 border-dashed border-[#85A2F2] rounded-lg p-4 h-48 flex flex-col items-center justify-center cursor-pointer hover:border-[#151D48] hover:bg-blue-50 transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(1, 'user', e)}
                  className="hidden"
                  id="date1-user"
                />
                <label htmlFor="date1-user" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                  {date1Photos.user ? (
                    <img src={date1Photos.user} alt="Your photo" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <>
                      <div className="text-4xl mb-2 text-[#85A2F2]">+</div>
                      <p className="text-[#151D48]">Your photo</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div>
              <div className="border-2  border-[#85A2F2] rounded-lg p-4 h-48 flex flex-col items-center justify-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(1, 'partner', e)}
                  className="hidden"
                  id="date1-partner"
                />
                <label  className="w-full h-full flex flex-col items-center justify-center">
                  {(
                    <>
                     
                      <p className="text-[#151D48]"> My match's photo </p>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-[#151D48] mb-3">Date 2:</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="border-2 border-dashed border-[#85A2F2] rounded-lg p-4 h-48 flex flex-col items-center justify-center cursor-pointer hover:border-[#151D48] hover:bg-blue-50 transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(2, 'user', e)}
                  className="hidden"
                  id="date2-user"
                />
                <label htmlFor="date2-user" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                  {date2Photos.user ? (
                    <img src={date2Photos.user} alt="Your photo" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <>
                      <div className="text-4xl mb-2 text-[#85A2F2]">+</div>
                      <p className="text-[#151D48]">Your photo</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div>
              <div className="border-2  border-[#85A2F2] rounded-lg p-4 h-48 flex flex-col items-center justify-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(2, 'partner', e)}
                  className="hidden"
                  id="date2-partner"
                />
                <label className="w-full h-full flex flex-col items-center justify-center">
                  { (
                    <>
          
                      <p className="text-[#151D48]"> My match's photo</p>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-center font-medium mt-4 bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          className="w-full py-4 bg-[#85A2F2] text-[#151D48] font-semibold rounded-lg hover:bg-[#7491e0] transition-all mt-6 flex items-center justify-center space-x-2"
        >
          <span>Submit Photos</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default DashMyCoupons;
