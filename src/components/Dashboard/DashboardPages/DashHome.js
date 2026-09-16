import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, Link } from 'react-router-dom';
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

const MAX_SELECTIONS = 3;

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
};

function isEventUpcoming(event, userLocation) {
  if (event.startTime) {
    const eventDateTime = DateTime.fromMillis(Number(event.startTime));
    if (eventDateTime.isValid) {
      const userZone = cityToTimeZone[userLocation] || DateTime.local().zoneName || 'UTC';
      const now = DateTime.now().setZone(userZone);
      const eventEndDateTime = event.endTime ? DateTime.fromMillis(Number(event.endTime)) : eventDateTime.plus({ minutes: 90 });
      return eventEndDateTime.setZone(userZone) > now;
    }
  }

  if (event.date && event.time) {
    let eventZone = event.timeZone || 'UTC';
    const normalizedTime = event.time.replace(/am|pm/i, m => m.toUpperCase());
    let eventDateTime = DateTime.fromFormat(`${event.date} ${normalizedTime}`, 'yyyy-MM-dd h:mma', { zone: eventZone });
    if (!eventDateTime.isValid) {
      eventDateTime = DateTime.fromFormat(`${event.date} ${normalizedTime}`, 'yyyy-MM-dd H:mm', { zone: eventZone });
    }
    if (eventDateTime.isValid) {
      const userZone = cityToTimeZone[userLocation] || DateTime.local().zoneName || 'UTC';
      const now = DateTime.now().setZone(userZone);
      const eventEndDateTime = eventDateTime.plus({ minutes: 90 });
      return eventEndDateTime.setZone(userZone) > now;
    }
  }

  return true;
}

function useResponsiveEventLimit() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile ? 4 : 6;
}

async function isLatestEventWithin48Hours(userId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const latestEventId = userDoc.data()?.latestEventId;
    if (!latestEventId) return false;

    const functionsInst = getFunctions();
    const getEventDataCF = httpsCallable(functionsInst, 'getEventData');
    const res = await getEventDataCF({ eventId: latestEventId });

    if (!res.data?.event) return false;

    const eventData = res.data.event;
    const now = DateTime.now();
    let eventEndDateTime;

    if (eventData.endTime) {
      eventEndDateTime = DateTime.fromMillis(Number(eventData.endTime));
    } else if (eventData.startTime) {
      const eventDateTime = DateTime.fromMillis(Number(eventData.startTime));
      eventEndDateTime = eventDateTime.plus({ minutes: 90 });
    } else {
      return false;
    }

    if (!eventEndDateTime || !eventEndDateTime.isValid) return false;

    const hoursSinceEvent = now.diff(eventEndDateTime, 'hours').hours;
    return hoursSinceEvent > 0 && hoursSinceEvent <= 48;
  } catch (error) {
    console.error('[48HOURS] Error checking event time:', error);
    return false;
  }
}

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
  const location = useLocation();

  const guestUid = location.state?.guestUid || localStorage.getItem('guestUid');

  const [events, setEvents] = useState([]);
  const [firebaseEvents, setFirebaseEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userGender, setUserGender] = useState(null);
  const [datesRemaining, setDatesRemaining] = useState(100);
  const [userProfile, setUserProfile] = useState(null);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [showAllSignUp, setShowAllSignUp] = useState(false);
  const [allEvents, setAllEvents] = useState([]);
  const [signedUpEventIds, setSignedUpEventIds] = useState(new Set());
  const [signedUpEventsLoaded, setSignedUpEventsLoaded] = useState(false);
  const [connections, setConnections] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [hasNewSpark, setHasNewSpark] = useState(false);
  const [checkingNewSparks, setCheckingNewSparks] = useState(false);
  const [hideNewSparksNotification, setHideNewSparksNotification] = useState(false);
  const [showSelectSparksCard, setShowSelectSparksCard] = useState(false);
  const [showCongratulationsModal, setShowCongratulationsModal] = useState(false);
  const [selectingMatches, setSelectingMatches] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);

  const [errorModal, setErrorModal] = useState({
    open: false,
    title: '',
    message: '',
  });

  const [pendingSelections, setPendingSelections] = useState([]);
  const [loadingSelections, setLoadingSelections] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelEventId, setCancelEventId] = useState(null);

  // ✅ Cancelled events tombstone (in-memory Set)
  const [cancelledEventIds, setCancelledEventIds] = useState(new Set());

  const handleCancelClick = (eventId) => {
    setCancelEventId(eventId);
    setShowCancelModal(true);
  };

  // ============================================================
  // ✅ Tombstone load – handles BOTH array and object formats
  // ============================================================
  useEffect(() => {
    const userId = guestUid || auth.currentUser?.uid;
    if (!userId) return;
    const unsub = onSnapshot(doc(db, 'users', userId), (snap) => {
      if (snap.exists()) {
        const raw = snap.data()?.cancelledEvents;
        const ids = new Set();
        if (Array.isArray(raw)) {
          raw.forEach(id => ids.add(id));
        } else if (raw && typeof raw === 'object') {
          Object.keys(raw).forEach(k => {
            if (raw[k] === true) ids.add(k);
          });
        }
        setCancelledEventIds(ids);
      }
    });
    return () => unsub();
  }, [guestUid, auth.currentUser?.uid]);

  // ============================================================
  // ✅ performCancelRegistration – idempotent + optimistic + phone-aware
  // ============================================================
  const performCancelRegistration = async () => {
    if (!cancelEventId) return;

    const uid = auth.currentUser?.uid || guestUid;
    if (!uid) {
      setErrorModal({
        open: true,
        title: 'Error',
        message: 'You are not logged in. Please log in to cancel.',
      });
      setShowCancelModal(false);
      return;
    }

    const eventIdToCancel = cancelEventId;
    const event = allEvents.find(e => e.firestoreID === eventIdToCancel);
    const phoneNumber = userProfile?.phoneNumber || null;

    try {
      // 1. Save tombstone FIRST as OBJECT
      await updateDoc(doc(db, 'users', uid), {
        [`cancelledEvents.${eventIdToCancel}`]: true,
      });

      // 2. Update local state optimistically
      setCancelledEventIds(prev => {
        const next = new Set(prev);
        next.add(eventIdToCancel);
        return next;
      });
      setSignedUpEventIds(prev => {
        const next = new Set(prev);
        next.delete(eventIdToCancel);
        return next;
      });

      // 3. Call the CF (with fallback)
      const functions = getFunctions();
      const cancelEvent = httpsCallable(functions, 'cancelEventRegistration');

      try {
        await cancelEvent({
          eventId: eventIdToCancel,
          userId: uid,
          phoneNumber: phoneNumber,
          userPhoneNumber: phoneNumber,
          gender: event?.genderType || userGender,
          eventFormat: event?.eventFormat || 'in-person',
          eventID: event?.eventID || null,
        });
        console.log('✅ CF cancellation succeeded');
      } catch (cfErr) {
        console.warn('CF cancel error (will do client-side cleanup):', cfErr);

        // Client-side cleanup – try phone first, then uid
        try {
          await deleteDoc(doc(db, 'users', uid, 'signedUpEvents', eventIdToCancel));

          const idsToTry = [phoneNumber, uid].filter(Boolean);
          if (phoneNumber && phoneNumber.startsWith('+')) {
            idsToTry.push(phoneNumber.substring(1));
          }

          for (const id of idsToTry) {
            try {
              await deleteDoc(doc(db, 'events', eventIdToCancel, 'signedUpUsers', id));
              console.log(`✅ Deleted signedUpUsers/${id}`);
            } catch (e) {
              // ignore – doc might not exist
            }
          }
          console.log('✅ Client-side cleanup done');
        } catch (cleanupErr) {
          console.warn('Client-side cleanup failed:', cleanupErr);
        }
      }

      // 4. Close modal
      setShowCancelModal(false);
      setCancelEventId(null);

    } catch (error) {
      console.error('Cancel error:', error);

      // Fallback – make sure UI is in sync
      try {
        await deleteDoc(doc(db, 'users', uid, 'signedUpEvents', eventIdToCancel));

        const idsToTry = [phoneNumber, uid].filter(Boolean);
        if (phoneNumber && phoneNumber.startsWith('+')) {
          idsToTry.push(phoneNumber.substring(1));
        }

        for (const id of idsToTry) {
          try {
            await deleteDoc(doc(db, 'events', eventIdToCancel, 'signedUpUsers', id));
          } catch (e) {
            // ignore
          }
        }
      } catch (delErr) {
        console.warn('Fallback cleanup failed:', delErr);
      }

      setCancelledEventIds(prev => {
        const next = new Set(prev);
        next.add(eventIdToCancel);
        return next;
      });
      setSignedUpEventIds(prev => {
        const next = new Set(prev);
        next.delete(eventIdToCancel);
        return next;
      });

      setShowCancelModal(false);
      setCancelEventId(null);
    }
  };

  const [showSignUpSuccessModal, setShowSignUpSuccessModal] = useState(false);

  const handleMessageClick = (connection) => {
    setSelectedConnection(connection);
  };

  const handleCloseMessages = () => {
    setSelectedConnection(null);
  };

  const fetchUserSignedUpEventIds = async (userId) => {
    if (!userId) return new Set();
    try {
      const signedUpCol = collection(db, 'users', userId, 'signedUpEvents');
      const snap = await getDocs(signedUpCol);
      const idSet = new Set();
      snap.forEach((d) => idSet.add(d.id));
      return idSet;
    } catch (err) {
      console.error('Error fetching user signed-up events:', err);
      return new Set();
    }
  };

  const fetchEventParticipantUserIds = async (eventId) => {
    if (!eventId) return [];
    try {
      const functionsInst = getFunctions();
      const getEventMembers = httpsCallable(functionsInst, 'getEventMembers');
      const res = await getEventMembers({ eventId });

      const payload = res?.data;

      if (Array.isArray(payload)) {
        return await emailsToUserIds(payload.map((att) => att?.user?.email).filter(Boolean));
      }

      if (payload && Array.isArray(payload.attendees)) {
        return await emailsToUserIds(payload.attendees.map((att) => att?.user?.email).filter(Boolean));
      }

      if (payload && Array.isArray(payload.emails)) {
        return await emailsToUserIds(payload.emails.filter(Boolean));
      }

      console.warn('fetchEventParticipantEmails: Unexpected response format', payload);
      return [];
    } catch (err) {
      console.error('Error fetching event participant emails:', err);
      return [];
    }
  };

  const emailsToUserIds = async (emails) => {
    if (!Array.isArray(emails) || emails.length === 0) return [];

    const uidSet = new Set();
    for (let i = 0; i < emails.length; i += 10) {
      const slice = emails.slice(i, i + 10);
      const q = query(collection(db, 'users'), where('email', 'in', slice));
      const snap = await getDocs(q);
      snap.forEach((docSnap) => {
        const uid = docSnap.id;
        if (auth.currentUser && uid === auth.currentUser.uid) return;
        uidSet.add(uid);
      });
    }

    return Array.from(uidSet);
  };

  const getUpcomingEvents = (eventsList, userLocation) => {
    const filtered = eventsList.filter(event => isEventUpcoming(event, userLocation));
    console.log('Filtering events, input size:', eventsList.length, 'output size:', filtered.length);
    return filtered;
  };

  useEffect(() => {
    if (guestUid) {
      (async () => {
        try {
          const userDocRef = doc(db, 'users', guestUid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserGender(data.gender || data.userGender);
            const fetchedRemaining = typeof data.datesRemaining === 'number'
              ? data.datesRemaining
              : Number(data.datesRemaining);
            setDatesRemaining(Number.isFinite(fetchedRemaining) ? fetchedRemaining : 0);
            setUserProfile(data);
            setShowSelectSparksCard(!!data.latestEventId);
          }
        } catch (err) {
          console.error('Error loading guest data:', err);
        }
      })();
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserGender(data.gender);
          const fetchedRemaining = typeof data.datesRemaining === 'number'
            ? data.datesRemaining
            : Number(data.datesRemaining);
          setDatesRemaining(Number.isFinite(fetchedRemaining) ? fetchedRemaining : 0);
          setUserProfile(data);
          setShowSelectSparksCard(!!data.latestEventId);
        }
      }
    });
    return () => unsubscribe();
  }, [guestUid]);

  const fetchConnections = async () => {
    const userId = guestUid || auth.currentUser?.uid;
    if (!userId) return;
    setLoadingConnections(true);
    setCheckingNewSparks(true);
    try {
      const connsSnap = await getDocs(collection(db, 'users', userId, 'connections'));
      const uids = connsSnap.docs.map(d => d.id);
      const profiles = await Promise.all(
        uids.map(async (uid) => {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (!userDoc.exists()) return null;
          const data = userDoc.data();
          const connectionDoc = await getDoc(doc(db, 'users', userId, 'connections', uid));
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
    } catch (err) {
      console.error('Error fetching connections:', err);
      setConnections([]);
      setHasNewSpark(false);
    } finally {
      setLoadingConnections(false);
      setCheckingNewSparks(false);
    }
  };
 
  useEffect(() => {
    if (guestUid || auth.currentUser) {
      fetchConnections();
    }
  }, [guestUid, auth.currentUser]);
  
  useEffect(() => {
    const userId = guestUid || auth.currentUser?.uid;
    if (!userId) {
      console.log('🔴 No user, skipping signedUpEvents listener');
      return;
    }
    const signedUpRef = collection(db, 'users', userId, 'signedUpEvents');

    const unsubscribe = onSnapshot(signedUpRef, (snapshot) => {
      const idSet = new Set();
      snapshot.forEach((doc) => {
        idSet.add(doc.id);
      });
      setSignedUpEventIds(idSet);
      setSignedUpEventsLoaded(true);
    });

    return () => unsubscribe();
  }, [guestUid]);

  useEffect(() => {
    if (!signedUpEventsLoaded || signedUpEventIds.size === 0) return;

    const allIds = new Set(allEvents.map(e => e.firestoreID));
    const missing = Array.from(signedUpEventIds).some(id => !allIds.has(id));

    if (missing) {
      console.log('📦 Reloading events to include newly signed-up events...');
      loadEvents();
    }
  }, [signedUpEventIds, signedUpEventsLoaded, allEvents]);

  useEffect(() => {
    const shouldShowCongratulations = localStorage.getItem('showCongratulationsModal');
    if (shouldShowCongratulations === 'true') {
      setShowCongratulationsModal(true);
      localStorage.removeItem('showCongratulationsModal');
    }
  }, []);

  // ✅ loadEvents
  const loadEvents = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "events"));

      const functionsInst = getFunctions();
      const getEventDataCF = httpsCallable(functionsInst, "getEventData");

      const eventsList = await Promise.all(
        querySnapshot.docs.map(async (docSnapshot) => {
          const docData = docSnapshot.data() || {};
          const eventId = docData.eventID || docSnapshot.id;

          // In-person events: skip Remo API
          if (docData.eventFormat === 'in-person') {
            let date = null;
            let time = null;
            let timeZone = null;
            if (docData.startTime) {
              const dt = DateTime.fromMillis(Number(docData.startTime));
              if (dt.isValid) {
                date = dt.toFormat('yyyy-MM-dd');
                time = dt.toFormat('h:mma');
                timeZone = dt.zoneName;
              }
            }
            return {
              ...docData,
              title: docData.title || 'Untitled',
              firestoreID: docSnapshot.id,
              eventID: eventId,
              date,
              time,
              timeZone,
            };
          }

          // Virtual events: try Remo first
          try {
            const res = await getEventDataCF({ eventId });
            const remoEvent = res.data?.event;
            if (remoEvent) {
              const finalTitle = remoEvent.name || remoEvent.title || docData.title || docData.eventName || 'Untitled';
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
                date = remoEvent.date || date;
                time = remoEvent.time || time;
                timeZone = remoEvent.timeZone || timeZone;
              }
              return {
                ...remoEvent,
                ...docData,
                title: finalTitle,
                eventType: docData.eventType || docData.type || remoEvent.eventType,
                firestoreID: docSnapshot.id,
                eventID: eventId,
                date,
                time,
                timeZone,
              };
            }
          } catch (err) {
            console.error(`Failed fetching Remo event for ${eventId}:`, err);
          }

          // Fallback: Firestore data only
          let date = null;
          let time = null;
          let timeZone = null;
          if (docData.startTime) {
            const dt = DateTime.fromMillis(Number(docData.startTime));
            if (dt.isValid) {
              date = dt.toFormat('yyyy-MM-dd');
              time = dt.toFormat('h:mma');
              timeZone = dt.zoneName;
            }
          }
          return {
            ...docData,
            title: docData.title || docData.eventName || 'Untitled',
            firestoreID: docSnapshot.id,
            eventID: eventId,
            date,
            time,
            timeZone,
          };
        })
      );

      const filteredEvents = eventsList.filter(Boolean);
      const sortedEvents = sortEventsByDate(filteredEvents);
      setAllEvents(sortedEvents);

      const upcoming = getUpcomingEvents(sortedEvents, userProfile?.location);
      setFirebaseEvents(upcoming);
      setEvents(upcoming);

      const uid = guestUid || auth.currentUser?.uid;
      if (uid) {
        const signedUpIds = await fetchUserSignedUpEventIds(uid);
        setSignedUpEventIds(signedUpIds);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingSelections = async () => {
    const uid = auth.currentUser?.uid || guestUid;
    if (!uid) return;
    setLoadingSelections(true);
    try {
      const pending = [];
      for (const eventId of signedUpEventIds) {
        const event = allEvents.find(e => e.firestoreID === eventId);
        if (!event) continue;
        if (event.status !== 'complete') continue;
        const attendeeRef = doc(db, 'events', eventId, 'signedUpUsers', uid);
        const attendeeSnap = await getDoc(attendeeRef);
        if (attendeeSnap.exists()) {
          const data = attendeeSnap.data();
          if (!data.selectionSubmitted) {
            pending.push({
              eventId: eventId,
              eventTitle: event.title || 'Event',
            });
          }
        }
      }
      setPendingSelections(pending);
    } catch (err) {
      console.error('Error fetching pending selections:', err);
    } finally {
      setLoadingSelections(false);
    }
  };

  useEffect(() => {
    if (signedUpEventsLoaded && allEvents.length > 0) {
      fetchPendingSelections();
    }
  }, [signedUpEventsLoaded, allEvents, signedUpEventIds]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadEvents();
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userProfile) {
      loadEvents();
    }
  }, [userProfile]);

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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const output = await response.json();
      const eventID = output.event._id;

      await setDoc(doc(db, 'events', eventID), {
        eventName: 'Test event 3',
        eventID: eventID,
        menCapacity: 10,
        womenCapacity: 10,
      });

      return eventID;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  };

  const getEventData = async (eventID) => {
    try {
      const eventInfo = await getDoc(doc(db, 'events', eventID));
      if (eventInfo.exists()) {
        return eventInfo.data();
      } else {
        console.warn(`No Firestore document for event ID: ${eventID}`);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching event data for ${eventID}:`, error);
      return null;
    }
  };

  const handleSignUp = async (event) => {
    const currentRemaining = Number.isFinite(datesRemaining) ? datesRemaining : 0;
    if (currentRemaining <= 0) {
      return {
        success: false,
        message: 'Please purchase a ticket to register for this event.',
        showError: true
      };
    }

    const user = auth.currentUser;
    if (!user) {
      return {
        success: false,
        message: 'Please log in to join events.',
        showError: true
      };
    }

    try {
      const userData = {
        userName: userProfile && userProfile.firstName ? `${userProfile.firstName} ${userProfile.lastName || ''}`.trim() : (user.displayName || null),
        userEmail: user.email || null,
        userPhoneNumber: (userProfile && userProfile.phoneNumber) || user.phoneNumber || null,
        userGender: userGender || null,
        userLocation: (userProfile && userProfile.location) || null,
      };

      const result = await signUpForEventWithDates(event.firestoreID, user.uid, userData, -1);

      if (result.success) {
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

        try {
          const functionsInst = getFunctions();
          const addUserToRemoEvent = httpsCallable(functionsInst, 'addUserToRemoEvent');
          await addUserToRemoEvent({
            eventId: event.eventID,
            userEmail: user.email
          });
        } catch (error) {
          console.error('❌ Failed to add user to Remo event:', error);
        }

        setDatesRemaining(result.newDates);
        setSignedUpEventIds(prev => {
          const next = new Set(prev);
          next.add(event.firestoreID);
          return next;
        });

        setShowSignUpSuccessModal(true);
        return { success: true, message: 'Event signup completed successfully', showSuccess: true };
      } else {
        return {
          success: false,
          message: result.message || 'Failed to sign up for event. Please try again.',
          showError: true,
          showSuccess: false
        };
      }
    } catch (error) {
      console.error('❌ Error during event signup:', error);
      if (!error.message.includes('Event is full for')) {
        return {
          success: false,
          message: error.message || 'Failed to sign up for event. Please try again.',
          showError: true
        };
      }
      return { success: false, message: 'Failed to sign up for event. Please try again.' };
    }
  };

  const reconcileUserEventState = async ({ force = false } = {}) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const mySignedUpSnap = await getDocs(
        collection(db, 'users', user.uid, 'signedUpEvents')
      );

      const mySignedUpSet = new Set(
        mySignedUpSnap.docs.map(d => d.id)
      );

      const userSnap = await getDoc(doc(db, 'users', user.uid));
      const userData = userSnap.exists() ? userSnap.data() : {};

      // ✅ Normalize tombstone – handle BOTH array and object
      const rawCancelled = userData.cancelledEvents;
      const cancelledEvents = {};
      if (Array.isArray(rawCancelled)) {
        rawCancelled.forEach(id => { cancelledEvents[id] = true; });
      } else if (rawCancelled && typeof rawCancelled === 'object') {
        Object.assign(cancelledEvents, rawCancelled);
      }

      const cgQ = query(
        collectionGroup(db, 'signedUpUsers'),
        where('userID', '==', user.uid)
      );
      const cgSnap = await getDocs(cgQ);

      for (const suDoc of cgSnap.docs) {
        const eventRef = suDoc.ref.parent.parent;
        if (!eventRef) continue;
        const eventFirestoreId = eventRef.id;

        // Do not recreate an event that the user explicitly cancelled.
        if (cancelledEvents[eventFirestoreId] === true) {
          const cancelledSignedUpRef = doc(
            db,
            'users',
            user.uid,
            'signedUpEvents',
            eventFirestoreId
          );

          try {
            await deleteDoc(cancelledSignedUpRef);
          } catch (deleteError) {
            console.warn(
              'Could not clean up cancelled event:',
              eventFirestoreId,
              deleteError
            );
          }

          continue;
        }

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
      reconcileUserEventState();
    }
  }, [userProfile]);

  useEffect(() => {
    if (!auth.currentUser || !userProfile) return;

    const q = query(
      collectionGroup(db, 'signedUpUsers'),
      where('userID', '==', auth.currentUser.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        reconcileUserEventState({ force: true });
      }
    });

    return () => unsub();
  }, [userProfile, auth.currentUser]);

  const handleMatchesClick = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setSelectingMatches(false);
      return;
    }

    try {
      setSelectingMatches(true);

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

      const eventsSnapshot = await getDocs(collection(db, 'events'));
      let eventDocId = null;
      eventsSnapshot.forEach(docSnap => {
        if (docSnap.data().eventID === latestEventId || docSnap.id === latestEventId) {
          eventDocId = docSnap.id;
        }
      });
      if (!eventDocId) {
        setErrorModal({
          open: true,
          title: "Event Not Found",
          message: "The event you are trying to access could not be found. It may have been removed or is no longer available.",
        });
        setSelectingMatches(false);
        return;
      }

      const signedUpUsersCol = collection(db, 'events', eventDocId, 'signedUpUsers');
      const signedUpUsersSnap = await getDocs(signedUpUsersCol);
      const userIds = signedUpUsersSnap.docs.map(d => d.id);

      const existingConnectionsSnap = await getDocs(collection(db, 'users', currentUser.uid, 'connections'));
      const existingConnections = {};
      existingConnectionsSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.status === 'mutual' && data.matchScore) {
          existingConnections[doc.id] = data.matchScore;
        }
      });

      const quizResponses = [];
      const userProfiles = [];

      for (const uid of userIds) {
        const quizDocRef = doc(db, 'users', uid, 'quizResponses', 'latest');
        const userProfileRef = doc(db, 'users', uid);

        const [quizDoc, userProfileDoc] = await Promise.all([
          getDoc(quizDocRef),
          getDoc(userProfileRef)
        ]);

        if (quizDoc.exists()) {
          quizResponses.push({ userId: uid, answers: quizDoc.data().answers });
          if (userProfileDoc.exists()) {
            userProfiles.push({ userId: uid, ...userProfileDoc.data() });
          }
        }
      }

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

      const currentUserAnswers = quizResponses.find(q => q.userId === currentUser.uid)?.answers;
      const currentUserProfile = userProfiles.find(p => p.userId === currentUser.uid);

      if (!currentUserAnswers) {
        alert('You must complete your quiz to get matches.');
        setSelectingMatches(false);
        return;
      }

      if (!currentUserProfile) {
        alert('User profile not found. Please complete your profile setup.');
        setSelectingMatches(false);
        return;
      }

      const otherUsers = quizResponses.filter(q => q.userId !== currentUser.uid);
      const otherUserProfiles = userProfiles.filter(p => p.userId !== currentUser.uid);

      const otherUsersWithProfiles = otherUsers.map(quizUser => {
        const profile = otherUserProfiles.find(p => p.userId === quizUser.userId);
        return { ...quizUser, ...profile };
      });

      const filteredUsers = filterByGenderPreference(currentUserProfile, otherUsersWithProfiles);

      const { getTopMatches } = await import('../../Matchmaking/Synergies.js');
      const newMatches = getTopMatches(currentUserAnswers, filteredUsers);

      const mergedMatches = [...newMatches];

      Object.keys(existingConnections).forEach(userId => {
        const existsInNewMatches = newMatches.some(match => match.userId === userId);
        if (!existsInNewMatches) {
          mergedMatches.push({ userId: userId, score: existingConnections[userId] });
        }
      });

      await setDoc(doc(db, 'matches', currentUser.uid), {
        timestamp: serverTimestamp(),
        results: mergedMatches
      });

      navigate('myMatches');
    } catch (error) {
      console.error('[DASHHOME] Error in handleMatchesClick:', error);
      setSelectingMatches(false);
      try {
        navigate('/dashboard/myMatches');
      } catch (navError) {
        setErrorModal({
          open: true,
          title: "Error",
          message: "An error occurred while processing your matches. Please try again.",
        });
      }
    }
  };

  const handleDirectMatchesClick = () => {
    navigate('/dashboard/myMatches');
  };

  const handleConnectionsClick = () => {
    navigate('dashMyConnections');
  };

  const handlePurchaseMoreDatesClick = () => {
    navigate('/dashboard/dashDateCalendar');
  };

  const signUpEventLimit = useResponsiveEventLimit();

  // ✅ Filter cancelled events + only upcoming events
  const upcomingEvents = useMemo(() => {
    const filtered = allEvents.filter(event => {
      const isSigned = signedUpEventIds.has(event.firestoreID);
      const wasCancelled = cancelledEventIds.has(event.firestoreID);
      const isUpcoming = isEventUpcoming(event, userProfile?.location);
      return isSigned && !wasCancelled && isUpcoming;
    });
    return sortEventsByDate(filtered);
  }, [allEvents, signedUpEventIds, cancelledEventIds, userProfile?.location]);

  const upcomingSignupEvents = useMemo(() => {
    const filtered = allEvents.filter(event => {
      if (signedUpEventIds.has(event.firestoreID)) return false;
      if (!event.location || !userProfile?.location) return false;
      if (event.location.trim().toLowerCase() !== userProfile.location.trim().toLowerCase()) return false;
      return isEventUpcoming(event, userProfile.location);
    });
    return sortEventsByDate(filtered);
  }, [allEvents, signedUpEventIds, userProfile?.location]);

  return (
    <div>
      <div className="px-7 py-4 sm:px-7 sm:py-4 md:px-7 md:py-6 lg:px-7 lg:py-8 xl:px-7 xl:py-12 2xl:px-7 2xl:py-12 bg-white border border-[rgba(33,31,32,0.10)] border-solid max-sm:px-5 max-sm:py-4">
        <div className="max-w-[1340px] mx-auto">
          <div className="flex flex-col gap-[18px] sm:gap-[24px] xl:gap-[32px] 2xl:gap-[50px]">

            <h2 className="font-semibold text-[#211F20] leading-[110%] font-bricolage text-[32px] sm:text-[40px] md:text-[48px]">
              Welcome back, {userProfile?.firstName}
            </h2>

            {pendingSelections.length > 0 && !loadingSelections && (
              <div className="relative w-full rounded-2xl overflow-hidden min-h-[103px] flex items-center">
                <img src={homeSelectMySparks} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <img src={imgNoise} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ mixBlendMode: 'soft-light' }} />
                <div className="absolute inset-0 bg-[#211F20] bg-opacity-10" style={{ background: `linear-gradient(180deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.50) 100%), linear-gradient(0deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.30) 100%), linear-gradient(0deg, rgba(226,255,101,0.25) 0%, rgba(226,255,101,0.25) 100%)` }} />
                <div className="relative z-10 flex flex-col items-start p-6">
                  <span className="flex items-center font-medium text-white leading-[130%] font-bricolage text-[14px] sm:text-[16px] lg:text-[20px] 2xl:text-[24px] mb-4">
                    <SmallFlashIcon className="w-6 h-6 mr-2" />
                    It's time to select your favourites! Choose up to 3 people from your event.
                  </span>
                  {pendingSelections.map((ps) => (
                    <button
                      key={ps.eventId}
                      onClick={() => navigate(`/dashboard/event-selections/${ps.eventId}`)}
                      className="bg-[#E2FF65] text-[#211F20] font-semibold rounded-md px-6 py-2 text-base shadow-none transition hover:bg-[#d4f85a] mr-2"
                    >
                      Select for {ps.eventTitle}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                  <span className="flex items-center font-medium text-white leading-[130%] font-bricolage text-[14px] sm:text-[16px] lg:text-[20px] 2xl:text-[24px] mb-4">
                    <SmallFlashIcon className="w-6 h-6 mr-2" />
                    You just went on a date! Choose up to 3 connections. We'll let you know if the spark is mutual.
                  </span>
                  <button
                    onClick={handleMatchesClick}
                    disabled={selectingMatches}
                    className={`bg-[#E2FF65] text-[#211F20] font-semibold rounded-md px-6 py-2 text-base shadow-none transition ${
                      selectingMatches ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#d4f85a]'
                    }`}
                  >
                    {selectingMatches ? 'Loading…' : 'Select My Connections'}
                  </button>
                </div>
              </div>
            )}

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
                <div className="absolute top-4 right-4 z-20 cursor-pointer" onClick={() => setHideNewSparksNotification(true)}>
                  <img src={xIcon} alt="Close" className="w-6 h-6 filter brightness-0 invert" />
                </div>
                <div className="relative z-10 flex flex-col items-start p-6">
                  <span className="flex items-center font-medium text-white leading-[130%] font-bricolage text-[14px] sm:text-[16px] lg:text-[20px] 2xl:text-[24px] mb-4">
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

            {/* Upcoming Events Section */}
            <div>
              <div className="flex bg-white justify-between items-center mb-6">
                <h6 className="font-medium text-[#211F20] leading-[100%] font-bricolage text-[18px] md:text-[20px] xl:text-[28px] 2xl:text-[32px] mt-4">
                  Upcoming Events
                </h6>
                <div className="flex items-center gap-2 sm:gap-2 md:gap-3 lg:gap-4">
                  <button
                    className="flex justify-center items-center px-5 py-2 sm:px-5 sm:py-2 md:px-6 md:py-2.5 lg:px-6 lg:py-2.5 text-sm font-medium text-gray-800 bg-white border border-[rgba(33,31,32,0.50)] rounded hover:bg-gray-100 transition-colors"
                    onClick={() => setShowAllUpcoming(true)}
                  >
                    See all
                  </button>
                  <div className="flex justify-center items-center px-2 py-2 sm:px-2 sm:py-2 md:px-2 md:py-2 lg:px-2 lg:py-2 border border-[rgba(33,31,32,0.25)] rounded bg-white">
                    <img src={filterIcon} alt="Filter" className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:gap-4 md:gap-5 lg:gap-6 bg-white rounded-xl w-full grid-cols-1 md:grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 auto-rows-fr">
                {(upcomingEvents.slice(0, 6)).map((event) => (
                  <EventCard
                    key={event.firestoreID}
                    event={event}
                    type="upcoming"
                    userGender={userGender}
                    datesRemaining={datesRemaining}
                    isSignedUp={true}
                    onCancel={handleCancelClick}
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
                          onCancel={handleCancelClick}
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
                <h6 className="font-medium text-[#211F20] leading-none font-bricolage text-[18px] md:text-[20px] xl:text-[28px] 2xl:text-[32px]">
                  Sign-Up for Dates
                </h6>
                <div className="flex items-center gap-2 sm:gap-2 md:gap-3 lg:gap-4">
                  <button
                    className="flex justify-center items-center px-5 py-2 sm:px-5 sm:py-2 md:px-6 md:py-2.5 lg:px-6 lg:py-2.5 text-sm font-medium text-gray-800 bg-white border border-[rgba(33,31,32,0.50)] rounded hover:bg-gray-100 transition-colors"
                    onClick={() => setShowAllSignUp(true)}
                  >
                    See all
                  </button>
                  <div className="flex justify-center items-center px-2 py-2 sm:px-2 sm:py-2 md:px-2 md:py-2 lg:px-2 lg:py-2 border border-[rgba(33,31,32,0.25)] rounded bg-white">
                    <img src={filterIcon} alt="Filter" className="w-5 h-5" />
                  </div>
                </div>
              </div>

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
                  <button
                    onClick={handlePurchaseMoreDatesClick}
                    className="bg-[#E2FF65] text-[#211F20] font-semibold rounded-md px-6 py-2 text-base shadow-none hover:bg-[#d4f85a] transition"
                  >
                    Purchase more dates
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:gap-4 md:gap-5 lg:gap-6 bg-white rounded-xl w-full grid-cols-1 md:grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 auto-rows-fr">
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
              {showAllSignUp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowAllSignUp(false)} />
                  <div className="relative bg-white rounded-2xl shadow-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto p-8 z-10">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">All Sign-Up Events</h2>
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
                <h6 className="font-medium text-[#211F20] leading-none font-bricolage text-[18px] md:text-[20px] xl:text-[28px] 2xl:text-[32px]">
                  Current Sparks
                </h6>
                <div className="flex items-center gap-2 sm:gap-2 md:gap-3 lg:gap-4">
                  <button
                    className="flex justify-center items-center px-5 py-2 sm:px-5 sm:py-2 md:px-6 md:py-2.5 lg:px-6 lg:py-2.5 text-sm font-medium text-gray-800 bg-white border border-[rgba(33,31,32,0.50)] rounded hover:bg-gray-100 transition-colors"
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
            </div>

          </div>
        </div>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowCancelModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-lg max-w-md w-full p-8 z-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#211F20]">Cancel Registration</h2>
              <button
                className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
                onClick={() => setShowCancelModal(false)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to cancel your registration for this event? You will be removed from the attendee list and a spot will become available for someone else.
            </p>
            <div className="flex justify-end gap-4">
              <button
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setShowCancelModal(false)}
              >
                No, Keep Spot
              </button>
              <button
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                onClick={performCancelRegistration}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {errorModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black opacity-50"
            onClick={() => setErrorModal(prev => ({ ...prev, open: false }))}
          />
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