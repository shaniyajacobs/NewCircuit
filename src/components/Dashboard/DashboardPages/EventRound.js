import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../../firebaseConfig';
import { doc, getDoc, onSnapshot, updateDoc, Timestamp } from 'firebase/firestore';
import { format, differenceInSeconds, differenceInMilliseconds } from 'date-fns';

// Sub-components
const ActiveRoundScreen = ({ partner, icebreaker, roundNum, totalRounds, onNotesUpdate }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    // Timer logic: we need the round end time from event.roundStartTimes[roundNum-1] + roundDuration
    // We'll get this from parent props (roundEndTime)
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h3 className="text-xl font-bold">Round {roundNum} of {totalRounds}</h3>
      <div className="text-6xl font-bold my-4 text-center">{/* timer */}</div>
      <div className="border-t pt-4">
        <p><span className="font-semibold">Your date:</span> {partner.firstName} {partner.lastName?.charAt(0)}.</p>
        <p className="text-gray-600">{partner.outfitDescription || 'No outfit description'}</p>
        <p className="mt-2"><span className="font-semibold">Prompt:</span> {icebreaker}</p>
        <textarea
          placeholder="Add a note about this date"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border border-gray-300 rounded p-2 mt-3"
          rows="3"
        />
      </div>
    </div>
  );
};

const LateArrivalScreen = ({ partner, eta }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h3 className="text-xl font-bold text-yellow-600">Late Arrival</h3>
      <p className="mt-2">{partner.firstName} is on their way! ETA: {eta ? format(eta.toDate(), 'h:mm a') : 'soon'}. Sit tight — your date will be here shortly.</p>
      <div className="mt-4">
        <p><span className="font-semibold">Your date:</span> {partner.firstName} {partner.lastName?.charAt(0)}.</p>
        <p className="text-gray-600">{partner.outfitDescription || 'No outfit description'}</p>
        <textarea
          placeholder="Add a note about this date"
          className="w-full border border-gray-300 rounded p-2 mt-3"
          rows="3"
        />
      </div>
    </div>
  );
};

const NoShowScreen = ({ partner, nextPartner, nextRoundStart }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h3 className="text-xl font-bold text-red-600">No-Show</h3>
      <p className="mt-2">Your date for this round hasn't confirmed attendance. We're sorry for the inconvenience — enjoy a break on us!</p>
      <div className="mt-4 border-t pt-4">
        <p><span className="font-semibold">Up next — Round {nextRoundNum}</span></p>
        <p>{nextPartner.firstName || nextPartner.userName || nextPartner.displayName || 'Unknown'} {nextPartner.lastName?.charAt(0) || ''}.</p>
        <p className="text-gray-600">{nextPartner.outfitDescription || 'No outfit'}</p>
        <p className="text-sm text-gray-500">Starts at {format(nextRoundStart.toDate(), 'h:mm a')}</p>
      </div>
    </div>
  );
};

const BreakScreen = ({ nextRoundNum, nextPartner, nextRoundStart }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  // Timer for break length (breakDurationSeconds)
  // We'll compute until next round start

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto text-center">
      <div className="text-6xl font-bold my-4">{/* timer */}</div>
      <p className="text-xl">Great round! Grab a drink and head to your Round {nextRoundNum} seat.</p>
      <div className="mt-4">
        <p><span className="font-semibold">Next:</span> {nextPartner.firstName} {nextPartner.lastName?.charAt(0)}.</p>
        <p className="text-gray-600">{nextPartner.outfitDescription || 'No outfit'}</p>
        <p className="text-sm text-gray-500">Starts at {format(nextRoundStart.toDate(), 'h:mm a')}</p>
      </div>
    </div>
  );
};

// Main component
const EventRound = () => {
  const { eventId, roundNum } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [event, setEvent] = useState(null);
  const [attendee, setAttendee] = useState(null);
  const [partner, setPartner] = useState(null);
  const [partnerStatus, setPartnerStatus] = useState('onTime'); // 'onTime', 'late', 'noShow'
  const [partnerEta, setPartnerEta] = useState(null);
  const [icebreakers, setIcebreakers] = useState([]);
  const [currentIcebreaker, setCurrentIcebreaker] = useState('');
  const [roundAssignments, setRoundAssignments] = useState({});
  const [allAttendees, setAllAttendees] = useState({});

  // Compute round index from roundNum (1-indexed)
  const roundIndex = parseInt(roundNum) - 1;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get event
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);
        if (!eventSnap.exists()) throw new Error('Event not found');
        const eventData = eventSnap.data();
        setEvent(eventData);
        setIcebreakers(eventData.icebreakers || []);

        // Get attendee (we need to know who is logged in)
        // For now, we'll assume we have attendeeId from URL or auth
        // We'll use a placeholder: get from session or from query param
        // We'll assume we have attendeeId in state or we can get from auth phone
        const user = auth.currentUser;
        let attendeeId = user?.phoneNumber;
        if (!attendeeId) {
          // Fallback: use URL query param
          const params = new URLSearchParams(window.location.search);
          attendeeId = params.get('attendee');
        }
        if (!attendeeId) {
          navigate('/login');
          return;
        }

        // Fetch attendee
        const attendeeRef = doc(db, 'events', eventId, 'signedUpUsers', attendeeId);
        const attendeeSnap = await getDoc(attendeeRef);
        if (!attendeeSnap.exists()) throw new Error('Attendee not found');
        const attendeeData = attendeeSnap.data();
        setAttendee(attendeeData);
        setRoundAssignments(attendeeData.roundAssignments || {});

        // Listen to all attendees to get partner updates
        const unsubscribe = onSnapshot(
          doc(db, 'events', eventId, 'signedUpUsers'),
          (snapshot) => {
            const map = {};
            snapshot.forEach((doc) => {
              map[doc.id] = doc.data();
            });
            setAllAttendees(map);
          }
        );

        // Cleanup
        window.__unsubscribeRound = unsubscribe;

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();

    return () => {
      if (window.__unsubscribeRound) window.__unsubscribeRound();
    };
  }, [eventId, navigate]);

  // Update partner and status based on roundAssignments and allAttendees
  useEffect(() => {
    if (!attendee || !allAttendees || !roundAssignments) return;
    const roundKey = `round${roundNum}`;
    const partnerId = roundAssignments[roundKey];
    if (!partnerId) {
      // No partner for this round (maybe event ended)
      setPartner(null);
      return;
    }
    const partnerData = allAttendees[partnerId];
    if (!partnerData) {
      setPartner(null);
      return;
    }
    setPartner(partnerData);
    // Determine status
    const status = partnerData.checkInStatus || 'noShow';
    setPartnerStatus(status);
    if (status === 'late' && partnerData.eta) {
      setPartnerEta(partnerData.eta);
    } else {
      setPartnerEta(null);
    }

    // Set icebreaker
    if (icebreakers.length > roundIndex) {
      setCurrentIcebreaker(icebreakers[roundIndex]);
    }
  }, [attendee, allAttendees, roundAssignments, roundNum, icebreakers]);

  // Timer logic: compute time until round end or next round start
  // We'll use event.roundStartTimes[roundIndex] and event.roundDurationSeconds
  // We'll also handle break transitions.

  // For brevity, we'll assume we have a custom hook to handle timers, but we'll implement inline.

  // Render based on partner status
  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!partner) return <div>No partner for this round.</div>;

  // Determine which screen to show
  let ScreenComponent;
  let props = { partner, roundNum, totalRounds: 8 };
  if (partnerStatus === 'onTime') {
    ScreenComponent = ActiveRoundScreen;
    props.icebreaker = currentIcebreaker;
  } else if (partnerStatus === 'late') {
    ScreenComponent = LateArrivalScreen;
    props.eta = partnerEta;
  } else {
    // noShow
    // We need next round info
    const nextRoundNum = parseInt(roundNum) + 1;
    const nextRoundKey = `round${nextRoundNum}`;
    const nextPartnerId = roundAssignments[nextRoundKey];
    const nextPartner = nextPartnerId ? allAttendees[nextPartnerId] : null;
    const nextRoundStart = event?.roundStartTimes?.[nextRoundNum - 1] || null;
    ScreenComponent = NoShowScreen;
    props.nextPartner = nextPartner;
    props.nextRoundStart = nextRoundStart;
    props.nextRoundNum = nextRoundNum;
  }

  return (
    <div className="min-h-screen bg-[#FAFFE7] flex items-center justify-center p-4">
      <ScreenComponent {...props} />
    </div>
  );
};

export default EventRound;