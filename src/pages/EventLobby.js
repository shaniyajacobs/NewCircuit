import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';

const EventLobby = () => {
  const { eventId, phone } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [event, setEvent] = useState(null);
  const [roundStartTimes, setRoundStartTimes] = useState([]);
  const [roundAssignments, setRoundAssignments] = useState({});
  const [partners, setPartners] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [attendeeDocId, setAttendeeDocId] = useState(null);
  const intervalRef = useRef();

  const getTimestampMillis = (ts) => {
    if (typeof ts === 'number') return ts;
    if (ts && typeof ts.toMillis === 'function') return ts.toMillis();
    return 0;
  };

  useEffect(() => {
    if (!eventId || !phone) {
      setError('Missing event or phone information.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);
        if (!eventSnap.exists()) throw new Error('Event not found');
        const eventData = eventSnap.data();
        setEvent(eventData);
        setRoundStartTimes(eventData.roundStartTimes || []);
        console.log('✅ Event loaded:', eventData);

        const attendeesRef = collection(db, 'events', eventId, 'signedUpUsers');
        const q = query(attendeesRef, where('phoneNumber', '==', phone));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          setError('Attendee not found for this phone number.');
          setLoading(false);
          return;
        }
        const docSnap = querySnapshot.docs[0];
        setAttendeeDocId(docSnap.id);
        const attendeeData = docSnap.data();
        console.log('✅ Attendee data:', attendeeData);
        setRoundAssignments(attendeeData.roundAssignments || {});
        console.log('📋 Round assignments:', attendeeData.roundAssignments || 'none');

        const unsubscribe = onSnapshot(
          collection(db, 'events', eventId, 'signedUpUsers'),
          (snapshot) => {
            const map = {};
            snapshot.forEach((doc) => {
              const data = doc.data();
              map[doc.id] = {
                firstName: data.firstName || data.userName?.split(' ')[0] || 'Unknown',
                lastName: data.lastName || data.userName?.split(' ')[1] || '',
                outfitDescription: data.outfitDescription || '',
              };
            });
            setPartners(map);
          },
          (err) => {
            console.error('Listener error:', err);
          }
        );
        window.__unsubscribeLobby = unsubscribe;
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();

    return () => {
      if (window.__unsubscribeLobby) window.__unsubscribeLobby();
      clearInterval(intervalRef.current);
    };
  }, [eventId, phone]);

  // Timer to navigate to night when round 1 starts
  useEffect(() => {
    if (roundStartTimes.length === 0) return;
    const updateTimer = () => {
      const now = Date.now();
      const firstStart = getTimestampMillis(roundStartTimes[0]);
      const diff = firstStart - now;
      if (diff <= 0) {
        navigate(`/event/${eventId}/night/${phone}`);
        return;
      }
      setTimeLeft(Math.floor(diff / 1000));
    };
    updateTimer();
    intervalRef.current = setInterval(updateTimer, 1000);
    return () => clearInterval(intervalRef.current);
  }, [roundStartTimes, navigate, eventId, phone]);

  // 🔥 NEW: Force redirect if event has already started (for late joiners)
  useEffect(() => {
    if (roundStartTimes.length === 0) return;
    const firstStart = getTimestampMillis(roundStartTimes[0]);
    const now = Date.now();
    if (now >= firstStart) {
      navigate(`/event/${eventId}/night/${phone}`);
    }
  }, [roundStartTimes, navigate, eventId, phone]);

  const renderRounds = () => {
    const rounds = Object.keys(roundAssignments).sort(
      (a, b) => parseInt(a.replace('round', '')) - parseInt(b.replace('round', ''))
    );
    if (rounds.length === 0) {
      return <p className="text-gray-500 text-center">No round assignments yet. Please contact the host.</p>;
    }
    return rounds.map((roundKey) => {
      const roundNum = parseInt(roundKey.replace('round', ''));
      const partnerId = roundAssignments[roundKey];
      const partner = partners[partnerId] || { firstName: 'Unknown', lastName: '', outfitDescription: '' };
      return (
        <div key={roundKey} className="border-b border-gray-200 py-2 flex justify-between">
          <span className="font-medium">Round {roundNum}</span>
          <span>{partner.firstName} {partner.lastName?.charAt(0)}.</span>
          <span className="text-sm text-gray-500">{partner.outfitDescription || 'No outfit'}</span>
        </div>
      );
    });
  };

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!event) return null;

  return (
    <div className="min-h-screen bg-[#FAFFE7] p-4 flex flex-col items-center">
      <div className="max-w-3xl w-full bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-center mb-2">{event.city || 'Event'} Speed Dating</h2>
        <p className="text-center text-gray-600 mb-4">{event.venue} - {event.date} at {event.time}</p>
        <div className="text-center">
          <div className="text-6xl font-bold text-[#211F20] mb-2">
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
          <p className="text-gray-500">Until Round 1 starts</p>
        </div>
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Your Round Schedule</h3>
          <div className="bg-gray-50 rounded p-3">
            {renderRounds()}
          </div>
          <p className="text-sm text-gray-500 mt-4 text-center">
            When the timer hits zero, locate your Round 1 date based on their outfit description.
          </p>
          {/* 🔥 Manual fallback button */}
          <button
            onClick={() => navigate(`/event/${eventId}/night/${phone}`)}
            className="mt-4 w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            Enter Event Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventLobby;