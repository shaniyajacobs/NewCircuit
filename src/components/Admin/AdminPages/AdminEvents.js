import React, { useState, useEffect } from 'react';
import { db } from '../../../pages/firebaseConfig';
import { collection, getDocs, deleteDoc, doc, addDoc, updateDoc, query, where, getDoc, increment } from 'firebase/firestore';
import { FaSearch, FaTrash, FaPlus, FaEdit } from 'react-icons/fa';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { DateTime } from 'luxon';
import { signOutFromEvent, calculateActualCounts, reconcileCounts, clearLatestEventIdIfNeeded } from '../../../utils/eventSpotsUtils';
import { formatUserName } from '../../../utils/nameFormatter';
import { sortEventsByDate } from '../../../utils/eventSorter';

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [hoverEventId, setHoverEventId] = useState(null); // for ID tooltip on hover
  const [showEditModal, setShowEditModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    eventID: '',
    location: '',
    menSpots: '',
    womenSpots: '',
    ageRange: '',
    eventType: ''
  });
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [eventUsers, setEventUsers] = useState([]);
  const [maleUsers, setMaleUsers] = useState([]);
  const [femaleUsers, setFemaleUsers] = useState([]);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [selectedUserToDelete, setSelectedUserToDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);

  const LOCATION_OPTIONS = [
    'Atlanta',
    'Chicago',
    'Dallas',
    'Houston',
    'Los Angeles',
    'Miami',
    'New York City',
    'San Francisco / Bay Area',
    'Seattle',
    'Washington D.C.'
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const functionsInst = getFunctions();
      const getEventDataCF = httpsCallable(functionsInst, 'getEventData');

      const eventsList = await Promise.all(
        eventsSnapshot.docs.map(async (d) => {
          const meta = d.data();
          const eventId = meta.eventID || d.id;
          try {
            const res = await getEventDataCF({ eventId });
            const remo = res.data?.event || {};
            return { id: d.id, ...remo, ...meta }; // Firebase meta (eventType etc.) overrides
          } catch (e) {
            console.error('Remo fetch fail', e);
            return { id: d.id, ...meta };
          }
        })
      );
      
      // Sort events chronologically from newest to oldest
      const sortedEvents = sortEventsByDate(eventsList);
      setEvents(sortedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = (event) => {
    setSelectedEvent(event);
    setShowDeleteModal(true);
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setShowEditModal(true);
  };

  const handleShowUsers = async (event) => {
    setSelectedEvent(event);
    setShowUsersModal(true);
    setLoadingUsers(true);
    try {
      const functionsInst = getFunctions();
      const getMembers = httpsCallable(functionsInst, 'getEventMembers');
      // The Callable result comes back as an object: { data: <actualArray> }
      const res = await getMembers({ eventId: event.eventID });

      const attendees = Array.isArray(res?.data) ? res.data : [];

      // Normalize Remo attendees and fetch Firebase information
      const remoUsers = await Promise.all(attendees.map(async (a) => {
        const profile = a.user?.profile || {};
        const nameCombined = profile.name || formatUserName(profile);

        const email = a.user?.email || a.invite?.email || '-';

        const status = a.status || a.invite?.status || '-';
        const accepted = (a.invite?.isAccepted ?? (status === 'accepted')) ? 'Yes' : 'No';

        // Try to find Firebase profile for this Remo user
        let firebaseUserName = null;
        let firebaseUserGender = null;
        let firebaseProfileId = null;
        
        if (email && email !== '-') {
          try {
            const q = query(collection(db, 'users'), where('email', '==', email));
            const userSnap = await getDocs(q);
            if (!userSnap.empty) {
              const firebaseUserData = userSnap.docs[0].data();
              firebaseProfileId = userSnap.docs[0].id;
              
              // Comprehensive name construction - check all possible fields
              if (firebaseUserData.firstName && firebaseUserData.firstName.trim()) {
                firebaseUserName = `${firebaseUserData.firstName} ${firebaseUserData.lastName || ''}`.trim();
              } else if (firebaseUserData.userName && firebaseUserData.userName.trim()) {
                firebaseUserName = firebaseUserData.userName.trim();
              } else if (firebaseUserData.name && firebaseUserData.name.trim()) {
                firebaseUserName = firebaseUserData.name.trim();
              } else if (firebaseUserData.displayName && firebaseUserData.displayName.trim()) {
                firebaseUserName = firebaseUserData.displayName.trim();
              }
              
              firebaseUserGender = firebaseUserData.userGender || firebaseUserData.gender || null;
            }
          } catch (error) {
            // Could not find Firebase user for Remo user
          }
        }

        // Ensure we have a valid name - check all possible sources
        let finalName = 'Unknown';
        if (firebaseUserName && firebaseUserName.trim()) {
          finalName = firebaseUserName.trim();
        } else if (nameCombined && nameCombined.trim()) {
          finalName = nameCombined.trim();
        } else if (email && email !== '-') {
          finalName = email;
        } else if (a.user?.name && a.user.name.trim()) {
          finalName = a.user.name.trim();
        } else if (a.user?.displayName && a.user.displayName.trim()) {
          finalName = a.user.displayName.trim();
        }

        return {
          // Prefer explicit IDs; fall back to invite _id or email for table key
          id: a.user?.id || a.user?._id || a.invite?._id || a._id || email,
          name: finalName, // Use the final constructed name
          email,
          userGender: firebaseUserGender || profile.gender || 'Unknown', // Prefer Firebase gender, fallback to Remo
          // Use createdAt from root or invite object as sign-up timestamp
          signedUpAt: a.createdAt || a.invite?.createdAt || a.invite?.updatedAt || '',
          status,
          accepted,
          source: 'remo', // Mark as Remo user
          firebaseProfileId, // Store Firebase profile ID if found
          hasCircuitSignup: false // Will be updated later if they have Circuit signup
        };
      }));

      // Fetch Firebase users from the event's signedUpUsers subcollection
      const firebaseUsers = [];
      try {
        const signedUpUsersRef = collection(db, 'events', event.id, 'signedUpUsers');
        const signedUpUsersSnapshot = await getDocs(signedUpUsersRef);
        
        signedUpUsersSnapshot.docs.forEach(doc => {
          const userData = doc.data();
          
          // Comprehensive name construction for Firebase users
          let userName = 'Unknown';
          
          // Check all possible name fields
          if (userData.userName && userData.userName.trim()) {
            userName = userData.userName.trim();
          } else if (userData.firstName && userData.firstName.trim()) {
            userName = `${userData.firstName} ${userData.lastName || ''}`.trim();
          } else if (userData.name && userData.name.trim()) {
            userName = userData.name.trim();
          } else if (userData.displayName && userData.displayName.trim()) {
            userName = userData.displayName.trim();
          } else if (userData.userEmail && userData.userEmail.trim()) {
            userName = userData.userEmail.trim();
          }
          
          firebaseUsers.push({
            id: doc.id, // This is the user ID
            name: userName, // Use constructed userName
            email: userData.userEmail || 'N/A',
            userGender: userData.userGender || 'Unknown', // Add gender information
            signedUpAt: userData.signUpTime ? userData.signUpTime.toDate().toLocaleString() : 'N/A',
            status: 'Signed Up',
            accepted: 'Yes',
            source: 'firebase', // Mark as Firebase user
            firebaseProfileId: doc.id, // Store Firebase profile ID
            hasCircuitSignup: true // Firebase users are always from Circuit
          });
        });
      } catch (error) {
        console.error('Error fetching Firebase signed up users:', error);
      }

      // Check if Remo users also have Circuit signups
      const remoEmails = new Set(remoUsers.map(user => user.email.toLowerCase()).filter(email => email !== '-'));
      
      // Update Remo users to check if they also have Circuit signups
      const updatedRemoUsers = await Promise.all(remoUsers.map(async (user) => {
        if (user.email && user.email !== '-') {
          try {
            const signedUpUserDoc = doc(db, 'events', event.id, 'signedUpUsers', user.firebaseProfileId);
            const signedUpUserSnap = await getDoc(signedUpUserDoc);
            if (signedUpUserSnap.exists()) {
              user.hasCircuitSignup = true;
            }
          } catch (error) {
            // Could not check Circuit signup status
          }
        }
        return user;
      }));
      
      // Filter Firebase users to exclude those with emails that exist in Remo
      const filteredFirebaseUsers = firebaseUsers.filter(user => {
        return !remoEmails.has(user.email.toLowerCase());
      });

      // Combine users - Remo users take priority
      const combinedUsers = [...updatedRemoUsers, ...filteredFirebaseUsers];
      
      setEventUsers(combinedUsers);
    } catch (error) {
      console.error('Error fetching event members:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      
      // First, get all users signed up for this event
      const signedUpUsersRef = collection(db, 'events', selectedEvent.id, 'signedUpUsers');
      const signedUpUsersSnapshot = await getDocs(signedUpUsersRef);
      
      // Update datesRemaining and remove event from signedUpEvents for all signed up users
      const updatePromises = signedUpUsersSnapshot.docs.map(async (userDoc) => {
        const userId = userDoc.id;
        const userDocRef = doc(db, 'users', userId);
        
        try {
          // Update datesRemaining (+1 date back)
          await updateDoc(userDocRef, {
            datesRemaining: increment(1) // Increase available dates by 1
          });
          
          // Remove event from user's signedUpEvents collection
          await deleteDoc(doc(db, 'users', userId, 'signedUpEvents', selectedEvent.id));
          
          // Clear latestEventId if this was the user's latest event
          await clearLatestEventIdIfNeeded(userId, selectedEvent.id);
        } catch (error) {
          console.log(`⚠️ Could not update user ${userId}:`, error.message);
        }
      });
      
      // Wait for all user updates to complete
      await Promise.all(updatePromises);
      
      // Now delete the event
      await deleteDoc(doc(db, 'events', selectedEvent.id));
      setEvents(events.filter(evt => evt.id !== selectedEvent.id));
      setShowDeleteModal(false);
      setSelectedEvent(null);
      
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      // 1️⃣ Create the doc first to obtain its ID
      const docRef = await addDoc(collection(db, 'events'), {
        ...newEvent,
        menSignupCount: 0,
        womenSignupCount: 0,
      });

      // 2️⃣ Immediately write the Firestore ID inside the document for easy querying later
      await updateDoc(docRef, { id: docRef.id });

      setShowAddModal(false);
      setNewEvent({ eventID: '', location: '', menSpots: '', womenSpots: '', ageRange: '', eventType: '' });
      fetchEvents();
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'events', selectedEvent.id), selectedEvent);
      setShowEditModal(false);
      fetchEvents();
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleDeleteUser = (user) => {
    setSelectedUserToDelete(user);
    setShowDeleteUserModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUserToDelete || !selectedEvent) return;
    
    try {
      setDeletingUser(true);
      
      // For Firebase users, we have the actual user ID
      // For Remo users, we need to find them in Firebase if they exist
      let userId = selectedUserToDelete.id;
      let eventId = selectedEvent.id;
      
      if (selectedUserToDelete.source === 'remo') {
        // For Remo users, try to find their Firebase entry by email
        if (selectedUserToDelete.email && selectedUserToDelete.email !== '-') {
          try {
            const q = query(collection(db, 'users'), where('email', '==', selectedUserToDelete.email));
            const userSnap = await getDocs(q);
            if (!userSnap.empty) {
              userId = userSnap.docs[0].id; // Use the actual Firebase user ID
            }
          } catch (error) {
            // Could not find Firebase user for Remo user
          }
        }
      }
      
      // Try to delete from both sides, but don't fail if one doesn't exist
      try {
        await deleteDoc(doc(db, 'events', eventId, 'signedUpUsers', userId));
      } catch (error) {
        console.log('⚠️ Could not delete from event signedUpUsers (might not exist):', error.message);
      }
      
      try {
        await deleteDoc(doc(db, 'users', userId, 'signedUpEvents', eventId));
        
        // Clear latestEventId if this was the user's latest event
        await clearLatestEventIdIfNeeded(userId, eventId);
      } catch (error) {
        console.log('⚠️ Could not delete from user signedUpEvents (might not exist):', error.message);
      }
      
      // Update signup counts for all users (both Firebase and Remo)
      try {
        const eventDocRef = doc(db, 'events', eventId);
        const eventDoc = await getDoc(eventDocRef);
        if (eventDoc.exists()) {
          const data = eventDoc.data();
          let userGender = selectedUserToDelete.userGender?.toLowerCase();
          
          // If gender is unknown, try to find it from Firebase user data
          if (!userGender || userGender === 'unknown') {
            if (selectedUserToDelete.email && selectedUserToDelete.email !== '-') {
              try {
                const q = query(collection(db, 'users'), where('email', '==', selectedUserToDelete.email));
                const userSnap = await getDocs(q);
                if (!userSnap.empty) {
                  const firebaseUserData = userSnap.docs[0].data();
                  userGender = firebaseUserData.gender?.toLowerCase();
                }
              } catch (error) {
                console.log('⚠️ Could not find Firebase user for gender lookup:', error.message);
              }
            }
          }
          
          // Use transaction-based signout for reliable count updates
          if (userGender === 'male' || userGender === 'female') {
            try {
              await signOutFromEvent(eventId, userId, userGender);
            } catch (error) {
              console.log('⚠️ Transaction-based removal failed, falling back to manual count update:', error.message);
              // Fallback: manually update counts
              const actualCounts = await calculateActualCounts(eventId);
              await reconcileCounts(eventId, actualCounts);
            }
          } else {
            const actualCounts = await calculateActualCounts(eventId);
            await reconcileCounts(eventId, actualCounts);
          }
        } else {
          // Event document does not exist
        }
      } catch (error) {
        console.log('⚠️ Could not update signup counts:', error.message);
      }
      
      // Update user's datesRemaining count (for both Firebase and Remo users)
      try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentDatesRemaining = userData.datesRemaining || 0;
          
          await updateDoc(userDocRef, {
            datesRemaining: increment(1) // Increase available dates by 1
          });
        } else {
          // User document does not exist
        }
      } catch (error) {
        console.log('⚠️ Could not update user datesRemaining:', error.message);
      }
      
      // Update local state
      setEventUsers(prev => prev.filter(u => u.id !== selectedUserToDelete.id));
      
      setShowDeleteUserModal(false);
      setSelectedUserToDelete(null);
      
    } catch (error) {
      console.error('Error deleting user from event:', error);
      alert('Failed to delete user from event. Please try again.');
    } finally {
      setDeletingUser(false);
    }
  };

  const filteredEvents = events.filter(evt =>
    (evt.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     evt.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     evt.eventID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     evt.location?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-6 lg:p-7 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold">Events Management</h1>
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-[#0043F1] text-white rounded-xl hover:bg-[#0034BD] transition-colors text-sm sm:text-base"
          >
            <FaPlus />
            Create New Event
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left font-medium text-gray-600 min-w-[150px]">Title/Name</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left font-medium text-gray-600 min-w-[100px]">Date</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left font-medium text-gray-600 min-w-[100px]">Start Time</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left font-medium text-gray-600 min-w-[100px]">End Time</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left font-medium text-gray-600 min-w-[120px]">Location</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left font-medium text-gray-600 min-w-[80px]">Sign Ups</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left font-medium text-gray-600 min-w-[100px]">Type</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left font-medium text-gray-600 min-w-[100px]">Age Range</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left font-medium text-gray-600 min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-600">Loading...</td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-600">No events found.</td>
                </tr>
              ) : (
                filteredEvents.map(evt => (
                  <tr key={evt.id} className="hover:bg-gray-50">
                    {(() => {
                      const startDt = evt.startTime ? DateTime.fromMillis(Number(evt.startTime)) : null;
                      const endDt = evt.endTime ? DateTime.fromMillis(Number(evt.endTime)) : null;
                      const dateStr = startDt ? startDt.toFormat('MM/dd/yyyy') : (evt.date ? DateTime.fromISO(evt.date).toFormat('MM/dd/yyyy') : '');
                      const startTimeStr = startDt ? startDt.toFormat('h:mm a') : (evt.time || '');
                      const endTimeStr = endDt ? endDt.toFormat('h:mm a') : '-';
                      return (
                        <> 
                          <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span
                                className="relative text-blue-600 underline cursor-pointer hover:text-blue-800 transition-colors"
                                onMouseEnter={() => setHoverEventId(evt.id)}
                                onMouseLeave={() => setHoverEventId(null)}
                              >
                                <div className="truncate max-w-[150px] sm:max-w-[200px]" title={evt.name || evt.title || 'Untitled'}>
                                  {evt.name || evt.title || 'Untitled'}
                                </div>
                                {hoverEventId === evt.id && (
                                  <div
                                    className="absolute z-10 left-full ml-4 top-1/2 -translate-y-1/2 bg-white border border-gray-300 shadow-lg rounded-lg p-3 text-xs whitespace-nowrap"
                                    onMouseEnter={() => setHoverEventId(evt.id)}
                                    onMouseLeave={() => setHoverEventId(null)}
                                  >
                                    <div className="font-semibold text-gray-700 mb-1">Event Details</div>
                                    <div><span className="font-medium">Firestore:</span> {evt.id}</div>
                                    <div><span className="font-medium">Event ID:</span> {evt.eventID || '-'}</div>
                                  </div>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                            <div className="truncate max-w-[100px]" title={dateStr}>
                              {dateStr}
                            </div>
                          </td>
                          <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                            <div className="truncate max-w-[100px]" title={startTimeStr}>
                              {startTimeStr}
                            </div>
                          </td>
                          <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                            <div className="truncate max-w-[100px]" title={endTimeStr}>
                              {endTimeStr}
                            </div>
                          </td>
                        </>
                      );
                    })()}
                    <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                      <div className="truncate max-w-[120px]" title={evt.location || '-'}>
                        {evt.location || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleShowUsers(evt)}
                        className="px-3 py-1 bg-[#0043F1] text-white text-sm rounded-lg hover:bg-[#0034BD] transition-colors hover:shadow-md"
                      >
                        Users
                      </button>
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                      <div className="truncate max-w-[100px]" title={evt.eventType || '-'}>
                        {evt.eventType || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                      <div className="truncate max-w-[100px]" title={evt.ageRange || '-'}>
                        {evt.ageRange || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditEvent(evt)}
                          className="text-yellow-600 hover:text-yellow-900 transition-colors p-1 rounded hover:bg-yellow-50"
                          title="Edit Event"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(evt)}
                          className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50"
                          title="Delete Event"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 max-w-md w-full mx-4">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">Delete Event</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {selectedEvent?.title || selectedEvent?.name || selectedEvent?.eventID || 'this event'}? This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
              <button
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors order-2 sm:order-1"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors order-1 sm:order-2"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">Add New Event</h2>
            <form onSubmit={handleAddEvent} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Event ID</label>
                <input
                  type="text"
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newEvent.eventID}
                  onChange={(e) => setNewEvent({ ...newEvent, eventID: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Location</label>
                <select
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newEvent.location}
                  onChange={(e)=>setNewEvent({...newEvent, location:e.target.value})}
                  required
                >
                  <option value="" disabled>Select location</option>
                  {LOCATION_OPTIONS.map(loc => (<option key={loc} value={loc}>{loc}</option>))}
                </select>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-sm font-medium text-gray-700">Men Spots</label>
                  <input
                    type="number"
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                    value={newEvent.menSpots}
                    onChange={(e) => setNewEvent({ ...newEvent, menSpots: e.target.value })}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-sm font-medium text-gray-700">Women Spots</label>
                  <input
                    type="number"
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                    value={newEvent.womenSpots}
                    onChange={(e) => setNewEvent({ ...newEvent, womenSpots: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Age Range (e.g., 25-35)</label>
                <input
                  type="text"
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newEvent.ageRange}
                  onChange={(e) => setNewEvent({ ...newEvent, ageRange: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Event Type</label>
                <select
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newEvent.eventType}
                  onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value })}
                  required
                >
                  <option value="" disabled>Select type</option>
                  {['Brunch','Happy Hour','Dinner'].map(t=>(<option key={t} value={t}>{t}</option>))}
                </select>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors order-2 sm:order-1"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0043F1] text-white rounded-lg hover:bg-[#0034BD] transition-colors order-1 sm:order-2"
                >
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">Edit Event</h2>
            <form onSubmit={handleUpdateEvent} className="flex flex-col gap-4">
              {/* Event ID */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Event ID</label>
                <input
                  type="text"
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedEvent.eventID}
                  onChange={(e)=>setSelectedEvent({...selectedEvent,eventID:e.target.value})}
                  required
                />
              </div>

              {/* Location */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Location</label>
                <select
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedEvent.location}
                  onChange={(e)=>setSelectedEvent({...selectedEvent,location:e.target.value})}
                  required
                >
                  {LOCATION_OPTIONS.map(loc=>(<option key={loc} value={loc}>{loc}</option>))}
                </select>
              </div>

              {/* Men & Women Spots Row */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-sm font-medium text-gray-700">Men Spots</label>
                  <input
                    type="number"
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                    value={selectedEvent.menSpots}
                    onChange={(e)=>setSelectedEvent({...selectedEvent, menSpots:e.target.value})}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-sm font-medium text-gray-700">Women Spots</label>
                  <input
                    type="number"
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                    value={selectedEvent.womenSpots}
                    onChange={(e)=>setSelectedEvent({...selectedEvent, womenSpots:e.target.value})}
                    required
                  />
                </div>
              </div>

              {/* Age Range */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Age Range</label>
                <input
                  type="text"
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedEvent.ageRange}
                  onChange={(e)=>setSelectedEvent({...selectedEvent,ageRange:e.target.value})}
                  required
                />
              </div>

              {/* Event Type */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Event Type</label>
                <select
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedEvent.eventType}
                  onChange={(e)=>setSelectedEvent({...selectedEvent,eventType:e.target.value})}
                  required
                >
                  {['Brunch','Happy Hour','Dinner'].map(t=>(<option key={t} value={t}>{t}</option>))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-4 pt-4 border-t border-gray-200">
                <button 
                  type="button" 
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors order-2 sm:order-1" 
                  onClick={()=>setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#0043F1] text-white rounded-lg hover:bg-[#0034BD] transition-colors order-1 sm:order-2"
                >
                  Update Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Overview Modal */}
      {showUsersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex-shrink-0">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4">
                Users for {selectedEvent?.name || selectedEvent?.title}
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {loadingUsers ? (
                <div className="text-center py-8">Loading...</div>
              ) : eventUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-600">No users have signed up yet.</div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Statistics */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">Summary</h3>
                    <div className="flex flex-wrap gap-4 sm:gap-6">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                        <span className="text-sm">
                          Remo Only: {eventUsers.filter(u => u.source === 'remo' && !u.hasCircuitSignup).length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                        <span className="text-sm">
                          Circuit + Remo: {eventUsers.filter(u => u.source === 'remo' && u.hasCircuitSignup).length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                        <span className="text-sm">
                          Circuit Only: {eventUsers.filter(u => u.source === 'firebase').length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          Total: {eventUsers.length}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {(() => {
                    // Pre-filter users by gender and source for better performance
                    const maleUsers = eventUsers.filter(u => 
                      (u.userGender?.toLowerCase() === 'male' || u.userGender?.toLowerCase() === 'm') &&
                      (u.source === 'firebase' || u.hasCircuitSignup) // Only Circuit users (Circuit-only or Circuit+Remo)
                    );
                    const femaleUsers = eventUsers.filter(u => 
                      (u.userGender?.toLowerCase() === 'female' || u.userGender?.toLowerCase() === 'f') &&
                      (u.source === 'firebase' || u.hasCircuitSignup) // Only Circuit users (Circuit-only or Circuit+Remo)
                    );
                    const otherUsers = eventUsers.filter(u => 
                      u.source === 'remo' && !u.hasCircuitSignup // Remo Only users
                    );

                    return (
                      <>
                        {/* Male Users Section */}
                        {maleUsers.length > 0 && (
                          <div className="bg-white rounded-lg border border-gray-200">
                            <h3 className="text-lg sm:text-xl font-semibold p-3 sm:p-4 bg-blue-50 rounded-t-lg border-b border-gray-200">
                              Men - Circuit Users ({maleUsers.length} signups)
                            </h3>
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[120px]">Name</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[80px]">Gender</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[140px]">Signed Up At</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[200px]">Email</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[100px]">Status</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[80px]">Accepted</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[100px]">Source</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[80px]">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {maleUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50">
                                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                                        <div className="truncate max-w-[120px] sm:max-w-[200px]" title={u.name}>
                                          {u.name}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap capitalize">{u.userGender}</td>
                                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                                        <div className="truncate max-w-[140px]" title={u.signedUpAt ? new Date(u.signedUpAt).toLocaleString() : '-'}>
                                          {u.signedUpAt ? new Date(u.signedUpAt).toLocaleString() : '-'}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                                        <div className="truncate max-w-[200px]" title={u.email}>
                                          {u.email}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap capitalize">{u.status}</td>
                                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap">{u.accepted}</td>
                                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          u.source === 'remo' 
                                            ? u.hasCircuitSignup 
                                              ? 'bg-purple-100 text-purple-800' 
                                              : 'bg-blue-100 text-blue-800'
                                            : 'bg-green-100 text-green-800'
                                        }`}>
                                          {u.source === 'remo' 
                                            ? u.hasCircuitSignup 
                                              ? 'Circuit + Remo' 
                                              : 'Remo Only'
                                            : 'Circuit Only'
                                          }
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                                        <button
                                          onClick={() => handleDeleteUser(u)}
                                          className="text-red-600 hover:text-red-800 text-sm font-medium hover:underline"
                                          title="Delete user from event"
                                        >
                                          Delete
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Female Users Section */}
                        {femaleUsers.length > 0 && (
                          <div className="bg-white rounded-lg border border-gray-200">
                            <h3 className="text-lg sm:text-xl font-semibold p-3 sm:p-4 bg-pink-50 rounded-t-lg border-b border-gray-200">
                              Women - Circuit Users ({femaleUsers.length} signups)
                            </h3>
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[120px]">Name</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[80px]">Gender</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[140px]">Signed Up At</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[200px]">Email</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[100px]">Status</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[80px]">Accepted</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[100px]">Source</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[80px]">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {femaleUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50">
                                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                                        <div className="truncate max-w-[120px] sm:max-w-[200px]" title={u.name}>
                                          {u.name}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap capitalize">{u.userGender}</td>
                                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                                        <div className="truncate max-w-[140px]" title={u.signedUpAt ? new Date(u.signedUpAt).toLocaleString() : '-'}>
                                          {u.signedUpAt ? new Date(u.signedUpAt).toLocaleString() : '-'}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                                        <div className="truncate max-w-[200px]" title={u.email}>
                                          {u.email}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap capitalize">{u.status}</td>
                                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap">{u.accepted}</td>
                                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          u.source === 'remo' 
                                            ? u.hasCircuitSignup 
                                              ? 'bg-purple-100 text-purple-800' 
                                              : 'bg-blue-100 text-blue-800'
                                            : 'bg-green-100 text-green-800'
                                        }`}>
                                          {u.source === 'remo' 
                                            ? u.hasCircuitSignup 
                                              ? 'Circuit + Remo' 
                                              : 'Remo Only'
                                            : 'Circuit Only'
                                          }
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                                        <button
                                          onClick={() => handleDeleteUser(u)}
                                          className="text-red-600 hover:text-red-800 text-sm font-medium hover:underline"
                                          title="Delete user from event"
                                        >
                                          Delete
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Remo Only Users Section */}
                        {otherUsers.length > 0 && (
                          <div className="bg-white rounded-lg border border-gray-200">
                            <h3 className="text-lg sm:text-xl font-semibold p-3 sm:p-4 bg-gray-50 rounded-t-lg border-b border-gray-200">
                              Remo Only Users ({otherUsers.length} signups)
                            </h3>
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[120px]">Name</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[80px]">Gender</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[140px]">Signed Up At</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[200px]">Email</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[80px]">Status</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[80px]">Accepted</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[100px]">Source</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[80px]">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {otherUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50">
                                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                                        <div className="truncate max-w-[120px] sm:max-w-[200px]" title={u.name}>
                                          {u.name}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap capitalize">{u.userGender || 'Unknown'}</td>
                                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                                        <div className="truncate max-w-[140px]" title={u.signedUpAt ? new Date(u.signedUpAt).toLocaleString() : '-'}>
                                          {u.signedUpAt ? new Date(u.signedUpAt).toLocaleString() : '-'}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                                        <div className="truncate max-w-[200px]" title={u.email}>
                                          {u.email}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap capitalize">{u.status}</td>
                                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap">{u.accepted}</td>
                                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          u.source === 'remo' 
                                            ? u.hasCircuitSignup 
                                              ? 'bg-purple-100 text-purple-800' 
                                              : 'bg-blue-100 text-blue-800'
                                            : 'bg-green-100 text-green-800'
                                        }`}>
                                          {u.source === 'remo' 
                                            ? u.hasCircuitSignup 
                                              ? 'Circuit + Remo' 
                                              : 'Remo Only'
                                            : 'Circuit Only'
                                          }
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                                        <button
                                          onClick={() => handleDeleteUser(u)}
                                          className="text-red-600 hover:text-red-800 text-sm font-medium hover:underline"
                                          title="Delete user from event"
                                        >
                                          Delete
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
            
            <div className="flex-shrink-0 flex justify-end mt-6 pt-4 border-t border-gray-200">
              <button
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                onClick={() => setShowUsersModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {showDeleteUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-semibold mb-4">Delete User from Event</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove <strong>{selectedUserToDelete?.name}</strong> from the event "{selectedEvent?.name || selectedEvent?.title}"?
            </p>
            <p className="text-sm text-red-600 mb-6">
              This action will remove the user from the event and update the signup counts. This action cannot be undone.<br/>
              <span className="text-xs text-red-500 block mt-2">Reminder: You must manually remove this user from the Remo event in the Remo dashboard. This is not handled automatically.</span>
            </p>
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => {
                  setShowDeleteUserModal(false);
                  setSelectedUserToDelete(null);
                }}
                disabled={deletingUser}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                onClick={confirmDeleteUser}
                disabled={deletingUser}
              >
                {deletingUser ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvents; 