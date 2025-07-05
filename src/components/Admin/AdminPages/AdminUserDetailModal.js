import React, { useEffect, useState } from 'react';
import { db } from '../../../pages/firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const AdminUserDetailModal = ({ isOpen, onClose, user }) => {
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isOpen) return;
    setLoading(true);
    const fetchDates = async () => {
      // Find all conversations where user is a participant
      const q = query(collection(db, 'conversations'), where('userIds', 'array-contains', user.id));
      const snap = await getDocs(q);
      let allDates = [];
      for (const docSnap of snap.docs) {
        const convo = docSnap.data();
        const convoId = docSnap.id;
        (convo.dates || []).forEach(date => {
          // Only show if user has submitted a photo
          if (date.photos && date.photos[user.id] && date.photos[user.id].uploaded) {
            allDates.push({
              ...date,
              convoId,
              userPhoto: date.photos[user.id].url,
              partnerId: convo.userIds.find(uid => uid !== user.id),
            });
          }
        });
      }
      // Optionally fetch partner names
      for (const d of allDates) {
        if (d.partnerId) {
          const partnerDoc = await getDoc(doc(db, 'users', d.partnerId));
          d.partnerName = partnerDoc.exists() ? `${partnerDoc.data().firstName || ''} ${partnerDoc.data().lastName || ''}`.trim() : d.partnerId;
        }
      }
      setDates(allDates);
      setLoading(false);
    };
    fetchDates();
  }, [user, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-8 relative">
        <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-bold mb-4">{user.firstName} {user.lastName}'s Submitted Dates</h2>
        {loading ? (
          <div className="text-center py-8">Loading…</div>
        ) : dates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No submitted dates found.</div>
        ) : (
          <div className="space-y-6 max-h-[60vh] overflow-y-auto">
            {dates.map((date, idx) => (
              <div key={date.id || idx} className="border rounded-lg p-4 flex gap-6 items-center">
                <img src={date.userPhoto} alt="User submission" className="w-32 h-32 object-cover rounded-lg border" />
                <div className="flex-1">
                  <div className="font-semibold text-lg mb-1">Date: {date.timestamp && date.timestamp.toDate ? date.timestamp.toDate().toLocaleString() : ''}</div>
                  <div className="text-gray-600 mb-1">Location: {date.location || 'N/A'}</div>
                  <div className="text-gray-600 mb-1">Partner: {date.partnerName || date.partnerId || 'N/A'}</div>
                  <div className="text-sm">Status: <span className="font-semibold capitalize">{date.status || 'pending'}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUserDetailModal; 