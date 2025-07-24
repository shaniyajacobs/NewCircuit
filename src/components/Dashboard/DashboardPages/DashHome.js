import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from 'react-router-dom';
import EventCard from "../DashboardHelperComponents/EventCard";
import ConnectionsTable from "../DashboardHelperComponents/ConnectionsTable";
import RemoEvent from "../DashboardHelperComponents/RemoEvent";
import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp, getCountFromServer } from "firebase/firestore";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from "../../../firebaseConfig";
import CircuitEvent from "../DashboardHelperComponents/CircuitEvent";
import { auth } from "../../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { DateTime } from 'luxon';
import { calculateAge } from '../../../utils/ageCalculator';
import { filterByGenderPreference } from '../../../utils/genderPreferenceFilter';

// Helper: map city to IANA time zone
const cityToTimeZone = {
  'Atlanta': 'America/New_York',
  'Chicago': 'America/Chicago',
  'Dallas': 'America/Chicago',
  'Houston': 'America/Chicago',
  'Los Angeles': 'America/Los_Angeles',
  'Miami': 'America/New_York',
  'New York City': 'America/New_York',
  'San Francisco': 'America/Los_Angeles',
  'Seattle': 'America/Los_Angeles',
  'Washington D.C.': 'America/New_York',
};

// Helper: map event timeZone field to IANA
const eventZoneMap = {
  'PST': 'America/Los_Angeles',
  'EST': 'America/New_York',
  'CST': 'America/Chicago',
  'MST': 'America/Denver',
  // Add more as needed
};

// Updated isEventUpcoming function
function isEventUpcoming(event, userLocation) {
  if (!event.date || !event.time || !event.timeZone) return false;

  // Parse event time zone
  let eventZone = eventZoneMap[event.timeZone] || event.timeZone || 'UTC';

  // Normalize time string to uppercase AM/PM
  const normalizedTime = event.time ? event.time.replace(/am|pm/i, match => match.toUpperCase()) : '';
  console.log('Original event.time:', event.time, '| Normalized:', normalizedTime);

  // Combine date and time (assume time is like '6:00pm' or '18:00')
  // Try both 12-hour and 24-hour formats
  let eventDateTime = DateTime.fromFormat(
    `${event.date} ${normalizedTime}`,
    'yyyy-MM-dd h:mma',
    { zone: eventZone }
  );
  if (!eventDateTime.isValid) {
    eventDateTime = DateTime.fromFormat(
      `${event.date} ${normalizedTime}`,
      'yyyy-MM-dd H:mm',
      { zone: eventZone }
    );
  }
  if (!eventDateTime.isValid) return false;

  // Add 90 minutes for event duration
  const eventEndDateTime = eventDateTime.plus({ minutes: 90 });

  // Get user's time zone from location or fallback to browser local zone
  const userZone = cityToTimeZone[userLocation] || DateTime.local().zoneName || 'UTC';
  const now = DateTime.now().setZone(userZone);

  // Compare event end time (converted to user's zone) with now
  console.log(
    `[isEventUpcoming] Event: ${event.title} | Date: ${event.date} | Time: ${event.time} | Normalized: ${normalizedTime} | EventZone: ${eventZone} | UserZone: ${userZone}\n` +
    `Parsed Start: ${eventDateTime.toString()} | Parsed End: ${eventEndDateTime.setZone(userZone).toString()} | Now: ${now.toString()}`
  );
  return eventEndDateTime.setZone(userZone) > now;
}

// Helper: check if event is joinable (has not started yet, or within 30-minute grace period)
function isEventJoinable(event, userLocation) {
  if (!event.date || !event.time || !event.timeZone) return false;
  let eventZone = eventZoneMap[event.timeZone] || event.timeZone || 'UTC';
  const normalizedTime = event.time ? event.time.replace(/am|pm/i, match => match.toUpperCase()) : '';
  let eventDateTime = DateTime.fromFormat(
    `${event.date} ${normalizedTime}`,
    'yyyy-MM-dd h:mma',
    { zone: eventZone }
  );
  if (!eventDateTime.isValid) {
    eventDateTime = DateTime.fromFormat(
      `${event.date} ${normalizedTime}`,
      'yyyy-MM-dd H:mm',
      { zone: eventZone }
    );
  }
  if (!eventDateTime.isValid) return false;
  
  // Add 30-minute grace period after event starts
  const gracePeriodEnd = eventDateTime.plus({ minutes: 30 });
  
  const userZone = cityToTimeZone[userLocation] || DateTime.local().zoneName || 'UTC';
  const now = DateTime.now().setZone(userZone);
  
  // Allow joining if within grace period (30 minutes after event starts)
  return gracePeriodEnd.setZone(userZone) > now;
}

// Add a hook to detect window width
function useResponsiveEventLimit() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile ? 4 : 6;
}

// Helper: convert emails to user IDs
async function emailsToUserIds(emails) {
  if (!emails || emails.length === 0) return [];
  const userIds = [];
  for (const email of emails) {
    const qSnap = await getDocs(collection(db, 'users'));
    const match = qSnap.docs.find(doc => doc.data().email === email);
    if (match) userIds.push(match.id);
  }
  return userIds;
}

const DashHome = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [firebaseEvents, setFirebaseEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userGender, setUserGender] = useState(null);
  const [datesRemaining, setDatesRemaining] = useState(100);
  const [userProfile, setUserProfile] = useState(null);
  // Removed redundant state; upcoming events are derived via useMemo below
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [showAllSignUp, setShowAllSignUp] = useState(false);
  const [allEvents, setAllEvents] = useState([]);
  const [signedUpEventIds, setSignedUpEventIds] = useState(new Set());
  const [signedUpEventsLoaded, setSignedUpEventsLoaded] = useState(false);
  const [connections, setConnections] = useState([]);

  // Helper: fetch IDs of events the user has signed up for from their sub-collection
  const fetchUserSignedUpEventIds = async (userId) => {
    if (!userId) return new Set();
    try {
      const signedUpCol = collection(db, 'users', userId, 'signedUpEvents');
      const snap = await getDocs(signedUpCol);
      const idSet = new Set();
      snap.forEach((d) => idSet.add(d.id)); // doc id matches event's firestoreID
      return idSet;
    } catch (err) {
      console.error('Error fetching user signed-up events:', err);
      return new Set();
    }
  };

  // Filter events to only show upcoming ones
  const getUpcomingEvents = (eventsList, userLocation) => {
    const filtered = eventsList.filter(event => isEventUpcoming(event, userLocation));
    console.log('Filtering events, input size:', eventsList.length, 'output size:', filtered.length);
    return filtered;
  };

  // Fetch user gender and datesRemaining from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserGender(data.gender);
          // Ensure datesRemaining is a finite number; default to 0 otherwise
          const fetchedRemaining = typeof data.datesRemaining === 'number'
            ? data.datesRemaining
            : Number(data.datesRemaining);
          setDatesRemaining(Number.isFinite(fetchedRemaining) ? fetchedRemaining : 0);
          setUserProfile(data);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Move fetchConnections outside useEffect so it can be called from child
  const fetchConnections = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const connsSnap = await getDocs(collection(db, 'users', user.uid, 'connections'));
    const uids = connsSnap.docs.map(d => d.id);
    const profiles = await Promise.all(
      uids.map(async (uid) => {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (!userDoc.exists()) return null;
        const data = userDoc.data();
        return {
          userId: uid,
          name: data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : data.displayName || 'Unknown',
          age: calculateAge(data.birthDate),
          image: data.image || null,
          ...data,
        };
      })
    );
    setConnections(profiles.filter(Boolean));
  };

  useEffect(() => {
    fetchConnections();
  }, [auth.currentUser]);

  // Helper to check if event is past (for sign-up: event start; for upcoming: event start + 90min)
  function isEventPast(event, addMinutes = 0) {
    if (!event.date || !event.time || !event.timeZone) return true;
    let eventZone = eventZoneMap[event.timeZone] || event.timeZone || 'UTC';
    const normalizedTime = event.time ? event.time.replace(/am|pm/i, match => match.toUpperCase()) : '';
    let eventDateTime = DateTime.fromFormat(
      `${event.date} ${normalizedTime}`,
      'yyyy-MM-dd h:mma',
      { zone: eventZone }
    );
    if (!eventDateTime.isValid) {
      eventDateTime = DateTime.fromFormat(
        `${event.date} ${normalizedTime}`,
        'yyyy-MM-dd H:mm',
        { zone: eventZone }
      );
    }
    if (!eventDateTime.isValid) return true;

    // Extend the threshold: event is considered "past" only 24 hours after it started
    let eventThreshold = eventDateTime;
    if (addMinutes) {
      eventThreshold = eventThreshold.plus({ minutes: addMinutes });
    }
    // Keep the event visible for an extra day
    eventThreshold = eventThreshold.plus({ days: 1 });

    const now = DateTime.now().setZone(eventZone);
    return eventThreshold <= now;
  }

  // Fetch events and signed-up status on page load and after sign-up
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "events"));
        const functionsInst = getFunctions();
        const getEventDataCF = httpsCallable(functionsInst, 'getEventData');

        const eventsList = await Promise.all(
          querySnapshot.docs.map(async (docSnapshot) => {
            const docData = docSnapshot.data() || {};
            const eventId = docData.eventID || docSnapshot.id; // fallback
            try {
              const res = await getEventDataCF({ eventId });
              const remoEvent = res.data?.event;
              if (remoEvent) {
                return { ...remoEvent, ...docData, firestoreID: docSnapshot.id, eventID: eventId };
              }
            } catch (err) {
              console.error(`Failed fetching Remo event for ${eventId}:`, err);
            }
            return null;
          })
        );

        const filteredEvents = eventsList.filter(Boolean);
        setAllEvents(filteredEvents);

        if (auth.currentUser) {
          const signedUpIds = await fetchUserSignedUpEventIds(auth.currentUser.uid);
          setSignedUpEventIds(signedUpIds);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [userProfile]);

  const fetchEventsFromFirebase = async () => {
    try {
      setLoading(true);
      const eventsList = [];
      const querySnapshot = await getDocs(collection(db, "events"));
      
      console.log("querySnapshot.docs", querySnapshot.docs);
      for (const docSnapshot of querySnapshot.docs) {
        try {
          const eventData = await getEventData(docSnapshot.id);
          console.log("eventData for doc", docSnapshot.id, eventData);
          if (eventData) {
            const transformedEvent = {
              ...eventData,
              firestoreID: docSnapshot.id,
            };
            eventsList.push(transformedEvent);
          }
        } catch (error) {
          console.error(`Error processing event ${docSnapshot.id}:`, error);
          eventsList.push({
            title: "TitleNotFound",
            date: "DateNotFound",
            time: "TimeNotFound",
            status: "StatusNotFound",
            action: "ActionNotFound",
            isActive: false,
            menSpots: "N/A",
            womenSpots: "N/A",
          });
        }
      }
      
      setAllEvents(eventsList); // store all fetched events
      const upcomingEventsList = getUpcomingEvents(eventsList, userProfile?.location);
      setFirebaseEvents(upcomingEventsList);
      setEvents(upcomingEventsList);
    } catch (error) {
      console.error('Error fetching events from Firebase:', error);
      setFirebaseEvents([{
        title: "N/A",
        date: "N/A",
        time: "N/A",
        status: "N/A",
        action: "N/A",
        isActive: false,
        menSpots: "N/A",
        womenSpots: "N/A",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const postNewEvent = async () => {
    try {
      const response = await fetch('https://live.remo.co/api/v1/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token: 3d7eff4be16752f1a52f8ba059b810fa',
        },
        body: JSON.stringify(RemoEvent())
      });

      // Check if the response was successful
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      // Parse the JSON response - this is an async operation
      const output = await response.json();
      console.log('API Response:', output);

      // Now you can safely access the fields
      const eventID = output.event._id;
      console.log('Event ID:', eventID);

      // Save to your database
      await setDoc(doc(db, 'events', eventID), {
        eventName: 'Test event 3',
        eventID: eventID,
        menCapacity: 10,
        womenCapacity: 10,
      });

      console.log('Event saved to database');
      return eventID; // Return the event ID if needed elsewhere
    } catch (error) {
      console.error('Error creating event:', error);
      throw error; // Re-throw to allow handling by caller
    }
  };

const getEventData = async (eventID) => {
  try {
    // Get Firestore data first
    const eventInfo = await getDoc(doc(db, 'events', eventID));

    if (eventInfo.exists()) {
      return eventInfo.data();
    } else {
      console.warn(`No Firestore document for event ID: ${eventID}`);
      return null;
    }

    // Optional: fetch Remo data AFTER confirming Firestore
    // const apiURL = `https://live.remo.co/api/v1/events/${eventID}`;
    // const response = await fetch(apiURL, {
    //   method: 'GET',
    //   headers: {
    //     accept: 'application/json',
    //     Authorization: 'Token: 3d7eff4be16752f1a52f8ba059b810fa',
    //   }
    // });
    // if (!response.ok) {
    //   const errorData = await response.json();
    //   throw new Error(`API error: ${response.status} - ${JSON.stringify(errorData)}`);
    // }

  } catch (error) {
    console.error(`Error fetching event data for ${eventID}:`, error);
    return null;
  }
};

  // Handle sign up logic
  const handleSignUp = async (event) => {
    // 🐛 DEBUGGING LOGS
    console.log("[JOIN NOW] Event:", event);
    console.log("[JOIN NOW] Event ID:", event.eventID);
    console.log("[JOIN NOW] Current user:", auth.currentUser?.uid);
    const currentRemaining = Number.isFinite(datesRemaining) ? datesRemaining : 0;
    if (currentRemaining <= 0) return;
    setDatesRemaining(prev => (Number.isFinite(prev) ? prev - 1 : 0));

    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      // Update remaining dates for the user
      await setDoc(userDocRef, { 
        datesRemaining: currentRemaining - 1, 
        latestEventId: event.eventID // <-- ensure this is set
      }, { merge: true });

      // 1. Add a document in the user's sub-collection
      await setDoc(
        doc(db, 'users', user.uid, 'signedUpEvents', event.firestoreID),
        {
          eventID: event.eventID,
          signUpTime: serverTimestamp(),
          eventTitle: event.title || null,
          eventDate: event.date || null,
          eventTime: event.time || null,
          eventLocation: event.location || null,
          eventAgeRange: event.ageRange || null,
          eventType: event.eventType || null,
        },
        { merge: true }
      );

      // 2. Add a document in the event's sub-collection
      await setDoc(
        doc(db, 'events', event.firestoreID, 'signedUpUsers', user.uid),
        {
          userID: user.uid,
          userName: userProfile && userProfile.firstName ? `${userProfile.firstName} ${userProfile.lastName || ''}`.trim() : (user.displayName || null),
          userEmail: user.email || null,
          userPhoneNumber: (userProfile && userProfile.phoneNumber) || user.phoneNumber || null,
          userGender: userGender || null,
          userLocation: (userProfile && userProfile.location) || null,
          signUpTime: serverTimestamp(),
        },
        { merge: true }
      );
    }

    // Update event signup count in Firestore
    const eventDocRef = doc(db, 'events', event.firestoreID);
    const eventDoc = await getDoc(eventDocRef);
    let updatedEvents = [...firebaseEvents];
    if (eventDoc.exists()) {
      const data = eventDoc.data();
      if (userGender && userGender.toLowerCase() === 'male') {
        const newMenSignupCount = (Number(data.menSignupCount) || 0) + 1;
        await setDoc(eventDocRef, { menSignupCount: newMenSignupCount }, { merge: true });
        // Update local state
        updatedEvents = updatedEvents.map(ev =>
          ev.firestoreID === event.firestoreID
            ? { ...ev, menSignupCount: (Number(ev.menSignupCount) || 0) + 1 }
            : ev
        );
      } else if (userGender && userGender.toLowerCase() === 'female') {
        const newWomenSignupCount = (Number(data.womenSignupCount) || 0) + 1;
        await setDoc(eventDocRef, { womenSignupCount: newWomenSignupCount }, { merge: true });
        // Update local state
        updatedEvents = updatedEvents.map(ev =>
          ev.firestoreID === event.firestoreID
            ? { ...ev, womenSignupCount: (Number(ev.womenSignupCount) || 0) + 1 }
            : ev
        );
      }
    }

    // Optimistically update local signed-up IDs when a user signs up
    setSignedUpEventIds(prev => {
      const next = new Set(prev);
      next.add(event.firestoreID);
      return next;
    });
    // Re-fetch from Firestore to confirm
    if (auth.currentUser) {
      const confirmedIds = await fetchUserSignedUpEventIds(auth.currentUser.uid);
      setSignedUpEventIds(confirmedIds);
    }
  };

  const handleMatchesClick = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // 1. Get latestEventId from user doc
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const latestEventId = userDoc.data()?.latestEventId;
    if (!latestEventId) return alert("Missing latest event ID");
    console.log('[MATCHES] latestEventId:', latestEventId);

    // 2. Find the event doc where eventID === latestEventId
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    let eventDocId = null;
    eventsSnapshot.forEach(docSnap => {
      if (docSnap.data().eventID === latestEventId) {
        eventDocId = docSnap.id;
      }
    });
    if (!eventDocId) {
      alert('Event not found for latestEventId');
      return;
    }
    console.log('[MATCHES] Found event doc ID:', eventDocId);

    // 3. Get signedUpUsers subcollection from that event doc
    const signedUpUsersCol = collection(db, 'events', eventDocId, 'signedUpUsers');
    const signedUpUsersSnap = await getDocs(signedUpUsersCol);
    const userIds = signedUpUsersSnap.docs.map(d => d.id);
    console.log('[MATCHES] User IDs from signedUpUsers:', userIds);

    // 4. Fetch quiz responses and user profiles for each user ID
    const quizResponses = [];
    const userProfiles = [];
    
    for (const uid of userIds) {
      const quizDocRef = doc(db, 'users', uid, 'quizResponses', 'latest');
      const userProfileRef = doc(db, 'users', uid);
      
      console.log(`[MATCHES] Fetching quiz and profile for user ${uid}`);
      
      const [quizDoc, userProfileDoc] = await Promise.all([
        getDoc(quizDocRef),
        getDoc(userProfileRef)
      ]);
      
      console.log(`[MATCHES] Quiz exists for user ${uid}:`, quizDoc.exists());
      console.log(`[MATCHES] Profile exists for user ${uid}:`, userProfileDoc.exists());
      
      if (quizDoc.exists()) {
        const quizData = { userId: uid, answers: quizDoc.data().answers };
        quizResponses.push(quizData);
        
        // Also store user profile data for gender preference filtering
        if (userProfileDoc.exists()) {
          userProfiles.push({
            userId: uid,
            ...userProfileDoc.data()
          });
        }
      }
    }

    // 5. Find current user's answers and profile
    const currentUserAnswers = quizResponses.find(q => q.userId === currentUser.uid)?.answers;
    const currentUserProfile = userProfiles.find(p => p.userId === currentUser.uid);
    
    if (!currentUserAnswers) {
      alert('You must complete your quiz to get matches.');
      return;
    }

    if (!currentUserProfile) {
      alert('User profile not found. Please complete your profile setup.');
      return;
    }

    // 6. Filter other users by gender preference
    const otherUsers = quizResponses.filter(q => q.userId !== currentUser.uid);
    const otherUserProfiles = userProfiles.filter(p => p.userId !== currentUser.uid);
    
    console.log('[MATCHES] Before gender filtering:', {
      totalUsers: otherUsers.length,
      currentUserProfile: {
        gender: currentUserProfile.gender,
        sexualPreference: currentUserProfile.sexualPreference
      }
    });

    // Create combined user objects with both quiz answers and profile data
    const otherUsersWithProfiles = otherUsers.map(quizUser => {
      const profile = otherUserProfiles.find(p => p.userId === quizUser.userId);
      return {
        ...quizUser,
        ...profile
      };
    });

    // Apply gender preference filtering
    const filteredUsers = filterByGenderPreference(currentUserProfile, otherUsersWithProfiles);
    
    console.log('[MATCHES] After gender filtering:', {
      filteredUsers: filteredUsers.length,
      filteredUserIds: filteredUsers.map(u => u.userId)
    });

    // 7. Run matchmaking algorithm only on filtered users
    const { getTopMatches } = await import('../../Matchmaking/Synergies.js');
    const matches = getTopMatches(currentUserAnswers, filteredUsers); // [{ userId, score }]

    console.log('[MATCHES] Final matches:', matches);

    // 8. Save matches to Firestore
    await setDoc(doc(db, 'matches', currentUser.uid), {
      timestamp: serverTimestamp(),
      results: matches
    });

    // 9. Redirect to MyMatches
    navigate('myMatches');
  };

  const handleConnectionsClick = () => {
    navigate('dashMyConnections');
  };

  const eventLimit = useResponsiveEventLimit();
  // Use the same event limit for sign-up events
  const signUpEventLimit = eventLimit;
  // Filter for upcoming and sign-up events
  const upcomingEvents = useMemo(() => {
    return allEvents.filter(event =>
      signedUpEventIds.has(event.firestoreID) && isEventUpcoming(event, userProfile?.location)
    );
  }, [allEvents, signedUpEventIds, userProfile]);

  // Show *all* events (regardless of date) that the user has not yet signed up for
  const upcomingSignupEvents = useMemo(() => {
    return allEvents.filter(event =>
      !signedUpEventIds.has(event.firestoreID) && isEventJoinable(event, userProfile?.location)
    );
  }, [allEvents, signedUpEventIds, userProfile]);

  return (
    <div>
      <div className="p-7 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)] max-sm:p-5">
        <div className="flex bg-white justify-between items-center mb-6">
          <div>
            <div className="flex flex-col gap-2">
              <button 
                onClick={handleMatchesClick}
                className="px-4 py-2 text-sm font-medium text-white bg-[#0043F1] rounded-lg hover:bg-[#0034BD] transition-colors"
              >
                You just went on a date! Here are your ai rec matches! 
              </button>
              <button 
                onClick={handleConnectionsClick}
                className="px-4 py-2 text-sm font-medium text-white bg-[#85A2F2] rounded-lg hover:opacity-90 transition-colors"
              >
                See your new connections
              </button>
            </div>
            <div className="text-xl font-semibold text-indigo-950 mt-4">
              My Upcoming Events
            </div>
          </div>
          {/* See All button for Upcoming Events */}
          <button
            className="border border-gray-400 rounded-lg px-4 py-2 text-sm font-medium text-gray-800 bg-white hover:bg-gray-100 transition-colors ml-4"
            onClick={() => setShowAllUpcoming(true)}
          >
            See all
          </button>
        </div>
        
        {/* Responsive grid for upcoming events */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white rounded-xl">
          {(upcomingEvents.slice(0, eventLimit)).map((event) => (
            <EventCard
              key={event.firestoreID}
              event={event}
              type="upcoming"
              userGender={userGender}
              datesRemaining={datesRemaining}
              onSignUp={handleSignUp}
            />
          ))}
          {loading && (
            <div className={`col-span-${eventLimit} flex items-center justify-center w-full p-8`}>
              <div className="text-lg text-gray-600">Loading events...</div>
            </div>
          )}
          {!loading && upcomingEvents.length === 0 && (
            <div className={`col-span-${eventLimit} flex items-center justify-center w-full p-8`}>
              <div className="text-lg text-gray-600">No events available</div>
            </div>
          )}
        </div>
        {/* Modal overlay for all upcoming events */}
        {showAllUpcoming && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowAllUpcoming(false)} />
            <div className="relative bg-white rounded-2xl shadow-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto p-8 z-10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">All My Upcoming Events</h2>
                <button className="text-gray-500 hover:text-gray-800 text-2xl" onClick={() => setShowAllUpcoming(false)}>&times;</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {upcomingEvents.map((event) => (
                  <EventCard
                    key={event.firestoreID}
                    event={event}
                    type="upcoming"
                    userGender={userGender}
                    datesRemaining={datesRemaining}
                    onSignUp={handleSignUp}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="p-7 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)] max-sm:p-5">
            <div className="flex justify-between items-center mb-6">
              <div className="text-xl font-semibold text-[#05004E]">
                Sign-Up for Dates
              </div>
              <div className="flex items-center gap-4">
                <button
                  className="border border-gray-400 rounded-lg px-4 py-2 text-sm font-medium text-gray-800 bg-white hover:bg-gray-100 transition-colors"
                  onClick={() => setShowAllSignUp(true)}
                >
                  See all
                </button>
                <div className="text-right font-semibold text-[#05004E]">Dates Remaining: {datesRemaining}</div>
              </div>
            </div>
            {/* Responsive grid for sign-up events */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white rounded-xl">
              {loading ? (
                <div className={`col-span-${signUpEventLimit} flex items-center justify-center w-full p-8`}>
                  <div className="text-lg text-gray-600">Loading events...</div>
                </div>
              ) : upcomingSignupEvents.length > 0 ? (
                upcomingSignupEvents.map((event) => (
                  <EventCard
                    key={event.firestoreID}
                    event={event}
                    type="signup"
                    userGender={userGender}
                    datesRemaining={datesRemaining}
                    onSignUp={() => handleSignUp(event)}
                    isJoinable={isEventJoinable(event, userProfile?.location)}
                  />
                ))
              ) : (
                <div className="flex items-center justify-center w-full p-8">
                  <div className="text-lg text-gray-600">No upcoming events available</div>
                </div>
              )}
            </div>
          </div>
          {/* Modal overlay for all sign-up events */}
          {showAllSignUp && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowAllSignUp(false)} />
              <div className="relative bg-white rounded-2xl shadow-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto p-8 z-10">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">All Events</h2>
                  <button className="text-gray-500 hover:text-gray-800 text-2xl" onClick={() => setShowAllSignUp(false)}>&times;</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {upcomingSignupEvents.map((event) => (
                    <EventCard
                      key={event.firestoreID}
                      event={event}
                      type="signup"
                      userGender={userGender}
                      datesRemaining={datesRemaining}
                      onSignUp={() => handleSignUp(event)}
                      isJoinable={isEventJoinable(event, userProfile?.location)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="p-7 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)] max-sm:p-5">
            <div className="mb-6 text-xl font-semibold text-indigo-950">
              Current Connections
            </div>
            <ConnectionsTable connections={connections} />
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
              onClick={() => fetchEventsFromFirebase()}
            >
              Refresh Events
            </button>
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors ml-2"
              onClick={() => console.log('Firebase Events:', firebaseEvents)}
            >
              Log Events
            </button>
          </div>
        </div>
      </div>
  );
};

export default DashHome;