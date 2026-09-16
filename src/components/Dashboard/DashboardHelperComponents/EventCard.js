import React, { useState, useEffect } from "react";
import { DateTime } from 'luxon';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../../../pages/firebaseConfig';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../../../pages/firebaseConfig';
import { ReactComponent as LocationIcon } from '../../../images/location.svg';
import { ReactComponent as TimerIcon } from '../../../images/timer.svg';
import { getEventSpots } from '../../../utils/eventSpotsUtils';
import PopUp from './PopUp';

function getDateParts(dateString, timeString, timeZone) {
  const normalizedTime = timeString ? timeString.replace(/am|pm/i, m => m.toUpperCase()).trim() : '';
  const cleanDate = (dateString || '').trim();

  const zoneMap = {
    'PST': 'America/Los_Angeles',
    'EST': 'America/New_York',
    'CST': 'America/Chicago',
    'MST': 'America/Denver',
  };
  const zone = zoneMap[timeZone] || timeZone || 'UTC';

  const withTime = [
    'yyyy-MM-dd h:mma',
    'yyyy-MM-dd H:mm',
    'MM/dd/yyyy h:mma',
    'MM/dd/yyyy H:mm',
    'M/d/yyyy h:mma',
    'M/d/yyyy H:mm',
    'MM/dd/yy h:mma',
    'MM/dd/yy H:mm',
    'M/d/yy h:mma',
    'M/d/yy H:mm',
  ];
  const dateOnly = [
    'yyyy-MM-dd',
    'MM/dd/yyyy',
    'M/d/yyyy',
    'MM/dd/yy',
    'M/d/yy',
  ];

  let dt = null;

  if (cleanDate) {
    const formatsToTry = normalizedTime ? withTime : dateOnly;
    for (const fmt of formatsToTry) {
      dt = DateTime.fromFormat(
        normalizedTime ? `${cleanDate} ${normalizedTime}` : cleanDate,
        fmt,
        { zone }
      );
      if (dt.isValid) break;
    }
    if (!dt || !dt.isValid) {
      dt = DateTime.fromISO(cleanDate, { zone });
    }
  }

  if (!dt || !dt.isValid) {
    return { dayOfWeek: '', day: '', month: '' };
  }

  return {
    dayOfWeek: dt.toFormat('ccc').toUpperCase(),
    day: dt.toFormat('d'),
    month: dt.toFormat('LLL').toUpperCase(),
  };
}

function getDatePartsFromMillis(millis) {
  if (!millis) return { dayOfWeek: '', day: '', month: '' };
  const dt = DateTime.fromMillis(Number(millis));
  return {
    dayOfWeek: dt.toFormat('ccc').toUpperCase(),
    day: dt.toFormat('d'),
    month: dt.toFormat('LLL').toUpperCase(),
    timeLabel: dt.toFormat('h:mm a'),
  };
}

const EventCard = ({ event, type, userGender, onSignUp, datesRemaining, onCancel }) => {
  const [signUpClicked, setSignUpClicked] = useState(false);
  const [showMapsMenu, setShowMapsMenu] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [waitlistClicked, setWaitlistClicked] = useState(false);
  const [spotsData, setSpotsData] = useState({ menCount: 0, womenCount: 0, menSpots: 0, womenSpots: 0 });
  const [isEventActive, setIsEventActive] = useState(false);
  const [hasJoinedEvent, setHasJoinedEvent] = useState(false);
  
  const dateParts = event.startTime ? getDatePartsFromMillis(event.startTime) : getDateParts(event.date, event.time, event.timeZone);
  const { dayOfWeek, day, month, timeLabel } = dateParts;
  
  useEffect(() => {
    const fetchSpots = async () => {
      if (event?.firestoreID) {
        const spots = await getEventSpots(event.firestoreID);
        setSpotsData(spots);
      }
    };
    fetchSpots();
  }, [event?.firestoreID]);

  useEffect(() => {
    const checkEventStatus = () => {
      if (event.startTime && event.endTime) {
        const now = DateTime.now();
        const startTime = DateTime.fromMillis(Number(event.startTime));
        const endTime = DateTime.fromMillis(Number(event.endTime));
        setIsEventActive(now >= startTime && now <= endTime);
      }
    };
    
    checkEventStatus();
    const interval = setInterval(checkEventStatus, 30000);
    return () => clearInterval(interval);
  }, [event.startTime, event.endTime]);

  useEffect(() => {
    const checkJoinedEventStatus = async () => {
      if (!auth.currentUser || !event.eventID) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const joinedEvents = userData.joinedEvents || [];
          const hasJoinedThisEvent = joinedEvents.includes(event.eventID);
          setHasJoinedEvent(hasJoinedThisEvent);
        }
      } catch (error) {
        console.error('[EventCard] Error checking joined event status:', error);
      }
    };
    
    checkJoinedEventStatus();
  }, [event.eventID]);

  const getTimeRange = () => {
    if (event.startTime && event.endTime) {
      const startDt = DateTime.fromMillis(Number(event.startTime));
      const endDt = DateTime.fromMillis(Number(event.endTime));
      const startTime = startDt.toFormat('h:mm a');
      const endTime = endDt.toFormat('h:mm a');
      return `${startTime} - ${endTime}`;
    } else if (timeLabel) {
      return timeLabel;
    }
    return '';
  };
  
  const timeRange = getTimeRange();
  
  const hasNoSpotsForUser = () => {
    if (!userGender || !spotsData) return false;
    
    const userGenderLower = userGender.toLowerCase();
    if (userGenderLower === 'male') {
      return Math.max(spotsData.menSpots - spotsData.menCount, 0) <= 0;
    } else if (userGenderLower === 'female') {
      return Math.max(spotsData.womenSpots - spotsData.womenCount, 0) <= 0;
    }
    return false;
  };
  
  const shouldShowWaitlist = hasNoSpotsForUser();
  
  useEffect(() => {
    const checkIfUserOnWaitlist = async () => {
      if (event?.firestoreID && auth.currentUser && shouldShowWaitlist) {
        try {
          const waitlistDoc = await getDoc(doc(db, 'events', event.firestoreID, 'waitlist', auth.currentUser.uid));
          if (waitlistDoc.exists()) {
            setWaitlistClicked(true);
          }
        } catch (error) {
          console.error('Error checking waitlist status:', error);
        }
      }
    };

    checkIfUserOnWaitlist();
  }, [event?.firestoreID, auth.currentUser, shouldShowWaitlist]);
  
  const addToWaitlist = async (eventId, userId) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      let userProfile = null;
      try {
        const userProfileDoc = await getDoc(doc(db, 'users', userId));
        if (userProfileDoc.exists()) {
          userProfile = userProfileDoc.data();
        }
      } catch (error) {
        console.log('Could not fetch user profile, using fallback data');
      }

      await setDoc(
        doc(db, 'events', eventId, 'waitlist', userId),
        {
          userID: userId,
          userName: userProfile && userProfile.firstName ? `${userProfile.firstName} ${userProfile.lastName || ''}`.trim() : (currentUser.displayName || ''),
          userEmail: currentUser.email || '',
          userPhoneNumber: (userProfile && userProfile.phoneNumber) || currentUser.phoneNumber || '',
          userGender: userGender || (userProfile && userProfile.gender) || null,
          userLocation: (userProfile && userProfile.location) || '',
          signUpTime: serverTimestamp(),
        }
      );
      console.log('✅ User added to waitlist successfully');
    } catch (error) {
      console.error('❌ Failed to add user to waitlist:', error);
      throw error;
    }
  };
  
  return (
    <>
      <div
        className="flex flex-col items-start rounded-[16px] border p-3 sm:p-4 xl:p-5 2xl:p-6 gap-4 sm:gap-5 xl:gap-6 2xl:gap-8 w-full"
        style={
          type === "signup"
            ? {
                border: "1px solid rgba(33, 31, 32, 0.10)",
                borderRadius: "16px",
                background:
                  "radial-gradient(50% 50% at 50% 50%, rgba(226,255,101,0.50) 0%, rgba(210,255,215,0.50) 100%)"
              }
            : {
                border: "1px solid rgba(33, 31, 32, 0.10)",
                borderRadius: "16px",
                background:
                  "radial-gradient(50% 50% at 50% 50%, rgba(176,238,255,0.50) 0%, rgba(231,233,255,0.50) 100%)"
              }
        }
      >
        <div className="border-3 border-black p-2 rounded mb-[-20px]">
            {event.title && (
              <div className="font-medium text-[#211F20] font-bricolage leading-[130%] text-[14px] sm:text-[16px] lg:text-[20px] 2xl:text-[24px]">
                {event.title}
              </div>
            )}
          </div>

        {(event.ageRange || event.eventFormat) && (
          <div className="border-3 border-black p-2 rounded">
            <div className="flex items-center gap-2">
              {event.ageRange && (
                <span className="
                  font-medium
                  text-[#211F20]
                  font-bricolage
                  leading-[130%]
                  text-[14px] sm:text-[16px] lg:text-[20px] 2xl:text-[24px]
                ">
                  Ages {event.ageRange}
                </span>
              )}
              {event.eventFormat && (
                <span className={`font-semibold rounded-full px-2 py-0.5
                  text-[11px] sm:text-[12px] lg:text-[14px] 2xl:text-[16px]
                  ${type === 'upcoming'
                    ? event.eventFormat === 'in-person'
                      ? 'bg-purple-200 text-purple-800'
                      : 'bg-blue-200 text-blue-800'
                    : event.eventFormat === 'in-person'
                      ? 'bg-yellow-200 text-yellow-800'
                      : 'bg-green-200 text-green-800'
                  }`}>
                  {event.eventFormat === 'in-person' ? 'In-Person' : 'Virtual'}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="border-3 border-black p-2 rounded w-full">
          <div className="flex gap-4 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-6 w-full">
            <div className="
              flex-shrink-0 
              border border-[#211F20] 
              rounded-[8px] sm:rounded-[10px] lg:rounded-[12px] xl:rounded-[16px]
              p-3 
              text-center 
              w-16
              h-fit
              flex flex-col items-center
            ">
              <div className="
                font-medium
                text-[#211F20]
                font-bricolage
                leading-[130%]
                uppercase
                text-[12px] sm:text-[12px] xl:text-[14px] 2xl:text-[16px]
              ">
                {dayOfWeek}
              </div>
              <div className="
                font-medium
                text-[#211F20]
                font-bricolage
                leading-normal
                text-[28px] sm:text-[30px] xl:text-[36px] 2xl:text-[40px]
              ">
                {day}
              </div>
              <div className="text-xs font-semibold text-gray-600">
                {month}
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-2 sm:gap-2 md:gap-[10px] lg:gap-3">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 relative">
                  <LocationIcon className="w-4 h-4 text-gray-600 shrink-0" />
                  {event.eventFormat === 'in-person' && event.venue && event.venue !== 'TBD' ? (
                    <div className="relative">
                      <button
                        onClick={() => setShowMapsMenu(prev => !prev)}
                        className="
                          font-medium font-bricolage leading-[130%] uppercase underline
                          text-[12px] sm:text-[12px] lg:text-[14px] 2xl:text-[16px]
                          text-[#0043F1] hover:text-[#0034BD] text-left
                        "
                      >
                        {event.venue}
                      </button>
                      {showMapsMenu && (
                        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden text-left">
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(event.venue)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setShowMapsMenu(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                          >
                            Google Maps
                          </a>
                          <a
                            href={`https://maps.apple.com/?q=${encodeURIComponent(event.venue)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setShowMapsMenu(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                          >
                            Apple Maps
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="
                      font-medium text-[#211F20] font-bricolage leading-[130%] uppercase
                      text-[12px] sm:text-[12px] lg:text-[14px] 2xl:text-[16px]
                    ">
                      {event.location}
                    </span>
                  )}
                </div>
                {event.eventFormat === 'in-person' && event.venue === 'TBD' && (
                  <span className="text-[11px] text-gray-400 font-bricolage leading-[130%] ml-6">
                    Location to be announced...
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <TimerIcon className="w-4 h-4 text-gray-600" />
                <span className="
                  font-medium
                  text-[#211F20]
                  font-bricolage
                  leading-[130%]
                  uppercase
                  text-[12px] sm:text-[12px] lg:text-[14px] 2xl:text-[16px]
                ">
                  {event.eventType || ''}{event.eventType && timeRange ? ' @ ' : ''}{timeRange}
                </span>
              </div>
              
              <div className="flex flex-col gap-0">
                <div className="text-sm text-gray-600">
                  Open Spots for Men: {Math.max(spotsData.menSpots - spotsData.menCount, 0)}/{spotsData.menSpots}
                </div>
                <div className="text-sm text-gray-600">
                  Open Spots for Women: {Math.max(spotsData.womenSpots - spotsData.womenCount, 0)}/{spotsData.womenSpots}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Button Logic – Upcoming shows Cancel Registration */}
        {type === 'upcoming' ? (
          <button
            onClick={() => onCancel && onCancel(event.firestoreID)}
            className="
              bg-red-500 
              text-white 
              font-medium 
              hover:bg-red-600 
              transition-colors 
              text-left
              rounded-lg
              py-2 sm:py-2 xl:py-2 2xl:py-2
              px-6 sm:px-5 xl:px-5 2xl:px-5
              font-poppins
              leading-normal
              text-[12px] sm:text-[12px] lg:text-[14px] 2xl:text-[16px]
            "
          >
            Cancel Registration
          </button>
        ) : (
          <button
            disabled={joining || (shouldShowWaitlist && waitlistClicked)}
            onClick={async () => {
              if (!event?.eventID) {
                setErrorMessage('Missing event ID');
                setShowErrorModal(true);
                return;
              }
              try {
                setJoining(true);
                if (shouldShowWaitlist) {
                  try {
                    if (!auth.currentUser) {
                      setErrorMessage('Please log in to join the waitlist.');
                      setShowErrorModal(true);
                      return;
                    }
                    await addToWaitlist(event.firestoreID, auth.currentUser.uid);
                    setWaitlistClicked(true);
                    setShowWaitlistModal(true);
                  } catch (err) {
                    console.error('Failed to add to waitlist:', err);
                    setErrorMessage('Failed to add to waitlist. Please try again.');
                    setShowErrorModal(true);
                  }
                  return;
                }

                if (onSignUp) {
                  console.log('[JOIN NOW] Calling onSignUp for event:', event);
                  const signUpResult = await onSignUp(event);
                  console.log('[JOIN NOW] onSignUp finished with result:', signUpResult);
                  if (signUpResult && signUpResult.success) {
                    console.log('[JOIN NOW] onSignUp successful');
                    return;
                  } else {
                    console.error('[JOIN NOW] onSignUp failed:', signUpResult);
                    const errorMsg = signUpResult?.message || 'Failed to sign up for event. Please try again.';
                    setErrorMessage(errorMsg);
                    setShowErrorModal(true);
                    return;
                  }
                }
                const functions = getFunctions();
                console.log('About to call getEventData');
                const getEventData = httpsCallable(functions, 'getEventData');
                const res = await getEventData({ eventId: event.eventID });
                console.log('getEventData response:', res);
                const { event: remoEvent } = res.data || {};
                if (!remoEvent) {
                  setErrorMessage('Event data not available yet.');
                  setShowErrorModal(true);
                  return;
                }
                if (auth.currentUser) {
                  await setDoc(
                    doc(db, 'users', auth.currentUser.uid),
                    {
                      latestEventId: event.eventID,
                    },
                    { merge: true }
                  );
                }
                console.log('[SIGNUP] All operations completed successfully');
              } catch (err) {
                console.error('Error fetching join URL:', err);
                setErrorMessage('Unable to fetch join link. Please try again later.');
                setShowErrorModal(true);
              } finally {
                setJoining(false);
              }
            }}
            className={`
              ${shouldShowWaitlist ? 'bg-orange-500 hover:bg-orange-600' : 'bg-[#211F20] hover:bg-gray-800'}
              text-white 
              font-medium 
              transition-colors 
              text-left
              rounded-lg
              py-2 sm:py-2 xl:py-2 2xl:py-2
              px-6 sm:px-5 xl:px-5 2xl:px-5
              font-poppins
              leading-normal
              text-[12px] sm:text-[12px] lg:text-[14px] 2xl:text-[16px]
              ${joining ? 'opacity-60 cursor-not-allowed' : ''}
              ${shouldShowWaitlist && waitlistClicked ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {joining ? 'Loading…' : 
             shouldShowWaitlist ? (waitlistClicked ? 'Added to Waitlist' : 'Waitlist') : 
             'Sign Up'}
          </button>
        )}
      </div>

      <PopUp
        isOpen={showWaitlistModal}
        onClose={() => setShowWaitlistModal(false)}
        title="Added to Waitlist!"
        subtitle="You've been added to the waitlist for this event. If spots become available, you'll be added automatically."
        icon="⏳"
        iconColor="orange"
        primaryButton={{
          text: "Got it!",
          onClick: () => setShowWaitlistModal(false)
        }}
      />

      <PopUp
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Sign Up Failed"
        subtitle={errorMessage}
        icon="✗"
        iconColor="red"
        primaryButton={{
          text: "Try Again",
          onClick: () => setShowErrorModal(false)
        }}
      />
    </>
  );
};

export default EventCard;