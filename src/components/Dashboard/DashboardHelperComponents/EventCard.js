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

  // Build candidate format strings.
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
    // As a last resort, let Luxon try ISO parsing.
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

// Helper for Remo epoch timestamps
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

const EventCard = ({ event, type, userGender, onSignUp, datesRemaining }) => {
  const [signUpClicked, setSignUpClicked] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [waitlistClicked, setWaitlistClicked] = useState(false);
  const [spotsData, setSpotsData] = useState({ menCount: 0, womenCount: 0, menSpots: 0, womenSpots: 0 });
  
  // Prefer Remo timestamp if available
  const dateParts = event.startTime ? getDatePartsFromMillis(event.startTime) : getDateParts(event.date, event.time, event.timeZone);
  const { dayOfWeek, day, month, timeLabel } = dateParts;
  
  // Fetch reliable spot data
  useEffect(() => {
    const fetchSpots = async () => {
      if (event?.firestoreID) {
        const spots = await getEventSpots(event.firestoreID);
        setSpotsData(spots);
      }
    };
    fetchSpots();
  }, [event?.firestoreID]);



  // Calculate time range for display
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
  
  // Check if there are 0 available spots for the user's gender
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
  
  // Check if user is already on waitlist when component loads
  useEffect(() => {
    const checkIfUserOnWaitlist = async () => {
      if (event?.firestoreID && auth.currentUser && shouldShowWaitlist) {
        try {
          const waitlistDoc = await getDoc(doc(db, 'events', event.firestoreID, 'waitlist', auth.currentUser.uid));
          if (waitlistDoc.exists()) {
            setWaitlistClicked(true);
            console.log('✅ User already on waitlist for this event');
          }
        } catch (error) {
          console.error('Error checking waitlist status:', error);
        }
      }
    };

    checkIfUserOnWaitlist();
  }, [event?.firestoreID, auth.currentUser, shouldShowWaitlist]);
  
  // Function to add user to waitlist in Firebase
  const addToWaitlist = async (eventId, userId) => {
    try {
      // Get current user data to store comprehensive information
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      // Get user profile data from Firestore to match signup process
      let userProfile = null;
      try {
        const userProfileDoc = await getDoc(doc(db, 'users', userId));
        if (userProfileDoc.exists()) {
          userProfile = userProfileDoc.data();
        }
      } catch (error) {
        console.log('Could not fetch user profile, using fallback data');
      }

      // Add user to waitlist subcollection with the exact same fields as signup
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
      console.log('✅ User added to waitlist successfully with comprehensive data');
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


        {/* Remo Event Title - above age range */}
        <div className="border-3 border-black p-2 rounded mb-[-20px]">  
            {event.title && (
              <div className="font-medium text-[#211F20] font-bricolage leading-[130%] text-[14px] sm:text-[16px] lg:text-[20px] 2xl:text-[24px]">
                {event.title}
              </div>
            )}
          </div>
        
        {/* Age Range - Top */}
        {event.ageRange && (
          <div className="border-3 border-black p-2 rounded">
            <div className="
              font-medium
              text-[#211F20]
              font-bricolage
              leading-[130%]
              text-[14px] sm:text-[16px] lg:text-[20px] 2xl:text-[24px]
            ">
              Ages {event.ageRange}
            </div>
          </div>
        )}

        {/* Main Content with Date and Event Info */}
        <div className="border-3 border-black p-2 rounded w-full">
          <div className="flex gap-4 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-6 w-full">
            {/* Date Box */}
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

            {/* Event Info */}
            <div className="flex-1 flex flex-col gap-2 sm:gap-2 md:gap-[10px] lg:gap-3">
              {/* Location */}
              <div className="flex items-center gap-2">
                <LocationIcon className="w-4 h-4 text-gray-600" />
                <span className="
                  font-medium
                  text-[#211F20]
                  font-bricolage
                  leading-[130%]
                  uppercase
                  text-[12px] sm:text-[12px] lg:text-[14px] 2xl:text-[16px]
                ">
                  {event.location}
                </span>
              </div>
              
              {/* Time */}
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
              
              {/* Open Spots Group */}
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

        {/* Sign Up / Wait List Button or Join Now for Upcoming */}
        {type === 'upcoming' ? (
          <button
            disabled={joining}
            onClick={async () => {
              if (!event?.eventID) {
                alert('Missing event ID');
                return;
              }
              
              // Prevent multiple clicks
              if (joining) return;
              
              try {
                setJoining(true);
                console.log('[JOIN NOW] Starting join process for event:', event.eventID);
                
                // Step 1: Handle onSignUp if provided (non-blocking with timeout)
                if (onSignUp) {
                  console.log('[JOIN NOW] Calling onSignUp for event:', event);
                  try {
                    // Add a timeout for the onSignUp function to prevent hanging
                    const signUpPromise = onSignUp(event);
                    const timeoutPromise = new Promise((_, reject) => 
                      setTimeout(() => reject(new Error('SignUp timeout')), 15000) // 15 second timeout
                    );
                    
                    await Promise.race([signUpPromise, timeoutPromise]);
                    console.log('[JOIN NOW] onSignUp finished successfully');
                  } catch (signUpError) {
                    console.error('[JOIN NOW] onSignUp failed or timed out:', signUpError);
                    // Continue anyway - don't fail the entire process
                  }
                }
                
                // Step 2: Get event data from Remo
                console.log('[JOIN NOW] Fetching event data from Remo...');
                const functions = getFunctions();
                const getEventData = httpsCallable(functions, 'getEventData');
                const res = await getEventData({ eventId: event.eventID });
                console.log('[JOIN NOW] getEventData response:', res);
                
                const { event: remoEvent } = res.data || {};
                if (!remoEvent || !remoEvent.code) {
                  throw new Error('Event data not available yet or missing event code.');
                }
                
                // Step 3: Record the latest event this user joined (non-blocking)
                if (auth.currentUser) {
                  try {
                    // Don't await this - make it non-blocking
                    setDoc(
                      doc(db, 'users', auth.currentUser.uid),
                      {
                        latestEventId: event.eventID,
                      },
                      { merge: true }
                    ).then(() => {
                      console.log('[JOIN NOW] Recorded latest event ID');
                    }).catch((recordError) => {
                      console.error('[JOIN NOW] Failed to record latest event ID:', recordError);
                    });
                  } catch (recordError) {
                    console.error('[JOIN NOW] Failed to record latest event ID:', recordError);
                    // Continue anyway
                  }
                }
                
                // Step 4: Build and open join URL
                const joinUrl = `https://live.remo.co/e/${remoEvent.code}`;
                console.log('[JOIN NOW] Join URL:', joinUrl);
                
                // Mobile-friendly approach for opening URLs
                const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                console.log('[JOIN NOW] Is mobile device:', isMobile);
                
                if (isMobile) {
                  // For mobile devices, try multiple approaches
                  let success = false;
                  
                  // Approach 1: Try using window.location.href (most reliable for mobile)
                  try {
                    console.log('[JOIN NOW] Mobile: Trying window.location.href');
                    window.location.href = joinUrl;
                    success = true;
                  } catch (error1) {
                    console.error('[JOIN NOW] Mobile: window.location.href failed:', error1);
                  }
                  
                  // Approach 2: If Approach 1 failed, try creating and clicking a link
                  if (!success) {
                    try {
                      console.log('[JOIN NOW] Mobile: Trying programmatic link click');
                      const link = document.createElement('a');
                      link.href = joinUrl;
                      link.target = '_blank';
                      link.rel = 'noopener noreferrer';
                      link.style.display = 'none';
                      document.body.appendChild(link);
                      link.click();
                      
                      // Clean up the link after a short delay
                      setTimeout(() => {
                        if (document.body.contains(link)) {
                          document.body.removeChild(link);
                        }
                      }, 1000);
                      
                      success = true;
                    } catch (error2) {
                      console.error('[JOIN NOW] Mobile: Programmatic link click failed:', error2);
                    }
                  }
                  
                  // Approach 3: If both failed, show URL to copy
                  if (!success) {
                    console.log('[JOIN NOW] Mobile: All navigation methods failed, showing URL to copy');
                    alert(`Please copy and paste this URL into your browser:\n${joinUrl}`);
                  }
                } else {
                  // For desktop, try to open in new tab/window
                  try {
                    console.log('[JOIN NOW] Desktop: Trying window.open');
                    const newWindow = window.open(joinUrl, '_blank');
                    
                    // Check if the window was blocked or failed to open
                    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                      console.log('[JOIN NOW] Desktop: window.open failed, showing URL to copy');
                      alert(`Please copy and paste this URL into your browser:\n${joinUrl}`);
                    }
                  } catch (windowError) {
                    console.error('[JOIN NOW] Desktop: Error opening window:', windowError);
                    alert(`Please copy and paste this URL into your browser:\n${joinUrl}`);
                  }
                }
                
                console.log('[JOIN NOW] Join process completed successfully');
              } catch (err) {
                console.error('[JOIN NOW] Error in join process:', err);
                alert(`Error: ${err.message || 'Unable to fetch join link. Please try again later.'}`);
              } finally {
                console.log('[JOIN NOW] Setting joining to false');
                setJoining(false);
              }
            }}
            className={`
              bg-[#211F20] 
              text-white 
              font-medium 
              hover:bg-gray-800 
              transition-colors 
              text-left
              rounded-lg
              py-2 sm:py-2 xl:py-2 2xl:py-2
              px-6 sm:px-5 xl:px-5 2xl:px-5
              font-poppins
              leading-normal
              text-[12px] sm:text-[12px] lg:text-[14px] 2xl:text-[16px]
              ${joining ? 'opacity-60 cursor-not-allowed' : ''}
            `}
          >
            {joining ? 'Loading…' : 'Join Now'}
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
                  return; // ✅ stop here, do NOT run signup flow
                }

                if (onSignUp) {
                  console.log('[JOIN NOW] Calling onSignUp for event:', event);
                  await onSignUp(event);
                  console.log('[JOIN NOW] onSignUp finished');
                }
                const functions = getFunctions();
                console.log('About to call getEventData');
                const getEventData = httpsCallable(functions, 'getEventData'); // returns full event
                const res = await getEventData({ eventId: event.eventID });
                console.log('getEventData response:', res);
                const { event: remoEvent } = res.data || {};
                if (!remoEvent) {
                  setErrorMessage('Event data not available yet.');
                  setShowErrorModal(true);
                  return;
                }
                // Record the latest event this user joined
                if (auth.currentUser) {
                  await setDoc(
                    doc(db, 'users', auth.currentUser.uid),
                    {
                      latestEventId: event.eventID,
                    },
                    { merge: true }
                  );
                }
                setShowSuccessModal(true);
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
            {joining ? 'Loading…' : shouldShowWaitlist ? (waitlistClicked ? 'Added to Waitlist' : 'Waitlist') : 'Sign Up'}
          </button>
        )}
      </div>

      {/* Success Modal */}
      <PopUp
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Successfully Signed Up!"
        subtitle="You've been successfully signed up for this event. Please check your email for the virtual event invitation."
        icon="✓"
        iconColor="green"
        primaryButton={{
          text: "Got it!",
          onClick: () => setShowSuccessModal(false)
        }}
      />

      {/* Waitlist Modal */}
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

      {/* Error Modal */}
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
