import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';

const RoundSchedule = () => {
  const { eventId } = useParams();
  const [eventData, setEventData] = useState(null);
  const [myAssignments, setMyAssignments] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);
      if (!eventSnap.exists()) return;
      const data = eventSnap.data();
      setEventData(data);

      const myDoc = await getDoc(doc(eventRef, 'signedUpUsers', uid));
      if (myDoc.exists()) {
        setMyAssignments(myDoc.data().roundAssignments || {});
      }
      setLoading(false);
    };
    fetchSchedule();
  }, [eventId]);

  if (loading) return <div>Loading schedule...</div>;
  if (!eventData) return <div>Event not found</div>;

  const rounds = Object.keys(myAssignments).sort();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Your Round Schedule</h1>
      <div className="space-y-4">
        {rounds.map((roundKey, idx) => {
          const partnerId = myAssignments[roundKey];
          const startTime = eventData.roundStartTimes?.[idx];
          const timeStr = startTime ? new Date(startTime).toLocaleTimeString() : 'TBD';
          return (
            <div key={roundKey} className="bg-white shadow rounded-lg p-4 flex justify-between items-center">
              <div>
                <span className="font-semibold">{roundKey.replace('round', 'Round ')}</span>
                <span className="ml-4 text-gray-600">Partner: {partnerId}</span>
              </div>
              <span className="text-sm text-gray-500">Starts at {timeStr}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoundSchedule;