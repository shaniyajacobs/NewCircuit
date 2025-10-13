import React, { useEffect, useState, forwardRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaPaperPlane } from 'react-icons/fa';
import { IoChevronBackCircleOutline, IoPersonCircle } from 'react-icons/io5';
import { doc, getDoc, getDocs, collection, setDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { auth, db } from '../../../pages/firebaseConfig';
import {DashMessages} from './DashMessages';
import { calculateAge } from '../../../utils/ageCalculator';
import { filterByGenderPreference } from '../../../utils/genderPreferenceFilter';
import homeSelectMySparks from '../../../images/home_select_my_sparks.jpg';
import imgNoise from '../../../images/noise.png';
import { ReactComponent as SmallFlashIcon } from '../../../images/small_flash.svg';
import { formatUserName } from '../../../utils/nameFormatter';
import { DateTime } from 'luxon';
import { markSparkAsRead, isSparkNew, markSparkAsViewed, refreshSidebarNotification } from '../../../utils/notificationManager';
import { getFunctions, httpsCallable } from 'firebase/functions';

const MAX_SELECTIONS = 3;

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
    
    return hoursSinceEvent <= 48;
  } catch (error) {
    console.error('[48HOURS] Error checking event time:', error);
    return false;
  }
}

const DashMyConnections = forwardRef(({ onConnectionSelect, onConnectionDeselect }, ref) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [showSelectSparksCard, setShowSelectSparksCard] = useState(false);
  const [selectingMatches, setSelectingMatches] = useState(false);

  // Error modal state for informative popups (e.g., missing event)
  const [errorModal, setErrorModal] = useState({
    open: false,
    title: '',
    message: '',
  });

  // Handle matches click function
  const handleMatchesClick = async () => {
    setSelectingMatches(true);
    try {
      console.log('[DASHMYCONNECTIONS] handleMatchesClick started');
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('[DASHMYCONNECTIONS] No authenticated user found');
        setSelectingMatches(false);
        return;
      }

      // 1. Get latestEventId from user doc
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const latestEventId = userDoc.data()?.latestEventId;
      if (!latestEventId) {
        console.log('[DASHMYCONNECTIONS] No latestEventId found, showing error modal');
        setErrorModal({
          open: true,
          title: "No Event Found",
          message: "You have not joined any events yet, or the event you are trying to access does not exist.",
        });
        return;
      }
      console.log('[DASHMYCONNECTIONS] latestEventId:', latestEventId);

      // 2. Find the event doc where eventID === latestEventId
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      let eventDocId = null;
      eventsSnapshot.forEach(docSnap => {
        if (docSnap.data().eventID === latestEventId) {
          eventDocId = docSnap.id;
        }
      });
      if (!eventDocId) {
        console.log('[DASHMYCONNECTIONS] Event not found, showing error modal');
        setErrorModal({
          open: true,
          title: "Event Not Found",
          message: "The event you are trying to access could not be found. It may have been removed or is no longer available.",
        });
        return;
      }
      console.log('[DASHMYCONNECTIONS] Found event doc ID:', eventDocId);

      // 3. Get signedUpUsers subcollection from that event doc
      const signedUpUsersCol = collection(db, 'events', eventDocId, 'signedUpUsers');
      const signedUpUsersSnap = await getDocs(signedUpUsersCol);
      const userIds = signedUpUsersSnap.docs.map(d => d.id);
      console.log('[DASHMYCONNECTIONS] User IDs from signedUpUsers:', userIds);

      // 4. Fetch quiz responses and user profiles for each user ID
      const quizResponses = [];
      const userProfiles = [];
      
      for (const uid of userIds) {
        const quizDocRef = doc(db, 'users', uid, 'quizResponses', 'latest');
        const userProfileRef = doc(db, 'users', uid);
        
        console.log(`[DASHMYCONNECTIONS] Fetching quiz and profile for user ${uid}`);
        
        const [quizDoc, userProfileDoc] = await Promise.all([
          getDoc(quizDocRef),
          getDoc(userProfileRef)
        ]);
        
        console.log(`[DASHMYCONNECTIONS] Quiz exists for user ${uid}:`, quizDoc.exists());
        console.log(`[DASHMYCONNECTIONS] Profile exists for user ${uid}:`, userProfileDoc.exists());
        
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
        console.log('[DASHMYCONNECTIONS] No quiz answers found for current user');
        alert('You must complete your quiz to get matches.');
        return;
      }

      if (!currentUserProfile) {
        console.log('[DASHMYCONNECTIONS] No user profile found for current user');
        alert('User profile not found. Please complete your profile setup.');
        return;
      }

      // 6. Filter other users by gender preference
      const otherUsers = quizResponses.filter(q => q.userId !== currentUser.uid);
      const otherUserProfiles = userProfiles.filter(p => p.userId !== currentUser.uid);
      
      console.log('[DASHMYCONNECTIONS] Before gender filtering:', {
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
      
      console.log('[DASHMYCONNECTIONS] After gender filtering:', {
        filteredUsers: filteredUsers.length,
        filteredUserIds: filteredUsers.map(u => u.userId)
      });

      // 7. Run matchmaking algorithm only on filtered users
      const { getTopMatches } = await import('../../Matchmaking/Synergies.js');
      const matches = getTopMatches(currentUserAnswers, filteredUsers); // [{ userId, score }]

      console.log('[DASHMYCONNECTIONS] Final matches:', matches);

      // 8. Save matches to Firestore
      await setDoc(doc(db, 'matches', currentUser.uid), {
        timestamp: serverTimestamp(),
        results: matches
      });

      // 9. Redirect to MyMatches
      console.log('[DASHMYCONNECTIONS] Navigating to myMatches');
      navigate('/dashboard/myMatches');
    } catch (error) {
      console.error('[DASHMYCONNECTIONS] Error in handleMatchesClick:', error);
      // Fallback: try to navigate directly even if matchmaking fails
      try {
        console.log('[DASHMYCONNECTIONS] Attempting fallback navigation to myMatches');
        navigate('/dashboard/myMatches');
      } catch (navError) {
        console.error('[DASHMYCONNECTIONS] Fallback navigation also failed:', navError);
        setErrorModal({
          open: true,
          title: "Error",
          message: "An error occurred while processing your matches. Please try again.",
        });
      }
    } finally {
      setSelectingMatches(false);
    }
  };

  // Simple direct navigation function as backup
  const handleDirectMatchesClick = () => {
    console.log('[DASHMYCONNECTIONS] Direct navigation to myMatches');
    navigate('/dashboard/myMatches');
  };

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };
    fetchUserProfile();
  }, []);

  // Handle navigation state from Current Sparks section
  useEffect(() => {
    if (location.state?.selectedConnectionId && connections.length > 0) {
      const connectionToSelect = connections.find(conn => conn.id === location.state.selectedConnectionId);
      if (connectionToSelect) {
        setSelectedConnection(connectionToSelect);
        onConnectionSelect?.(connectionToSelect);
        // Clear the state to prevent auto-selection on subsequent renders
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, connections]);

  // Check if user should see the "Select my sparks" card
  useEffect(() => {
    let intervalId;
    let isUnmounted = false;
    const checkSelectSparksCard = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) return;

        const data = userDoc.data();
        console.log('[SELECTSPARKS] User data:', { latestEventId: data.latestEventId, hasConnections: data.connections });
        
        // Check if latest event was within 48 hours
        const within48Hours = await isLatestEventWithin48Hours(user.uid);
        console.log('[SELECTSPARKS] Within 48 hours:', within48Hours);
        
        // Note: We're not checking max selections here anymore
        // This allows users to select connections for new events
        // The MAX_SELECTIONS limit is enforced during the selection process in SeeAllMatches
        let hasMaxSelections = false;
        
        const shouldShow = within48Hours && !hasMaxSelections;
        console.log('[SELECTSPARKS] Final decision - show banner:', shouldShow, { within48Hours, hasMaxSelections });
        if (!isUnmounted) setShowSelectSparksCard(shouldShow);
      } catch (error) {
        console.error('Error checking select sparks card:', error);
        if (!isUnmounted) setShowSelectSparksCard(false);
      }
    };

    // Initial check and then poll every 60s so the banner auto-hides after 48h
    checkSelectSparksCard();
    intervalId = setInterval(checkSelectSparksCard, 60000);
    return () => {
      isUnmounted = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const fetchConnections = async () => {
      const user = auth.currentUser;
      if (!user) return;
      
      setLoading(true);
      try {
        // Get all connections
        const connectionsSnap = await getDocs(collection(db, 'users', user.uid, 'connections'));
        const connectionIds = connectionsSnap.docs.map(doc => doc.id);
        
        // Fetch profile data for each connection and check for mutual status
        const connectionProfiles = await Promise.all(
          connectionIds.map(async (connectionId) => {
            try {
              const userDoc = await getDoc(doc(db, 'users', connectionId));
              if (!userDoc.exists()) {
                return null;
              }
              
              // Get the connection document to retrieve the match score and status
              const connectionDoc = await getDoc(doc(db, 'users', user.uid, 'connections', connectionId));
              const connectionData = connectionDoc.exists() ? connectionDoc.data() : {};
              
              // Only include mutual connections
              if (connectionData.status !== 'mutual') {
                return null;
              }
              
              const userData = userDoc.data();
              const profile = {
                id: connectionId,
                name: formatUserName(userData),
                img: userData.image || null,
                age: calculateAge(userData.birthDate),
                // Use the actual AI match score stored when connection was created, rounded
                compatibility: Math.round(connectionData.matchScore || 0)
              };
              
              return profile;
            } catch (err) {
              return null;
            }
          })
        );
        
        const validProfiles = connectionProfiles.filter(Boolean);
        
        // Check for new sparks using the notification manager
        const connectionsWithNewFlag = await Promise.all(
          validProfiles.map(async (conn) => {
            const isNew = await isSparkNew(conn.id);
            return {
              ...conn,
              isNewSpark: isNew
            };
          })
        );
        
        setConnections(connectionsWithNewFlag);
        
        // Note: We don't hide the select sparks card here anymore
        // The MAX_SELECTIONS limit is enforced during the selection process in SeeAllMatches
      } catch (err) {
        setConnections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, []);

  const ConnectionList = () => {
    if (loading) {
      return <div className="flex flex-col px-7 w-full max-md:px-5">
        <div className="text-center py-8 text-gray-600">Loading Sparks...</div>
      </div>;
    }

    if (connections.length === 0) {
      return <div className="flex flex-col px-7 w-full max-md:px-5">
        <div className="text-center py-8 text-gray-600">
        No sparks yet. When both you and someone from your connections select one another, they'll appear here! 
        </div>
      </div>;
    }

    return (
      <div className="flex flex-col items-start gap-4 w-full">
        {connections.map(connection => (
          <div
            key={connection.id}
            className="flex items-center p-6 w-full bg-white rounded-2xl shadow-sm border border-[rgba(33,31,32,0.25)]"
          >
            {/* Red dot for new sparks */}
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '100px',
                background: connection.isNewSpark ? '#FF4848' : '#FFF',
                display: 'inline-block',
                border: '1px solid #E5E7EB', // subtle border for white dot
                marginRight: '8px',
              }}
            />
            
            {/* Profile picture */}
            {connection.img ? (
              <div className="flex w-12 h-12 justify-center items-center rounded-full border border-[rgba(33,31,32,0.25)] bg-cover bg-center bg-no-repeat mr-4 overflow-hidden"
                   style={{ backgroundImage: `url(${connection.img})` }}>
              </div>
            ) : (
              <div className="flex w-12 h-12 justify-center items-center rounded-full border border-[rgba(33,31,32,0.25)] bg-gray-200 mr-4 overflow-hidden">
                <IoPersonCircle className="w-16 h-16 text-gray-400 transform scale-125" />
              </div>
            )}
            
            {/* Name and age */}
            <div className="text-[#211F20] font-poppins text-body-m-med font-medium leading-[110%] mr-6">
              {connection.name}, {connection.age}
            </div>

            {/* Compatibility badge */}
            <div className="flex px-2 py-2 justify-center items-center gap-[10px] rounded-[100px] border border-[rgba(33,31,32,0.10)] mr-6"
                 style={{
                   background: 'radial-gradient(50% 50% at 50% 50%, rgba(226, 255, 101, 0.50) 0%, rgba(210, 255, 215, 0.50) 100%)'
                 }}>
              <span className="text-[#211F20] font-bricolage text-h8 font-medium leading-[130%] uppercase">
                {connection.compatibility}% COMPATIBILITY
              </span>
            </div>

            {/* Compatibility line */}
            <div className="flex-1 h-1 rounded-[24px] bg-gray-200 mr-6 relative">
              <div 
                className="h-1 rounded-[24px] bg-[#211F20] absolute top-0 left-0"
                style={{ width: `${connection.compatibility}%` }}
              ></div>
            </div>

            {/* Message button */}
            <button 
              onClick={async () => {
                // Mark the spark as read when user clicks message
                if (connection.isNewSpark) {
                  await markSparkAsRead(connection.id);
                  await markSparkAsViewed(connection.id); // Mark as viewed
                  // Update the local state to remove the red dot
                  setConnections(prevConnections => 
                    prevConnections.map(conn => 
                      conn.id === connection.id 
                        ? { ...conn, isNewSpark: false }
                        : conn
                    )
                  );
                  
                  // Force refresh of sidebar notification state
                  await refreshSidebarNotification();
                }
                setSelectedConnection(connection);
              }}
              className="flex px-6 py-3 justify-center items-center gap-3 rounded-lg bg-[#211F20]"
            >
              {/* Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M6.16641 5.2668L13.2414 2.90846C16.4164 1.85013 18.1414 3.58346 17.0914 6.75846L14.7331 13.8335C13.1497 18.5918 10.5497 18.5918 8.96641 13.8335L8.26641 11.7335L6.16641 11.0335C1.40807 9.45013 1.40807 6.85846 6.16641 5.2668Z" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8.42529 11.3745L11.4086 8.38281" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              
              {/* Message text */}
              <span className="text-white font-poppins text-body-s-med font-medium leading-normal">
                Message
              </span>
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-7 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)] max-md:p-5 min-h-screen">
      {/* Sparks heading */}
      <h2
        className="
          font-semibold
          text-[#211F20]
          leading-[110%]
          font-bricolage
          text-[24px] sm:text-[28px] md:text-[32px]
          mb-2
        "
      >
        Sparks
      </h2>

      {/* Select my sparks card */}
      {showSelectSparksCard && (
        <div className="relative w-full rounded-2xl overflow-hidden min-h-[103px] flex items-center mb-6">
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
            <div className="flex gap-2">
              <button
                onClick={handleMatchesClick}
                onDoubleClick={handleDirectMatchesClick}
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
        </div>
      )}

      {selectedConnection == null ? (
        <ConnectionList />
      ) : (
        <div>
          <DashMessages 
            connection={selectedConnection} 
            onBack={() => {
              setSelectedConnection(null);
              onConnectionDeselect?.();
            }} 
          />
        </div>
      )}

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
    </div>
  );
});

export default DashMyConnections;

