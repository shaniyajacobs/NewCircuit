import React, { useState, useEffect } from 'react';
import { auth, db } from '../../../pages/firebaseConfig';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  getDoc
} from 'firebase/firestore';

const DashMyCoupons = () => {
  const me = auth.currentUser.uid;
  const [conversations, setConversations] = useState([]);
  const [acceptedDates, setAcceptedDates] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [selectedDate1Id, setSelectedDate1Id] = useState('');
  const [selectedDate2Id, setSelectedDate2Id] = useState('');
  const [error, setError] = useState('');

  // 1️⃣ Subscribe and extract all accepted dates
  useEffect(() => {
    const q = query(
      collection(db, 'conversations'),
      where('userIds', 'array-contains', me)
    );
    const unsub = onSnapshot(q, snap => {
      const convos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setConversations(convos);
      const dates = convos.flatMap(convo =>
        (convo.dates || [])
          .filter(d => d.status === 'accepted')
          .map(d => ({
            ...d,
            convoId: convo.id,
            partnerId: convo.userIds.find(u => u !== me)
          }))
      );
      setAcceptedDates(dates);
    });
    return () => unsub();
  }, [me]);

  // 2️⃣ Fetch partner names from users collection
  useEffect(() => {
    const uniqueIds = [...new Set(acceptedDates.map(d => d.partnerId))];
    uniqueIds.forEach(uid => {
      if (!usersMap[uid]) {
        getDoc(doc(db, 'users', uid)).then(uDoc => {
          if (uDoc.exists()) {
            const { firstName, lastName } = uDoc.data();
            const fullName = [firstName, lastName].filter(Boolean).join(' ');
            setUsersMap(prev => ({ ...prev, [uid]: fullName || uid }));
          } else {
            setUsersMap(prev => ({ ...prev, [uid]: uid }));
          }
        });
      }
    });
  }, [acceptedDates, usersMap]);

  // Photo upload (unchanged)
  const handlePhotoUpload = async (dateId, ownerId, event) => {
    setError('');
    const file = event.target.files[0];
    if (!file) {
      setError('No file selected');
      return;
    }
    if (!dateId) {
      setError('Please select a date first');
      return;
    }
    const reader = new FileReader();
    reader.onload = async e => {
      const url = e.target.result;
      const date = acceptedDates.find(d => d.id === dateId);
      if (!date) return;
      const convoRef = doc(db, 'conversations', date.convoId);
      const convoData = conversations.find(c => c.id === date.convoId);
      if (!convoData) return;
      const updatedDates = (convoData.dates || []).map(d =>
        d.id === dateId
          ? { ...d, photos: { ...d.photos, [ownerId]: { uploaded: true, url } } }
          : d
      );
      await updateDoc(convoRef, { dates: updatedDates });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-7 bg-white rounded-3xl border border-gray-50 shadow-lg max-md:p-5">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-[#151D48]">How it Works:</h2>
        <div className="px-4 py-2 bg-yellow-100 rounded-lg">
          <span className="text-gray-700">Status: Pending</span>
        </div>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#85A2F2] rounded-lg p-4 flex items-center">
          <div className="w-10 h-10 bg-[#151D48] rounded-full flex items-center justify-center text-white font-bold mr-3">1</div>
          <p className="text-[#151D48] font-medium">Select the date and upload your photo</p>
        </div>
        <div className="bg-[#85A2F2] rounded-lg p-4 flex items-center">
          <div className="w-10 h-10 bg-[#151D48] rounded-full flex items-center justify-center text-white font-bold mr-3">2</div>
          <p className="text-[#151D48] font-medium">Repeat for second date</p>
        </div>
      </div>

      <div className="space-y-6">
        {[1, 2].map(slot => {
          const selectedId = slot === 1 ? selectedDate1Id : selectedDate2Id;
          const setSelected = slot === 1 ? setSelectedDate1Id : setSelectedDate2Id;
          const otherSelected = slot === 1 ? selectedDate2Id : selectedDate1Id;
          const date = acceptedDates.find(d => d.id === selectedId);

          return (
            <div key={slot}>
              <h3 className="text-lg font-semibold text-[#151D48] mb-3">{`Date ${slot}:`}</h3>
              <select
                className="border p-2 rounded mb-4 w-full"
                value={selectedId}
                onChange={e => {
                  setError('');
                  setSelected(e.target.value);
                }}
              >
                <option value="" disabled>
                  Select a scheduled date...
                </option>
                {acceptedDates
                  .filter(d => d.id !== otherSelected)
                  .map(d => {
                    const partnerName = usersMap[d.partnerId] || d.partnerId;
                    return (
                      <option key={d.id} value={d.id}>
                        {`${new Date(d.timestamp.toDate()).toLocaleString()} with ${partnerName} @ ${d.location}`}
                      </option>
                    );
                  })}
              </select>

              <div className="grid grid-cols-2 gap-4">
                {/* Your slot */}
                <div className="border-2 border-dashed border-[#85A2F2] rounded-lg p-4 h-48 flex items-center justify-center hover:border-[#151D48] hover:bg-blue-50 transition-all">
                  {date && date.photos[me]?.uploaded ? (
                    <img src={date.photos[me].url} alt="Your photo" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <label className="cursor-pointer text-center text-[#151D48] w-full h-full flex flex-col items-center justify-center">
                      <div className="text-4xl mb-2 text-[#85A2F2]">+</div>
                      <span>Upload your photo</span>
                      <input
                        className="hidden"
                        type="file"
                        accept="image/*"
                        onChange={e => handlePhotoUpload(selectedId, me, e)}
                      />
                    </label>
                  )}
                </div>

                {/* Partner slot */}
                <div className="border-2 border-dashed border-[#85A2F2] rounded-lg p-4 h-48 flex items-center justify-center">
                  {date && date.photos[date.partnerId]?.uploaded ? (
                    <img src={date.photos[date.partnerId].url} alt="Partner upload" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <span className="text-gray-400">Waiting for partner's photo</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {error && (
          <div className="text-red-500 text-center font-medium mt-4 bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashMyCoupons;
