import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from 'react-router-dom';
import EventCard from "../DashboardHelperComponents/EventCard";
import ConnectionsTable from "../DashboardHelperComponents/ConnectionsTable";
import RemoEvent from "../DashboardHelperComponents/RemoEvent";
import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp, getCountFromServer } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import CircuitEvent from "../DashboardHelperComponents/CircuitEvent";
import { auth } from "../../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { DateTime } from 'luxon';

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
          setDatesRemaining(data.datesRemaining);
          setUserProfile(data);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const signUpEvents = [
    {
      title: "25-34 yrs old SF",
      date: "01/24/25",
      time: "5:00pm",
      menSpots: "5/10",
      womenSpots: "7/10",
      isActive: true,
    },
    {
      title: "35-44 yrs old SF",
      date: "01/27/25",
      time: "7:00pm",
      menSpots: "10/10",
      womenSpots: "10/10",
      isActive: false,
    },
    {
      title: "45-55 yrs old SF",
      date: "01/27/25",
      time: "7:00pm",
      menSpots: "4/10",
      womenSpots: "9/10",
      isActive: true,
    },
  ];

  const connections = [
    {
      id: "01",
      name: "Kelly Rachel",
      matchLevel: 65,
    },
    {
      id: "02",
      name: "Taylor Swift",
      matchLevel: 29,
    },
    {
      id: "03",
      name: "Jennifer Lopex",
      matchLevel: 48,
    },
  ];

  // Helper to check if user is signed up for an event
  const fetchSignedUpEventIds = async (eventsList, userId) => {
    const signedUpIds = new Set();
    for (const event of eventsList) {
      const signedUpUserDoc = await getDoc(doc(db, 'events', event.firestoreID, 'signedUpUsers', userId));
      if (signedUpUserDoc.exists()) {
        signedUpIds.add(event.firestoreID);
      }
    }
    return signedUpIds;
  };

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
      const eventsList = [];
      const querySnapshot = await getDocs(collection(db, "events"));
      for (const docSnapshot of querySnapshot.docs) {
        const eventData = await getEventData(docSnapshot.id);
        if (eventData) {
          eventsList.push({ ...eventData, firestoreID: docSnapshot.id });
        }
      }
      setAllEvents(eventsList);
      if (auth.currentUser) {
        const signedUpIds = await fetchSignedUpEventIds(eventsList, auth.currentUser.uid);
        setSignedUpEventIds(signedUpIds);
      }
      setLoading(false);
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
    if (datesRemaining <= 0) return;
    setDatesRemaining(prev => prev - 1);

    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      // Update remaining dates for the user
      await setDoc(userDocRef, { datesRemaining: datesRemaining - 1 }, { merge: true });

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

    // Re-fetch signed-up status
    if (auth.currentUser) {
      const signedUpIds = await fetchSignedUpEventIds(allEvents, auth.currentUser.uid);
      setSignedUpEventIds(signedUpIds);
    }
  };

  const handleMatchesClick = () => {
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
      signedUpEventIds.has(event.firestoreID)
    );
  }, [allEvents, signedUpEventIds]);

  // Show *all* events (regardless of date) that the user has not yet signed up for
  const upcomingSignupEvents = useMemo(() => {
    return allEvents.filter(event => !signedUpEventIds.has(event.firestoreID));
  }, [allEvents, signedUpEventIds]);

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
              Upcoming Events
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
                <h2 className="text-2xl font-bold">All Upcoming Events</h2>
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
                  <h2 className="text-2xl font-bold">All Sign-Up Events</h2>
                  <button className="text-gray-500 hover:text-gray-800 text-2xl" onClick={() => setShowAllSignUp(false)}>&times;</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {firebaseEvents.map((event) => (
                    <EventCard
                      key={event.firestoreID}
                      event={event}
                      type="signup"
                      userGender={userGender}
                      datesRemaining={datesRemaining}
                      onSignUp={() => handleSignUp(event)}
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