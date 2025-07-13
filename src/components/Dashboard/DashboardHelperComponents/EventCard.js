import React, { useState } from "react";
import { DateTime } from 'luxon';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../../../pages/firebaseConfig';

function getDateParts(dateString, timeString, timeZone) {
  const normalizedTime = timeString ? timeString.replace(/am|pm/i, match => match.toUpperCase()).trim() : '';
  const cleanDate = dateString ? dateString.trim() : '';
  const eventZoneMap = {
    'PST': 'America/Los_Angeles',
    'EST': 'America/New_York',
    'CST': 'America/Chicago',
    'MST': 'America/Denver',
  };
  const eventZone = eventZoneMap[timeZone] || timeZone || 'UTC';

  // Try ISO format first
  let eventDateTime = DateTime.fromFormat(
    `${cleanDate} ${normalizedTime}`,
    'yyyy-MM-dd h:mma',
    { zone: eventZone }
  );
  if (!eventDateTime.isValid) {
    eventDateTime = DateTime.fromFormat(
      `${cleanDate} ${normalizedTime}`,
      'yyyy-MM-dd H:mm',
      { zone: eventZone }
    );
  }
  // Try MM/dd/yy format if still invalid
  if (!eventDateTime.isValid) {
    eventDateTime = DateTime.fromFormat(
      `${cleanDate} ${normalizedTime}`,
      'MM/dd/yy h:mma',
      { zone: eventZone }
    );
  }
  if (!eventDateTime.isValid) {
    eventDateTime = DateTime.fromFormat(
      `${cleanDate} ${normalizedTime}`,
      'MM/dd/yy H:mm',
      { zone: eventZone }
    );
  }
  console.log('Parsing date:', cleanDate, 'time:', normalizedTime, 'zone:', eventZone, 'result:', eventDateTime.toString());
  if (!eventDateTime.isValid) return { dayOfWeek: '', day: '', month: '' };

  return {
    dayOfWeek: eventDateTime.toFormat('ccc').toUpperCase(),
    day: eventDateTime.toFormat('d'),
    month: eventDateTime.toFormat('LLL').toUpperCase(),
  };
}

const EventCard = ({ event, type, userGender, onSignUp, datesRemaining }) => {
  const [signUpClicked, setSignUpClicked] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  console.log('EventCard received userGender:', userGender, 'event:', event);
  const { dayOfWeek, day, month } = getDateParts(event.date, event.time, event.timeZone);
  
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
        {/* Age Range */}
        {event.ageRange && (
          <div className="text-lg font-semibold text-center text-gray-700 mb-1">
            Ages {event.ageRange}
          </div>
        )}
        {/* Title
        <div className="text-2xl font-medium text-center text-black">
          {event.title || "Event"}
        </div>  */}
        {/* Location */}
        <div className="text-base text-slate-600 text-center mt-2">
          {event.location && <span>{event.location} <br /></span>}
        </div>

        {/* Event Type and Time */}
        {(event.eventType || event.time) && (
          <div className="text-base text-slate-600 text-center mt-2">
            {event.eventType || ''}{event.eventType && event.time ? ' @ ' : ''}{event.time || ''}
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
                console.log('About to call getRemoJoinUrl');
                const getJoinLink = httpsCallable(functions, 'getRemoJoinUrl');
                // Some older Firestore docs may not have an explicit `eventID` field;
                // fall back to the document ID (`firestoreID`) when necessary.
                console.log('got here');
                const res = await getJoinLink({ eventId: event.eventID });
                console.log('getRemoJoinUrl response:', res);
                const { joinUrl } = res.data || {};
                if (joinUrl) {
                  window.open(joinUrl, '_blank');
                } else {
                  alert('Join link not available yet.');
                }
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
