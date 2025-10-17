import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from 'react-router-dom';
import EventCard from "../DashboardHelperComponents/EventCard";
import ConnectionsTable from "../DashboardHelperComponents/ConnectionsTable";
import RemoEvent from "../DashboardHelperComponents/RemoEvent";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, serverTimestamp, increment, query, where, onSnapshot, deleteDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from "../../../firebaseConfig";
import CircuitEvent from "../DashboardHelperComponents/CircuitEvent";
import { collectionGroup, documentId } from "firebase/firestore";
import { auth } from "../../../firebaseConfig";
import { signUpForEventWithDates } from '../../../utils/eventSpotsUtils';
import { onAuthStateChanged } from "firebase/auth";
import { DateTime } from 'luxon';
import PopUp from '../DashboardHelperComponents/PopUp';
import { calculateAge } from '../../../utils/ageCalculator';
import { filterByGenderPreference } from '../../../utils/genderPreferenceFilter';
import { formatUserName } from '../../../utils/nameFormatter';
import { sortEventsByDate, sortAndFilterUpcomingEvents } from '../../../utils/eventSorter';
import homeSelectMySparks from '../../../images/home_select_my_sparks.jpg';
import imgNoise from '../../../images/noise.png';
import homeSeeMySparks from '../../../images/home_see_my_sparks.jpg';
import homePurchaseMoreDates from '../../../images/home_purchase_more_dates.jpg';
import { ReactComponent as SmallFlashIcon } from '../../../images/small_flash.svg';
import filterIcon from '../../../images/setting-4.svg';
import { markSparkAsRead, isSparkNew, markSparkAsViewed, refreshSidebarNotification } from "../../../utils/notificationManager";
import { DashMessages } from "./DashMessages";
import xIcon from "../../../images/x.svg";
import tickCircle from "../../../images/tick-circle.svg";

const MAX_SELECTIONS = 3; // maximum matches a user can choose

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
  'PDT': 'America/Los_Angeles',
  'EST': 'America/New_York',
  'EDT': 'America/New_York',
  'CST': 'America/Chicago',
  'CDT': 'America/Chicago',
  'MST': 'America/Denver',
  'MDT': 'America/Denver',
  'UTC': 'UTC',
  'GMT': 'Europe/London',
  'BST': 'Europe/London',
  // Add more as needed
};

// Updated isEventUpcoming function
function isEventUpcoming(event, userLocation) {
  if (!event.date || !event.time || !event.timeZone) {
    console.warn('[isEventUpcoming] Rejected: missing date/time/timeZone', {
      title: event.title,
      date: event.date,
      time: event.time,
      timeZone: event.timeZone
    });
    return false;
  }

  // Parse event time zone
  let eventZone = eventZoneMap[event.timeZone] || event.timeZone || 'UTC';

  // Normalize time string to uppercase AM/PM
  const normalizedTime = event.time ? event.time.replace(/am|pm/i, match => match.toUpperCase()) : '';

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
    if (!eventDateTime.isValid) {
      console.warn('[isEventUpcoming] Rejected: could not parse event time', {
        title: event.title,
        date: event.date,
        time: event.time,
        normalizedTime,
        eventZone
      });
      return false;
    }
  }

  // Use actual endTime from Remo if available, otherwise fallback to 90 minutes
  let eventEndDateTime;
  if (event.endTime) {
    eventEndDateTime = DateTime.fromMillis(Number(event.endTime));
  } else {
    eventEndDateTime = eventDateTime.plus({ minutes: 90 });
  }

  // Get user's time zone from location or fallback to browser local zone
  const userZone = cityToTimeZone[userLocation] || DateTime.local().zoneName || 'UTC';
  const now = DateTime.now().setZone(userZone);

  // Show join button until actual event ends
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

// Helper: check if latest event was within 48 hours
async function isLatestEventWithin48Hours(userId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const latestEventId = userDoc.data()?.latestEventId;
    
    if (!latestEventId) {
      console.log('[48HOURS] No latestEventId found for user:', userId);
      return false;
    }
    
    // Use getEventData Cloud Function to get event data from Remo
    const functionsInst = getFunctions();
    const getEventDataCF = httpsCallable(functionsInst, 'getEventData');
    const res = await getEventDataCF({ eventId: latestEventId });
    
    if (!res.data?.event) {
      console.log('[48HOURS] No event data returned from getEventData:', latestEventId);
      return false;
    }
    
    const eventData = res.data.event;
    console.log('[48HOURS] Event data from getEventData:', { eventID: eventData.id, endTime: eventData.endTime, startTime: eventData.startTime });
    
    // Check if event ended within the last 48 hours
    const now = DateTime.now();
    let eventEndDateTime;
    
    if (eventData.endTime) {
      eventEndDateTime = DateTime.fromMillis(Number(eventData.endTime));
      console.log('[48HOURS] Using endTime:', eventEndDateTime.toISO());
    } else if (eventData.startTime) {
      const eventDateTime = DateTime.fromMillis(Number(eventData.startTime));
      eventEndDateTime = eventDateTime.plus({ minutes: 90 });
      console.log('[48HOURS] Using startTime + 90min:', eventEndDateTime.toISO());
    } else {
      console.log('[48HOURS] No valid time data in event');
      return false;
    }
    
    if (!eventEndDateTime || !eventEndDateTime.isValid) {
      console.log('[48HOURS] Failed to calculate event end time');
      return false;
    }
    
    const hoursSinceEvent = now.diff(eventEndDateTime, 'hours').hours;
    
    console.log('[48HOURS] Time calculation:', { 
      eventEnd: eventEndDateTime.toISO(), 
      now: now.toISO(), 
      hoursSinceEvent: Math.round(hoursSinceEvent * 100) / 100 
    });
    
    // Only show banner AFTER event has ended (positive hoursSinceEvent) and within 48 hours
    return hoursSinceEvent > 0 && hoursSinceEvent <= 48;
  } catch (error) {
    console.error('[48HOURS] Error checking event time:', error);
    return false;
  }
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
  // Fetch only mutual connections and pass to ConnectionsTable
  const [connections, setConnections] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [hasNewSpark, setHasNewSpark] = useState(false);
  const [checkingNewSparks, setCheckingNewSparks] = useState(false);
  const [hideNewSparksNotification, setHideNewSparksNotification] = useState(false);
  const [hasCouponRequestUpdate, setHasCouponRequestUpdate] = useState(false);
  const [checkingCouponRequests, setCheckingCouponRequests] = useState(false);
  const [hideCouponRequestNotification, setHideCouponRequestNotification] = useState(false);
  const [showSelectSparksCard, setShowSelectSparksCard] = useState(false);
  const [showCongratulationsModal, setShowCongratulationsModal] = useState(false);
  const [selectingMatches, setSelectingMatches] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Error modal state for informative popups (e.g., missing event)
  const [errorModal, setErrorModal] = useState({
    open: false,
    title: '',
    message: '',
  });

  // Success modal state for signup confirmation
  const [showSignUpSuccessModal, setShowSignUpSuccessModal] = useState(false);

  // Handle message click to open chat
  const handleMessageClick = (connection) => {
    setSelectedConnection(connection);
  };

  // Handle closing messages modal
  const handleCloseMessages = () => {
    setSelectedConnection(null);
  };

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

  /**
   * Fetch participant user IDs for a Remo event.
   * 1. Call CF getEventMembers → list of attendee objects.
   * 2. Extract attendee.user.email → emails[]
   * 3. Query Firestore users by email (batched 10 per 'in' query) → uid[]
   */
  const fetchEventParticipantUserIds = async (eventId) => {
    if (!eventId) return [];
    try {
      const functionsInst = getFunctions();
      const getEventMembers = httpsCallable(functionsInst, 'getEventMembers');
      const res = await getEventMembers({ eventId });

      const payload = res?.data;

      // Case 1: Cloud function already returns array of attendee objects
      if (Array.isArray(payload)) {
        const userIds = await emailsToUserIds(payload.map((att) => att?.user?.email).filter(Boolean));
        return userIds;
      }

      // Case 2: Object wrapper with attendees array
      if (payload && Array.isArray(payload.attendees)) {
        const userIds = await emailsToUserIds(payload.attendees.map((att) => att?.user?.email).filter(Boolean));
        return userIds;
      }

      // Case 3: Object wrapper with precomputed emails array
      if (payload && Array.isArray(payload.emails)) {
        const userIds = await emailsToUserIds(payload.emails.filter(Boolean));
        return userIds;
      }

      console.warn('fetchEventParticipantEmails: Unexpected response format', payload);
      return [];
    } catch (err) {
      console.error('Error fetching event participant emails:', err);
      return [];
    }
  };

  /**
   * Helper to map an array of emails → array of Firebase user document IDs
   */
  const emailsToUserIds = async (emails) => {
    if (!Array.isArray(emails) || emails.length === 0) return [];

    const uidSet = new Set();
    // Firestore 'in' queries accept max 10 values
    for (let i = 0; i < emails.length; i += 10) {
      const slice = emails.slice(i, i + 10);
      const q = query(collection(db, 'users'), where('email', 'in', slice));
      const snap = await getDocs(q);
      snap.forEach((docSnap) => {
        const uid = docSnap.id;
        if (auth.currentUser && uid === auth.currentUser.uid) return; // skip self
        uidSet.add(uid);
      });
    }

    return Array.from(uidSet);
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

          // Only show the 'Select my sparks' card if latest event was within 48 hours
          const within48 = await isLatestEventWithin48Hours(user.uid);
          setShowSelectSparksCard(within48);

          // Start polling every 60s to auto-hide banner after 48h passes
          const interval = setInterval(async () => {
            const stillWithin48 = await isLatestEventWithin48Hours(user.uid);
            setShowSelectSparksCard(stillWithin48);
          }, 60000);
          // store interval on window to clear on unmount or auth change
          window.__selectSparksPoller && clearInterval(window.__selectSparksPoller);
          window.__selectSparksPoller = interval;
        }
      }
    });
    return () => {
      if (window.__selectSparksPoller) clearInterval(window.__selectSparksPoller);
      unsubscribe();
    };
  }, []);

  const fetchConnections = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoadingConnections(true);
    setCheckingNewSparks(true);
    try {
      const connsSnap = await getDocs(collection(db, 'users', user.uid, 'connections'));
      const uids = connsSnap.docs.map(d => d.id);
      const profiles = await Promise.all(
        uids.map(async (uid) => {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (!userDoc.exists()) return null;
          const data = userDoc.data();
          const connectionDoc = await getDoc(doc(db, 'users', user.uid, 'connections', uid));
          const connectionData = connectionDoc.exists() ? connectionDoc.data() : {};
          if (connectionData.status !== 'mutual') return null;
          return {
            userId: uid,
            name: formatUserName(data),
            age: calculateAge(data.birthDate),
            image: data.image || null,
            compatibility: Math.round(connectionData.matchScore || 0),
            ...data,
          };
        })
      );
      const filteredProfiles = profiles.filter(Boolean);
      setConnections(filteredProfiles);

      // Check for new sparks using the notification manager
      const connectionsWithNewFlag = await Promise.all(
        filteredProfiles.map(async (conn) => {
          const isNew = await isSparkNew(conn.userId);
          return {
            ...conn,
            isNewSpark: isNew
          };
        })
      );

      setConnections(connectionsWithNewFlag);
      setHasNewSpark(connectionsWithNewFlag.some(conn => conn.isNewSpark));
      
      // Note: We don't hide the select sparks card here anymore
      // The MAX_SELECTIONS limit is enforced during the selection process in SeeAllMatches
    } catch (err) {
      console.error('Error fetching connections:', err);
      setConnections([]);
      setHasNewSpark(false);
    } finally {
      setLoadingConnections(false);
      setCheckingNewSparks(false);
    }
  };

  // Function to check for coupon request updates
  const checkCouponRequestUpdates = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    setCheckingCouponRequests(true);
    try {
      // Get all coupons
      const couponsRef = collection(db, 'coupons');
      const couponsSnapshot = await getDocs(couponsRef);
      
      let hasUpdate = false;
      
      // Check each coupon for redemption requests involving this user (as requester or date partner)
      for (const couponDoc of couponsSnapshot.docs) {
        const redemptionsRef = collection(db, 'coupons', couponDoc.id, 'redemptions');
        const redemptionsQuery = query(redemptionsRef, where('status', 'in', ['approved', 'rejected']));
        const redemptionsSnapshot = await getDocs(redemptionsQuery);
        
        for (const redemptionDoc of redemptionsSnapshot.docs) {
          const redemptionData = redemptionDoc.data();
          
          // Check if current user is either the requester or the date partner
          const isRequester = redemptionData.redeemedBy === user.uid;
          const isDatePartner = redemptionData.date1?.partnerId === user.uid || redemptionData.date2?.partnerId === user.uid;
          
          if (isRequester || isDatePartner) {
            hasUpdate = true;
            break;
          }
        }
        
        if (hasUpdate) break;
      }
      
      setHasCouponRequestUpdate(hasUpdate);
    } catch (error) {
      console.error('Error checking coupon request updates:', error);
      setHasCouponRequestUpdate(false);
    } finally {
      setCheckingCouponRequests(false);
    }
  };

  useEffect(() => {
    fetchConnections();
    checkCouponRequestUpdates();
    
    // Set up real-time listener for coupon request updates
    const user = auth.currentUser;
    if (!user) return;
    
    const unsubscribe = onSnapshot(collection(db, 'coupons'), async (snapshot) => {
      // Check for updates when coupon data changes
      await checkCouponRequestUpdates();
    });
    
    return () => unsubscribe();
  }, [auth.currentUser]);

  // Check for congratulations modal on component mount
  useEffect(() => {
    const shouldShowCongratulations = localStorage.getItem('showCongratulationsModal');
    if (shouldShowCongratulations === 'true') {
      setShowCongratulationsModal(true);
      localStorage.removeItem('showCongratulationsModal'); // Clear the flag
    }
  }, []);



  // Centralized event loader so we can reuse for initial mount and Refresh button
  const loadEvents = async () => {
    setLoading(true);
    try {
      // Pull all events from Firestore
      const querySnapshot = await getDocs(collection(db, "events"));

      // Cloud Function to merge Remo data
      const functionsInst = getFunctions();
      const getEventDataCF = httpsCallable(functionsInst, "getEventData");

      const eventsList = await Promise.all(
        querySnapshot.docs.map(async (docSnapshot) => {
          const docData = docSnapshot.data() || {};
          const eventId = docData.eventID || docSnapshot.id; // fallback
          try {
            const res = await getEventDataCF({ eventId });
            const remoEvent = res.data?.event;
            if (remoEvent) {
              const finalTitle = remoEvent.name || remoEvent.title || docData.title || docData.eventName || 'Untitled';
              // If Remo's startTime is present, extract date, time, and timeZone from it
              let date = docData.date || null;
              let time = docData.time || null;
              let timeZone = docData.timeZone || null;
              if (remoEvent.startTime) {
                const dt = DateTime.fromMillis(Number(remoEvent.startTime));
                if (dt.isValid) {
                  date = dt.toFormat('yyyy-MM-dd');
                  time = dt.toFormat('h:mma');
                  timeZone = dt.zoneName;
                }
              } else {
                // fallback to Remo's date/time/timeZone fields if present
                date = remoEvent.date || date;
                time = remoEvent.time || time;
                timeZone = remoEvent.timeZone || timeZone;
              }
              const eventObj = {
                ...remoEvent,
                ...docData, // Firebase fields override Remo for all other fields
                title: finalTitle,
                eventType: docData.eventType || docData.type || remoEvent.eventType,
                firestoreID: docSnapshot.id,
                eventID: eventId,
                date,
                time,
                timeZone,
              };
              console.log('[ALL EVENTS] Event loaded:', eventObj);
              return eventObj;
            }
          } catch (err) {
            console.error(`Failed fetching Remo event for ${eventId}:`, err);
          }
          return null;
        })
      );

      const filteredEvents = eventsList.filter(Boolean);
      console.log('[ALL EVENTS] Fetched events:', eventsList, 'events');
      console.log('[ALL EVENTS] Filtered events:', filteredEvents);
      // Sort events chronologically from newest to oldest
      const sortedEvents = sortEventsByDate(filteredEvents);
      console.log('[ALL EVENTS] Sorted events:', sortedEvents);
      setAllEvents(sortedEvents);

      // Upcoming-filter based on user location (already sorted)
      const upcoming = getUpcomingEvents(sortedEvents, userProfile?.location);
      console.log('[ALL EVENTS] Upcoming events:', upcoming);
      setFirebaseEvents(upcoming);
      setEvents(upcoming);

      // Signed-up IDs to highlight joined events
      if (auth.currentUser) {
        const signedUpIds = await fetchUserSignedUpEventIds(auth.currentUser.uid);
        console.log('[ALL EVENTS] Signed up event IDs:', signedUpIds);
        setSignedUpEventIds(signedUpIds);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch events and signed-up status on page load and after sign-up
  useEffect(() => {
    if (userProfile) {
      loadEvents();
    }
  }, [userProfile]);

  // Manual refresh button now uses the same loader
  const fetchEventsFromFirebase = async () => {
    await loadEvents();
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
    console.log("[JOIN NOW] Event:", event);
    console.log("[JOIN NOW] Event ID:", event.eventID);
    console.log("[JOIN NOW] Current user:", auth.currentUser?.uid);
    
    const currentRemaining = Number.isFinite(datesRemaining) ? datesRemaining : 0;
    if (currentRemaining <= 0) {
      console.log('[JOIN NOW] No dates remaining - cannot sign up');
      return { 
        success: false, 
        message: 'You have no date credits remaining. Please purchase date credits in the shop tab to register for date events.',
        showError: true 
      };
    }

    const user = auth.currentUser;
    if (!user) {
      console.error('[JOIN NOW] No authenticated user found');
      return { 
        success: false, 
        message: 'Please log in to join events.',
        showError: true 
      };
    }

    try {
      // Use combined transaction-based signup with dates update
      const userData = {
        userName: userProfile && userProfile.firstName ? `${userProfile.firstName} ${userProfile.lastName || ''}`.trim() : (user.displayName || null),
        userEmail: user.email || null,
        userPhoneNumber: (userProfile && userProfile.phoneNumber) || user.phoneNumber || null,
        userGender: userGender || null,
        userLocation: (userProfile && userProfile.location) || null,
      };

      const result = await signUpForEventWithDates(event.firestoreID, user.uid, userData, -1);
      
      if (result.success) {
        // Add a document in the user's sub-collection
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

        // Add user to Remo event
        try {
          const functionsInst = getFunctions();
          const addUserToRemoEvent = httpsCallable(functionsInst, 'addUserToRemoEvent');
          await addUserToRemoEvent({ 
            eventId: event.eventID, 
            userEmail: user.email 
          });
          console.log('✅ User added to Remo event successfully');
        } catch (error) {
          console.error('❌ Failed to add user to Remo event:', error);
        }

        // Update local state with transaction results
        setDatesRemaining(result.newDates);
        setSignedUpEventIds(prev => {
          const next = new Set(prev);
          next.add(event.firestoreID);
          return next;
        });

        console.log('✅ Event signup completed successfully');
        setShowSignUpSuccessModal(true);
        return { success: true, message: 'Event signup completed successfully', showSuccess: true };
      } else {
        console.log('❌ Signup failed - result.success is false:', result);
        return { 
          success: false, 
          message: result.message || 'Failed to sign up for event. Please try again.',
          showError: true,
          showSuccess: false
        };
      }
    } catch (error) {
      console.error('❌ Error during event signup:', error);
      // Don't show alert for capacity errors since users should see waitlist button
      if (!error.message.includes('Event is full for')) {
        // Return error details to EventCard instead of showing modal here
        return { 
          success: false, 
          message: error.message || 'Failed to sign up for event. Please try again.',
          showError: true 
        };
      }
      return { success: false, message: 'Failed to sign up for event. Please try again.' };
    }
  };

  // Runs once to fix UI + Remo after waitlist promotion
  const reconcileUserEventState = async ({ force = false } = {}) => {
    const user = auth.currentUser;
    if (!user) return;
  
    try {
      // A) current signedUpEvents
      const mySignedUpSnap = await getDocs(collection(db, 'users', user.uid, 'signedUpEvents'));
      const mySignedUpSet = new Set(mySignedUpSnap.docs.map(d => d.id));
  
      // B) promotions across events via field filter (not documentId)
      const cgQ = query(collectionGroup(db, 'signedUpUsers'), where('userID', '==', user.uid));
      const cgSnap = await getDocs(cgQ);
  
      for (const suDoc of cgSnap.docs) {
        const eventRef = suDoc.ref.parent.parent; // events/{eventId}
        if (!eventRef) continue;
        const eventFirestoreId = eventRef.id;
  
        if (!mySignedUpSet.has(eventFirestoreId)) {
          const eventSnap = await getDoc(eventRef);
          if (!eventSnap.exists()) continue;
          const e = eventSnap.data() || {};
  
          await setDoc(
            doc(db, 'users', user.uid, 'signedUpEvents', eventFirestoreId),
            {
              eventID: e.eventID || eventFirestoreId,
              signUpTime: serverTimestamp(),
              eventTitle: e.title || e.eventName || null,
              eventDate: e.date || null,
              eventTime: e.time || null,
              eventLocation: e.location || null,
              eventAgeRange: e.ageRange || null,
              eventType: e.eventType || null,
            },
            { merge: true }
          );
  
          mySignedUpSet.add(eventFirestoreId);
  
          await setDoc(
            doc(db, 'users', user.uid),
            { latestEventId: e.eventID || eventFirestoreId },
            { merge: true }
          );
        }
      }
  
      // C) Ensure Remo enrollment (unchanged)
      const fn = getFunctions();
      const getEventMembers = httpsCallable(fn, 'getEventMembers');
      const addUserToRemoEvent = httpsCallable(fn, 'addUserToRemoEvent');
      const myEmail = (user.email || '').toLowerCase();
  
      for (const eventFirestoreId of mySignedUpSet) {
        const evSnap = await getDoc(doc(db, 'events', eventFirestoreId));
        if (!evSnap.exists()) continue;
        const e = evSnap.data() || {};
        const remoEventId = e.eventID;
        if (!remoEventId || !myEmail) continue;
  
        try {
          const res = await getEventMembers({ eventId: remoEventId });
          const payload = res?.data;
          const attendees = Array.isArray(payload) ? payload : (payload?.attendees || []);
          const emails = attendees.map(a => a?.user?.email).filter(Boolean).map(x => x.toLowerCase());
  
          if (!emails.includes(myEmail)) {
            await addUserToRemoEvent({ eventId: remoEventId, userEmail: myEmail });
          }
        } catch (err) {
          console.warn('Remo reconcile failed for', remoEventId, err);
        }
      }
  
      setSignedUpEventIds(new Set(mySignedUpSet));
    } catch (e) {
      console.warn('reconcileUserEventState error:', e);
    }
  };
  

useEffect(() => {
  if (userProfile && auth.currentUser) {
    // after profile is ready, fix any missing links + Remo
    reconcileUserEventState();
  }
}, [userProfile]);


useEffect(() => {
  if (!auth.currentUser || !userProfile) return;

  const q = query(
    collectionGroup(db, 'signedUpUsers'),
    where('userID', '==', auth.currentUser.uid) // 👈 field match
  );

  const unsub = onSnapshot(q, (snap) => {
    if (!snap.empty) {
      reconcileUserEventState({ force: true }); // run immediately
    }
  });

  return () => unsub();
}, [userProfile, auth.currentUser]);


  const handleMatchesClick = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('[DASHHOME] No authenticated user found');
      setSelectingMatches(false);
      return;
    }

    try {
      console.log('[DASHHOME] handleMatchesClick started');
      setSelectingMatches(true);

    // 1. Get latestEventId from user doc
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const latestEventId = userDoc.data()?.latestEventId;
    if (!latestEventId) {
      setErrorModal({
        open: true,
        title: "No Event Found",
        message: "You have not joined any events yet, or the event you are trying to access does not exist.",
      });
      setSelectingMatches(false);
      return;
    }
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
        console.log('[DASHHOME] Event not found, showing error modal');
        setErrorModal({
          open: true,
          title: "Event Not Found",
          message: "The event you are trying to access could not be found. It may have been removed or is no longer available.",
        });
        setSelectingMatches(false);
        return;
      }
      console.log('[DASHHOME] Found event doc ID:', eventDocId);

      // 3. Get signedUpUsers subcollection from that event doc
      const signedUpUsersCol = collection(db, 'events', eventDocId, 'signedUpUsers');
      const signedUpUsersSnap = await getDocs(signedUpUsersCol);
      const userIds = signedUpUsersSnap.docs.map(d => d.id);
      console.log('[DASHHOME] User IDs from signedUpUsers:', userIds);

      // 4. Get existing connections to preserve compatibility scores
      const existingConnectionsSnap = await getDocs(collection(db, 'users', currentUser.uid, 'connections'));
      const existingConnections = {};
      existingConnectionsSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.status === 'mutual' && data.matchScore) {
          existingConnections[doc.id] = data.matchScore;
        }
      });
      console.log('[DASHHOME] Existing connections with scores:', existingConnections);

      // 5. Fetch quiz responses and user profiles for each user ID
      const quizResponses = [];
      const userProfiles = [];
      
      for (const uid of userIds) {
        const quizDocRef = doc(db, 'users', uid, 'quizResponses', 'latest');
        const userProfileRef = doc(db, 'users', uid);
        
        console.log(`[DASHHOME] Fetching quiz and profile for user ${uid}`);
        
        const [quizDoc, userProfileDoc] = await Promise.all([
          getDoc(quizDocRef),
          getDoc(userProfileRef)
        ]);
        
        console.log(`[DASHHOME] Quiz exists for user ${uid}:`, quizDoc.exists());
        console.log(`[DASHHOME] Profile exists for user ${uid}:`, userProfileDoc.exists());
        
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

      // Always add current user's quiz and profile if not already present
      if (!quizResponses.find(q => q.userId === currentUser.uid)) {
        const myQuizDocRef = doc(db, 'users', currentUser.uid, 'quizResponses', 'latest');
        const myProfileRef = doc(db, 'users', currentUser.uid);
        const [myQuizDoc, myProfileDoc] = await Promise.all([
          getDoc(myQuizDocRef),
          getDoc(myProfileRef)
        ]);
        if (myQuizDoc.exists()) {
          quizResponses.push({ userId: currentUser.uid, answers: myQuizDoc.data().answers });
        }
        if (myProfileDoc.exists()) {
          userProfiles.push({ userId: currentUser.uid, ...myProfileDoc.data() });
        }
      }

      // 6. Find current user's answers and profile
      const currentUserAnswers = quizResponses.find(q => q.userId === currentUser.uid)?.answers;
      const currentUserProfile = userProfiles.find(p => p.userId === currentUser.uid);
      
      if (!currentUserAnswers) {
  console.log('[DASHHOME] No quiz answers found for current user');
  alert('You must complete your quiz to get matches.');
  setSelectingMatches(false);
  return;
      }

      if (!currentUserProfile) {
  console.log('[DASHHOME] No user profile found for current user');
  alert('User profile not found. Please complete your profile setup.');
  setSelectingMatches(false);
  return;
      }

      // 7. Filter other users by gender preference
      const otherUsers = quizResponses.filter(q => q.userId !== currentUser.uid);
      const otherUserProfiles = userProfiles.filter(p => p.userId !== currentUser.uid);
      
      console.log('[DASHHOME] Before gender filtering:', {
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
      
      console.log('[DASHHOME] After gender filtering:', {
        filteredUsers: filteredUsers.length,
        filteredUserIds: filteredUsers.map(u => u.userId)
      });

      // 8. Run matchmaking algorithm only on filtered users
      const { getTopMatches } = await import('../../Matchmaking/Synergies.js');
      const newMatches = getTopMatches(currentUserAnswers, filteredUsers); // [{ userId, score }]

      console.log('[DASHHOME] New matches:', newMatches);

      // 9. Merge new matches with existing connections, preserving existing scores
      const mergedMatches = [...newMatches];
      
      // Add existing connections that weren't in the new matches
      Object.keys(existingConnections).forEach(userId => {
        const existsInNewMatches = newMatches.some(match => match.userId === userId);
        if (!existsInNewMatches) {
          mergedMatches.push({
            userId: userId,
            score: existingConnections[userId]
          });
        }
      });

      console.log('[DASHHOME] Merged matches (preserving existing scores):', mergedMatches);

      // 10. Save merged matches to Firestore
      await setDoc(doc(db, 'matches', currentUser.uid), {
        timestamp: serverTimestamp(),
        results: mergedMatches
      });

    // 9. Redirect to MyMatches
    navigate('myMatches');
    } catch (error) {
      console.error('[DASHHOME] Error in handleMatchesClick:', error);
      setSelectingMatches(false);
      // Fallback: try to navigate directly even if matchmaking fails
      try {
        console.log('[DASHHOME] Attempting fallback navigation to myMatches');
        navigate('/dashboard/myMatches');
      } catch (navError) {
        console.error('[DASHHOME] Fallback navigation also failed:', navError);
        setErrorModal({
          open: true,
          title: "Error",
          message: "An error occurred while processing your matches. Please try again.",
        });
      }
    }
  };

  // Simple direct navigation function as backup
  const handleDirectMatchesClick = () => {
    console.log('[DASHHOME] Direct navigation to myMatches');
    navigate('/dashboard/myMatches');
  };

  const handleConnectionsClick = () => {
    navigate('dashMyConnections');
  };

  const handleCouponRequestsClick = () => {
    navigate('dashMyCoupons');
  };

  const handlePurchaseMoreDatesClick = () => {
    navigate('/dashboard/dashDateCalendar');
  };

  // Use the same event limit for sign-up events
  const signUpEventLimit = useResponsiveEventLimit();
  // Filter for upcoming and sign-up events (already sorted by date)
  const upcomingEvents = useMemo(() => {
    if (!userProfile?.location) return [];
    const filtered = allEvents.filter(event =>
      signedUpEventIds.has(event.firestoreID) && isEventUpcoming(event, userProfile.location)
    );
    // Ensure they remain sorted (should already be sorted from loadEvents)
    return sortEventsByDate(filtered);
  }, [allEvents, signedUpEventIds, userProfile?.location]);

  // Show *all* events (regardless of date) that the user has not yet signed up for (sorted by date)
  const upcomingSignupEvents = useMemo(() => {
    const filtered = allEvents.filter(event => {
      // Exclude events the user has already signed up for
      if (signedUpEventIds.has(event.firestoreID)) {
        return false;
      }

      // Only show events in the user's city/location
      if (!event.location || !userProfile?.location) return false;
      if (event.location.trim().toLowerCase() !== userProfile.location.trim().toLowerCase()) {
        return false;
      }

      // Use isEventUpcoming for filtering
      const isUpcoming = isEventUpcoming(event, userProfile.location);
      console.log('[upcomingSignupEvents] Event:', event.title, '| isUpcoming:', isUpcoming);
      if (!isUpcoming) {
        return false;
      }

      // If we get here, the event is available for sign-up, upcoming, and in the user's city
      return true;
    });
    // Ensure they remain sorted (should already be sorted from loadEvents)
    return sortEventsByDate(filtered);
  }, [allEvents, signedUpEventIds, userProfile?.location]);

  return (
    <div>
      <div className="px-7 py-4 sm:px-7 sm:py-4 md:px-7 md:py-6 lg:px-7 lg:py-8 xl:px-7 xl:py-12 2xl:px-7 2xl:py-12 bg-white border border-[rgba(33,31,32,0.10)] border-solid max-sm:px-5 max-sm:py-4">
        {/* Inner container with max-width and centering */}
        <div className="max-w-[1340px] mx-auto">
          {/* Add responsive gaps between major sections */}
          <div className="flex flex-col gap-[18px] sm:gap-[24px] xl:gap-[32px] 2xl:gap-[50px]">
            
            {/* Welcome back heading */}
            <h2
              className="
                font-semibold
                text-[#211F20]
                leading-[110%]
                font-bricolage
                text-[32px] sm:text-[40px] md:text-[48px]
              "
            >
              Welcome back, {userProfile?.firstName}
            </h2>

            {/* Select my sparks card - always visible (48 hour filter disabled) */}
            {showSelectSparksCard && (
            <div className="relative w-full rounded-2xl overflow-hidden min-h-[103px] flex items-center">
              <img src={homeSelectMySparks} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <img src={imgNoise} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ mixBlendMode: 'soft-light' }} />
              <div className="absolute inset-0 bg-[#211F20] bg-opacity-10" 
                  style={{
                    background: `
                      linear-gradient(180deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.50) 100%),
                      linear-gradient(0deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.30) 100%),
                      linear-gradient(0deg, rgba(226,255,101,0.25) 0%, rgba(226,255,101,0.25) 100%)
                    `
                  }}/>
              <div className="relative z-10 flex flex-col items-start p-6">
                <span
                  className="
                    flex items-center
                    font-medium
                    text-white
                    leading-[130%]
                    font-bricolage
                    text-[14px] sm:text-[16px] lg:text-[20px] 2xl:text-[24px]
                    mb-4
                  "
                >
                  <SmallFlashIcon className="w-6 h-6 mr-2" />
                  You just went on a date! Choose up to 3 connections. We’ll let you know if the spark is mutual.
                </span>
                <button
                  onClick={handleMatchesClick}
                  disabled={selectingMatches}
                  className={`bg-[#E2FF65] text-[#211F20] font-semibold rounded-md px-6 py-2 text-base shadow-none transition ${
                    selectingMatches 
                      ? 'opacity-60 cursor-not-allowed' 
                      : 'hover:bg-[#d4f85a]'
                  }`}
                >
                  {selectingMatches ? 'Loading…' : 'Select My Connections'}
                </button>

              </div>
            </div>
            )}


            {/* See my sparks card */}
            {checkingNewSparks ? null : (hasNewSpark && !hideNewSparksNotification) && (
              <div className="relative w-full rounded-2xl overflow-hidden min-h-[103px] flex items-center mb-6">
                <img src={homeSeeMySparks} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <img src={imgNoise} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ mixBlendMode: 'soft-light' }} />
                <div className="absolute inset-0 bg-[#211F20] bg-opacity-10"
                  style={{
                    background: `
                      linear-gradient(180deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.50) 100%),
                      linear-gradient(0deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.30) 100%),
                      linear-gradient(0deg, rgba(226,255,101,0.25) 0%, rgba(226,255,101,0.25) 100%)
                    `
                  }}
                />
                {/* X icon in top-right corner */}
                <div className="absolute top-4 right-4 z-20 cursor-pointer" onClick={() => setHideNewSparksNotification(true)}>
                  <img src={xIcon} alt="Close" className="w-6 h-6 filter brightness-0 invert" />
                </div>
                <div className="relative z-10 flex flex-col items-start p-6">
                  <span
                    className="flex items-center font-medium text-white leading-[130%] font-bricolage text-[14px] sm:text-[16px] lg:text-[20px] 2xl:text-[24px] mb-4"
                  >
                    <SmallFlashIcon className="w-6 h-6 mr-2" />
                    You've got new sparks! Send them a quick message.
                  </span>
                  <button
                    onClick={handleConnectionsClick}
                    className="bg-[#E2FF65] text-[#211F20] font-semibold rounded-md px-6 py-2 text-base shadow-none hover:bg-[#d4f85a] transition"
                  >
                    See my sparks
                  </button>
                </div>
              </div>
            )}

            {/* Coupon Request Updates Notification */}
            {checkingCouponRequests ? null : (hasCouponRequestUpdate && !hideCouponRequestNotification) && (
              <div className="relative w-full rounded-2xl overflow-hidden min-h-[103px] flex items-center mb-6">
                <img src={homeSeeMySparks} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <img src={imgNoise} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ mixBlendMode: 'soft-light' }} />
                <div className="absolute inset-0 bg-[#211F20] bg-opacity-10"
                  style={{
                    background: `
                      linear-gradient(180deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.50) 100%),
                      linear-gradient(0deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.30) 100%),
                      linear-gradient(0deg, rgba(255,193,7,0.25) 0%, rgba(255,193,7,0.25) 100%)
                    `
                  }}
                />
                {/* X icon in top-right corner */}
                <div className="absolute top-4 right-4 z-20 cursor-pointer" onClick={() => setHideCouponRequestNotification(true)}>
                  <img src={xIcon} alt="Close" className="w-6 h-6 filter brightness-0 invert" />
                </div>
                <div className="relative z-10 flex flex-col items-start p-6">
                  <span
                    className="flex items-center font-medium text-white leading-[130%] font-bricolage text-[14px] sm:text-[16px] lg:text-[20px] 2xl:text-[24px] mb-4"
                  >
                    <SmallFlashIcon className="w-6 h-6 mr-2" />
                    Your coupon request has been updated! Check the status.
                  </span>
                  <button
                    onClick={handleCouponRequestsClick}
                    className="bg-[#FFC107] text-[#211F20] font-semibold rounded-md px-6 py-2 text-base shadow-none hover:bg-[#FFB300] transition"
                  >
                    View My Coupons
                  </button>
                </div>
              </div>
            )}

            {/* Upcoming Events Section */}
            <div>
              <div className="flex bg-white justify-between items-center mb-6">
                <h6
                  className="
                    font-medium
                    text-[#211F20]
                    leading-[100%]
                    font-bricolage
                    text-[18px] md:text-[20px] xl:text-[28px] 2xl:text-[32px] mt-4
                  "
                >
                  Upcoming Events
                </h6>
                {/* See All button and filter icon for Upcoming Events */}
                <div className="flex items-center gap-2 sm:gap-2 md:gap-3 lg:gap-4">
                  <button
                    className="
                      flex justify-center items-center
                      px-5 py-2 sm:px-5 sm:py-2 md:px-6 md:py-2.5 lg:px-6 lg:py-2.5
                      text-sm font-medium text-gray-800 bg-white
                      border border-[rgba(33,31,32,0.50)] rounded
                      hover:bg-gray-100 transition-colors
                    "
                    onClick={() => setShowAllUpcoming(true)}
                  >
                    See all
                  </button>
                  <div className="
                    flex justify-center items-center
                    px-2 py-2 sm:px-2 sm:py-2 md:px-2 md:py-2 lg:px-2 lg:py-2
                    border border-[rgba(33,31,32,0.25)] rounded
                    bg-white
                  ">
                    <img src={filterIcon} alt="Filter" className="w-5 h-5" />
                  </div>
                </div>
              </div>
              
              {/* Responsive grid for upcoming events */}
              <div className="
                grid gap-4 sm:gap-4 md:gap-5 lg:gap-6 bg-white rounded-xl w-full
                grid-cols-1 
                md:grid-cols-1 
                lg:grid-cols-3 
                xl:grid-cols-3
                auto-rows-fr
              ">
                {/* Show max 6 cards */}
                {(upcomingEvents.slice(0, 6)).map((event) => (
                  <EventCard
                    key={event.firestoreID}
                    event={event}
                    type="upcoming"
                    userGender={userGender}
                    datesRemaining={datesRemaining}
                  />
                ))}
                {loading && (
                  <div className="col-span-full flex items-center justify-center w-full p-8">
                    <div className="text-lg text-gray-600">Loading events...</div>
                  </div>
                )}
                {!loading && upcomingEvents.length === 0 && (
                  <div className="col-span-full flex items-center justify-center w-full p-8">
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
                      {/* Show ALL upcoming events (no slice limit) */}
                      {upcomingEvents.map((event) => (
                        <EventCard
                          key={event.firestoreID}
                          event={event}
                          type="upcoming"
                          userGender={userGender}
                          datesRemaining={datesRemaining}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sign-Up for Dates Section */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h6
                  className="
                    font-medium
                    text-[#211F20]
                    leading-none
                    font-bricolage
                    text-[18px] md:text-[20px] xl:text-[28px] 2xl:text-[32px]
                  "
                >
                  Sign-Up for Dates
                </h6>
                <div className="flex items-center gap-2 sm:gap-2 md:gap-3 lg:gap-4">
                  <button
                    className="
                      flex justify-center items-center
                      px-5 py-2 sm:px-5 sm:py-2 md:px-6 md:py-2.5 lg:px-6 lg:py-2.5
                      text-sm font-medium text-gray-800 bg-white
                      border border-[rgba(33,31,32,0.50)] rounded
                      hover:bg-gray-100 transition-colors
                    "
                    onClick={() => setShowAllSignUp(true)}
                  >
                    See all
                  </button>
                  <div className="
                    flex justify-center items-center
                    px-2 py-2 sm:px-2 sm:py-2 md:px-2 md:py-2 lg:px-2 lg:py-2
                    border border-[rgba(33,31,32,0.25)] rounded
                    bg-white
                  ">
                    <img src={filterIcon} alt="Filter" className="w-5 h-5" />
                  </div>
                </div>
              </div>
              
              {/* Purchase more dates card */}
              <div className="relative w-full rounded-2xl overflow-hidden min-h-[103px] flex items-center mb-6">
                <img src={homePurchaseMoreDates} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <img src={imgNoise} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ mixBlendMode: 'soft-light' }} />
                <div className="absolute inset-0 bg-[#211F20] bg-opacity-10" 
                    style={{
                      background: `
                        linear-gradient(180deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.50) 100%),
                        linear-gradient(0deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.30) 100%),
                        linear-gradient(0deg, rgba(226,255,101,0.25) 0%, rgba(226,255,101,0.25) 100%)
                      `
                    }}/>
                <div className="relative z-10 flex flex-col items-start p-6">
                  <span
                  className="
                    flex items-center
                    font-medium
                    text-white
                    leading-[130%]
                    font-bricolage
                    text-[14px] sm:text-[16px] lg:text-[20px] 2xl:text-[24px]
                    mb-4
                  "
                >
                    Date credits remaining: {datesRemaining}
                  </span>
                  <button
                    onClick={handlePurchaseMoreDatesClick}
                    className="bg-[#E2FF65] text-[#211F20] font-semibold rounded-md px-6 py-2 text-base shadow-none hover:bg-[#d4f85a] transition"
                  >
                    Purchase more dates
                  </button>
                </div>
              </div>
              
              {/* Responsive grid for sign-up events */}
              <div className="
                grid gap-4 sm:gap-4 md:gap-5 lg:gap-6 bg-white rounded-xl w-full
                grid-cols-1 
                md:grid-cols-1 
                lg:grid-cols-3 
                xl:grid-cols-3
                auto-rows-fr
              ">
                {loading ? (
                  <div className="col-span-full flex items-center justify-center w-full p-8">
                    <div className="text-lg text-gray-600">Loading events...</div>
                  </div>
                ) : upcomingSignupEvents.length > 0 ? (
                  upcomingSignupEvents.slice(0, 6).map((event) => (
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
                      {/* Show ALL sign-up events (no slice limit) */}
                      {upcomingSignupEvents.map((event) => (
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
            </div>

            {/* Current Sparks Section */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h6
                  className="
                    font-medium
                    text-[#211F20]
                    leading-none
                    font-bricolage
                    text-[18px] md:text-[20px] xl:text-[28px] 2xl:text-[32px]
                  "
                >
                  Current Sparks
                </h6>
                <div className="flex items-center gap-2 sm:gap-2 md:gap-3 lg:gap-4">
                  <button
                    className="
                      flex justify-center items-center
                      px-5 py-2 sm:px-5 sm:py-2 md:px-6 md:py-2.5 lg:px-6 lg:py-2.5
                      text-sm font-medium text-gray-800 bg-white
                      border border-[rgba(33,31,32,0.50)] rounded
                      hover:bg-gray-100 transition-colors
                    "
                    onClick={() => navigate('/dashboard/dashMyConnections')}
                  >
                    See all
                  </button>
                </div>
              </div>
              {loadingConnections ? (
                <div className="p-4 text-gray-600">Loading...</div>
              ) : (
                <ConnectionsTable connections={connections} onMessageClick={handleMessageClick} />
              )}
              {/*              <button
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
              </button> */}
            </div>

          </div> {/* Close the flex container with responsive gaps */}
        </div> {/* Close the inner container with max-width */}
      </div> {/* Close the outer container with padding */}

      {/* Error Modal Overlay */}
      {errorModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black opacity-50"
            onClick={() => setErrorModal(prev => ({ ...prev, open: false }))}
          />
          {/* Modal content */}
          <div className="relative bg-white rounded-2xl shadow-lg max-w-md w-full p-8 z-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-indigo-950">{errorModal.title}</h2>
              <button
                className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
                onClick={() => setErrorModal(prev => ({ ...prev, open: false }))}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>
            <p className="text-gray-700 whitespace-pre-line mb-6">{errorModal.message}</p>
            <div className="flex justify-end">
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-[#0043F1] rounded-lg hover:bg-[#0034BD] transition-colors"
                onClick={() => setErrorModal(prev => ({ ...prev, open: false }))}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DashMessages Modal */}
      {selectedConnection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black opacity-50" onClick={handleCloseMessages} />
          <div className="relative bg-white rounded-2xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 z-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Message {selectedConnection.name}</h2>
              <button 
                className="text-gray-500 hover:text-gray-800 text-2xl" 
                onClick={handleCloseMessages}
              >
                &times;
              </button>
            </div>
            <DashMessages connection={selectedConnection} />
          </div>
        </div>
      )}

      {/* Sign-Up Success Modal */}
      {showSignUpSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowSignUpSuccessModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-lg max-w-md w-full p-8 z-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-green-600">Successfully Signed Up!</h2>
              <button
                className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
                onClick={() => setShowSignUpSuccessModal(false)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>
            <p className="text-gray-700 mb-6">You've been successfully signed up for this event. Please check your email for the virtual event invitation.</p>
            <div className="flex justify-end">
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                onClick={() => setShowSignUpSuccessModal(false)}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashHome;