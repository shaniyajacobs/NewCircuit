import React, { useState } from "react";
import { DateTime } from 'luxon';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../../../pages/firebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../pages/firebaseConfig';

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
  const [errorMessage, setErrorMessage] = useState('');
  console.log('EventCard received:', event);
  // Prefer Remo timestamp if available
  const dateParts = event.startTime ? getDatePartsFromMillis(event.startTime) : getDateParts(event.date, event.time, event.timeZone);
  const { dayOfWeek, day, month, timeLabel } = dateParts;
  
  return (
    <>
      <div
        className={
          "flex-col items-center p-8 rounded-2xl mr-[30px] bg-[#F3F3F3]"
        }
      >
        {/* Date Display */}
        <div style={{ border: '1px solid #222', borderRadius: '16px', width: 70, margin: '0 auto', padding: '8px 0', background: 'rgba(200,220,255,0.1)' }}>
          <div style={{ textAlign: 'center', fontWeight: 500, fontSize: 16 }}>{dayOfWeek}</div>
          <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 32 }}>{day}</div>
          <div style={{ textAlign: 'center', fontWeight: 500, fontSize: 16 }}>{month}</div>
        </div>
        {/* Event Title */}
        <div className="text-xl font-medium text-center text-black mt-2 mb-1">
          {event.name || event.title || 'Event'}
        </div>
        {/* Age Range */}
        {event.ageRange && (
          <div className="text-base font-semibold text-center text-gray-700 mt-1 mb-1">
            Ages {event.ageRange}
          </div>
        )}
        {/* Location */}
        <div className="text-base text-slate-600 text-center mt-2">
          {event.location && <span>{event.location} <br /></span>}
        </div>

        {/* Event Type and Time */}
        {(event.eventType || timeLabel) && (
          <div className="text-base text-slate-600 text-center mt-2">
            {event.eventType || ''}{event.eventType && timeLabel ? ' @ ' : ''}{timeLabel || ''}
          </div>
        )}
        {/* TimeZone */}
        <div className="text-base text-slate-600 text-center mt-2">
          {event.timeZone && <span>Time Zone: {event.timeZone}</span>}
        </div>
        {/* Spots Info */}
        <div className="text-base text-slate-600 text-center mt-2">
          <span>Open Spots for Men: {(() => {
            const total = Number(event.menSpots) || 0;
            const signedUp = Number(event.menSignupCount) || 0;
            return `${Math.max(total - signedUp, 0)}/${total}`;
          })()}</span>
          <br />
          <span>Open Spots for Women: {(() => {
            const total = Number(event.womenSpots) || 0;
            const signedUp = Number(event.womenSignupCount) || 0;
            return `${Math.max(total - signedUp, 0)}/${total}`;
          })()}</span>
        </div>
        {/* Sign Up / Wait List Button or Join Now for Upcoming */}
        {type === 'upcoming' ? (
          <button
            className="text-xs mt-5 p-1 text-center text-blue-500 cursor-pointer bg-white rounded-xl w-full disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={joining}
            onClick={async () => {
              if (!event?.eventID) {
                alert('Missing event ID');
                return;
              }
              try {
                setJoining(true);
                const functions = getFunctions();
                console.log('About to call getEventData');
                const getEventData = httpsCallable(functions, 'getEventData'); // returns full event
                const res = await getEventData({ eventId: event.eventID });
                console.log('getEventData response:', res);
                const { event: remoEvent } = res.data || {};
                if (!remoEvent) {
                  alert('Event data not available yet.');
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
                // Build join URL on the client
                const joinUrl = `https://live.remo.co/e/${remoEvent.code}`;
                window.open(joinUrl, '_blank');
              } catch (err) {
                console.error('Error fetching join URL:', err);
                alert('Unable to fetch join link. Please try again later.');
              } finally {
                setJoining(false);
              }
            }}
          >
            {joining ? 'Loading…' : 'Join Now'}
          </button>
        ) : (() => {
          // Parse numbers for comparison
          const menCount = Number(event.menSignupCount);
          const menMax = Number(event.menSpots);
          const womenCount = Number(event.womenSignupCount);
          const womenMax = Number(event.womenSpots);
          // Use userGender prop for logic
          if (typeof userGender === 'string' && userGender.toLowerCase() === 'female') {
            if (womenMax > 0 && womenCount < womenMax) {
              return (
                <button
                  className="text-xs mt-5 p-1 text-center text-blue-500 cursor-pointer bg-white rounded-xl w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!(Number.isInteger(datesRemaining) && datesRemaining > 0) || signUpClicked}
                  onClick={async () => { 
                    try {
                      console.log('🔄 Starting sign-up process...');
                      setSignUpClicked(true);
                      
                      // Call the original onSignUp function first
                      console.log('📝 Calling original onSignUp function...');
                      await onSignUp(event);
                      console.log('✅ Original sign-up completed');
                      
                      // Then add user to Remo event if eventID exists
                      if (event.eventID && auth.currentUser) {
                        console.log('🔄 Adding user to Remo event...');
                        const functions = getFunctions();
                        const addUserToRemoEvent = httpsCallable(functions, 'addUserToRemoEvent');
                        
                        await addUserToRemoEvent({ 
                          eventId: event.eventID, 
                          userEmail: auth.currentUser.email 
                        });
                        console.log('✅ User added to Remo event successfully');
                        console.log('🎉 Showing success modal...');
                        setShowSuccessModal(true);
                      } else {
                        console.log('⚠️ No eventID or user not logged in, skipping Remo integration');
                        setShowSuccessModal(true);
                      }
                    } catch (error) {
                      console.error('❌ Error signing up for event:', error);
                      setSignUpClicked(false);
                      setErrorMessage('Sign up is not working. Please try again later.');
                      setShowErrorModal(true);
                    }
                  }}
                >
                  Sign Up
                </button>
              );
            } else {
              return (
                <div className="text-xs mt-5 p-1 text-center text-blue-500 bg-white rounded-xl w-full opacity-50 cursor-not-allowed">
                  Join Wait List
                </div>
              );
            }
          } else if (typeof userGender === 'string' && userGender.toLowerCase() === 'male') {
            if (menMax > 0 && menCount < menMax) {
              return (
                <button
                  className="text-xs mt-5 p-1 text-center text-blue-500 cursor-pointer bg-white rounded-xl w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={datesRemaining === 0 || signUpClicked}
                  onClick={async () => { 
                    try {
                      console.log('🔄 Starting sign-up process...');
                      setSignUpClicked(true);
                      
                      // Call the original onSignUp function first
                      console.log('📝 Calling original onSignUp function...');
                      await onSignUp(event);
                      console.log('✅ Original sign-up completed');
                      
                      // Then add user to Remo event if eventID exists
                      if (event.eventID && auth.currentUser) {
                        console.log('🔄 Adding user to Remo event...');
                        const functions = getFunctions();
                        const addUserToRemoEvent = httpsCallable(functions, 'addUserToRemoEvent');
                        
                        await addUserToRemoEvent({ 
                          eventId: event.eventID, 
                          userEmail: auth.currentUser.email 
                        });
                        console.log('✅ User added to Remo event successfully');
                        console.log('🎉 Showing success modal...');
                        setShowSuccessModal(true);
                      } else {
                        console.log('⚠️ No eventID or user not logged in, skipping Remo integration');
                        setShowSuccessModal(true);
                      }
                    } catch (error) {
                      console.error('❌ Error signing up for event:', error);
                      setSignUpClicked(false);
                      setErrorMessage('Sign up is not working. Please try again later.');
                      setShowErrorModal(true);
                    }
                  }}
                >
                  Sign Up
                </button>
              );
            } else {
              return (
                <div className="text-xs mt-5 p-1 text-center text-blue-500 bg-white rounded-xl w-full opacity-50 cursor-not-allowed">
                  Join Wait List
                </div>
              );
            }
          } else {
            // fallback: allow sign up if either has space
            const hasSpace = (menMax > 0 && menCount < menMax) || (womenMax > 0 && womenCount < womenMax);
            if (hasSpace) {
              return (
                <button
                  className="text-xs mt-5 p-1 text-center text-blue-500 cursor-pointer bg-white rounded-xl w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={datesRemaining === 0 || signUpClicked}
                  onClick={async () => { 
                    try {
                      console.log('🔄 Starting sign-up process...');
                      setSignUpClicked(true);
                      
                      // Call the original onSignUp function first
                      console.log('📝 Calling original onSignUp function...');
                      await onSignUp(event);
                      console.log('✅ Original sign-up completed');
                      
                      // Then add user to Remo event if eventID exists
                      if (event.eventID && auth.currentUser) {
                        console.log('🔄 Adding user to Remo event...');
                        const functions = getFunctions();
                        const addUserToRemoEvent = httpsCallable(functions, 'addUserToRemoEvent');
                        
                        await addUserToRemoEvent({ 
                          eventId: event.eventID, 
                          userEmail: auth.currentUser.email 
                        });
                        console.log('✅ User added to Remo event successfully');
                        console.log('🎉 Showing success modal...');
                        setShowSuccessModal(true);
                      } else {
                        console.log('⚠️ No eventID or user not logged in, skipping Remo integration');
                        setShowSuccessModal(true);
                      }
                    } catch (error) {
                      console.error('❌ Error signing up for event:', error);
                      setSignUpClicked(false);
                      setErrorMessage('Sign up is not working. Please try again later.');
                      setShowErrorModal(true);
                    }
                  }}
                >
                  Sign Up
                </button>
              );
            } else {
              return (
                <div className="text-xs mt-5 p-1 text-center text-blue-500 bg-white rounded-xl w-full opacity-50 cursor-not-allowed">
                  Join Wait List
                </div>
              );
            }
          }
        })()}
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="text-center">
              <div className="text-green-500 text-4xl mb-4">✓</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Successfully Signed Up!
              </h3>
              <p className="text-gray-600 mb-4">
                You've been successfully signed up for this event. Please check your email for the virtual event invitation.
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-4">✗</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Sign Up Failed
              </h3>
              <p className="text-gray-600 mb-4">
                {errorMessage}
              </p>
              <button
                onClick={() => setShowErrorModal(false)}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EventCard;
