import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';

const CheckIn = () => {
  const { eventId, phone, attendeeId } = useParams();
  const navigate = useNavigate();
  const phoneNumber = phone || attendeeId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [event, setEvent] = useState(null);
  const [attendee, setAttendee] = useState(null);
  const [attendeeDocId, setAttendeeDocId] = useState(null);
  const [showEtaInput, setShowEtaInput] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!eventId || !phoneNumber) {
      setError('Missing event or phone information.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);
        if (!eventSnap.exists()) throw new Error('Event not found');
        setEvent(eventSnap.data());

        const attendeesRef = collection(db, 'events', eventId, 'signedUpUsers');
        const q = query(attendeesRef, where('phoneNumber', '==', phoneNumber));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError('Attendee not found. Please make sure you registered for this event.');
          setLoading(false);
          return;
        }

        const docSnap = querySnapshot.docs[0];
        setAttendeeDocId(docSnap.id);
        setAttendee(docSnap.data());
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, [eventId, phoneNumber]);

  const handleCheckIn = async (status) => {
    if (!attendeeDocId) {
      setError('Attendee not found. Please refresh and try again.');
      return;
    }

    setSubmitting(true);
    try {
      const attendeeRef = doc(db, 'events', eventId, 'signedUpUsers', attendeeDocId);
      const updateData = { checkInStatus: status };

      if (status === 'late') {
        const etaTimestamp = Timestamp.fromDate(new Date(Date.now() + etaMinutes * 60 * 1000));
        updateData.eta = etaTimestamp;
      } else {
        updateData.eta = null;
      }

      await updateDoc(attendeeRef, updateData);
    navigate(`/event/${eventId}/lobby/${phoneNumber}`);
    } catch (err) {
      setError('Failed to check in. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-[#FAFFE7] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border border-gray-100">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">{event?.title || event?.city || 'Speed Dating'}</h2>
          <p className="text-lg text-gray-600 mt-1">{event?.venue || 'Venue'}</p>
          <p className="text-lg text-gray-600">Age Range: {event?.ageRange || 'Not specified'}</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleCheckIn('onTime')}
            disabled={submitting}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl text-xl transition duration-200 flex items-center justify-center"
          >
            ✅ I've Arrived
          </button>

          <button
            onClick={() => setShowEtaInput(true)}
            disabled={submitting}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-4 px-6 rounded-xl text-xl transition duration-200 flex items-center justify-center"
          >
            ⏰ I'm Running Late
          </button>

          {showEtaInput && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700">ETA (minutes)</label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={etaMinutes}
                  onChange={(e) => setEtaMinutes(parseInt(e.target.value) || 5)}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleCheckIn('late')}
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg text-lg transition duration-200"
                >
                  Confirm
                </button>
              </div>
            </div>
          )}
        </div>

        {error && <p className="mt-4 text-red-600 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default CheckIn;