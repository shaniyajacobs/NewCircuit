import React, { useState, useEffect } from 'react';
import { db, auth } from '../../../pages/firebaseConfig';
import { collection, getDocs, deleteDoc, doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { deleteUser, getAuth, signInWithEmailAndPassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { FaSearch, FaTrash, FaUserShield } from 'react-icons/fa';
import { IoMdCheckmark, IoMdClose } from 'react-icons/io';
import { getFunctions, httpsCallable } from 'firebase/functions';
import AdminUserDetailModal from './AdminUserDetailModal';
import { DateTime } from 'luxon';
import { signOutFromEvent, calculateActualCounts, reconcileCounts } from '../../../utils/eventSpotsUtils';
import { formatUserName } from '../../../utils/nameFormatter';

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showRemoveAdminModal, setShowRemoveAdminModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [hoverUserId, setHoverUserId] = useState(null);
  // Events modal state
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [userEvents, setUserEvents] = useState([]);
  // Sparks (connections) modal state
  const [showConnectionsModal, setShowConnectionsModal] = useState(false);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [userConnections, setUserConnections] = useState([]);
  // User Detail modal state
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  // Delete event modal state
  const [showDeleteEventModal, setShowDeleteEventModal] = useState(false);
  const [selectedEventToDelete, setSelectedEventToDelete] = useState(null);
  const [deletingEvent, setDeletingEvent] = useState(false);
  // Edit dates modal state
  const [showEditDatesModal, setShowEditDatesModal] = useState(false);
  const [selectedUserForDates, setSelectedUserForDates] = useState(null);
  const [newDatesRemaining, setNewDatesRemaining] = useState(0);
  const [updatingDates, setUpdatingDates] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      const adminSnapshot = await getDocs(collection(db, 'adminUsers'));
      const adminIds = adminSnapshot.docs.map(doc => doc.id);
      setAdminUsers(adminIds);
    } catch (error) {
      console.error('Error fetching admin users:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleMakeAdmin = (user) => {
    setSelectedUser(user);
    setShowAdminModal(true);
  };

  const handleRemoveAdmin = (user) => {
    setSelectedUser(user);
    setShowRemoveAdminModal(true);
  };

  const confirmMakeAdmin = async () => {
    try {
      setLoading(true);
      // Add to adminUsers collection
      await setDoc(doc(db, 'adminUsers', selectedUser.id), {
        email: selectedUser.email,
        addedAt: new Date()
      });

      // Update local state
      setAdminUsers([...adminUsers, selectedUser.id]);
      setShowAdminModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error making user admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmRemoveAdmin = async () => {
    try {
      setLoading(true);
      // Remove from adminUsers collection
      await deleteDoc(doc(db, 'adminUsers', selectedUser.id));

      // Update local state
      setAdminUsers(adminUsers.filter(id => id !== selectedUser.id));
      setShowRemoveAdminModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error removing admin status:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      
      const functions = getFunctions();
      const deleteUserFunction = httpsCallable(functions, 'deleteUser');
      
      await deleteUserFunction({ userId: selectedUser.id });

      // Update local state
      setUsers(users.filter(user => user.id !== selectedUser.id));
      setShowDeleteModal(false);
      setSelectedUser(null);

    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show events for a user – fetch live Remo details via Cloud Function
  const handleShowEvents = async (user) => {
    setSelectedUser(user);
    setShowEventsModal(true);
    setLoadingEvents(true);

    try {
      // 1️⃣ Fetch signed-up event IDs from Firestore
      const eventsSnap = await getDocs(collection(db, 'users', user.id, 'signedUpEvents'));

      if (eventsSnap.empty) {
        setUserEvents([]);
        return;
      }

      // 2️⃣ Prepare callable
      const functionsInst = getFunctions();
      const getEventDataCF = httpsCallable(functionsInst, 'getEventData');

      // 3️⃣ For each event, call the CF to fetch Remo metadata
      const enriched = await Promise.all(
        eventsSnap.docs.map(async (docSnap) => {
          const data = docSnap.data() || {};
          const eventId = docSnap.id; // Use the document ID consistently for deletion

          let remo = {};
          try {
            const res = await getEventDataCF({ eventId });
            remo = res.data?.event || {};
          } catch (err) {
            console.error('getEventData error:', err);
          }

          // Extract date/time using Luxon
          const dt = remo.startTime
            ? DateTime.fromMillis(Number(remo.startTime))
            : (remo.start_date_time ? DateTime.fromISO(remo.start_date_time) : null);

          const dateStr = dt ? dt.toFormat('MM/dd/yyyy') : (data.eventDate ? DateTime.fromISO(data.eventDate).toFormat('MM/dd/yyyy') : '-');
          const timeStr = dt ? dt.toFormat('h:mm a') : (data.eventTime || '-');

          const signUpJS = data.signUpTime?.toDate?.();
          const signUpStr = signUpJS ? DateTime.fromJSDate(signUpJS).toFormat('MM/dd/yyyy') : '-';

          return {
            id: eventId,
            title: remo.name || remo.title || data.eventTitle || 'Unknown',
            date: dateStr,
            time: timeStr,
            signUp: signUpStr,
          };
        })
      );

      setUserEvents(enriched);
    } catch (error) {
      console.error('Error fetching user events:', error);
      setUserEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Show sparks (connections) for a user
  const handleShowConnections = async (user) => {
    setSelectedUser(user);
    setShowConnectionsModal(true);
    setLoadingConnections(true);
    try {
      // Fetch the user's connections sub-collection
      const connectionsSnap = await getDocs(collection(db, 'users', user.id, 'connections'));
      // Enrich each connection with basic profile data of the other user
      const connectionsData = await Promise.all(
        connectionsSnap.docs.map(async (connDoc) => {
          const otherUserId = connDoc.id;
          const connInfo = connDoc.data();

          // Get other user's profile for name & image (fallbacks included)
          const otherUserSnap = await getDoc(doc(db, 'users', otherUserId));
          const otherUser = otherUserSnap.exists() ? otherUserSnap.data() : {};

          return {
            id: otherUserId,
            name: formatUserName(otherUser),
            email: otherUser.email || '-',
            gender: otherUser.gender || '-',
            status: connInfo.status || 'unknown',
            matchScore: typeof connInfo.matchScore === 'number' ? Math.round(connInfo.matchScore) : null,
            connectedAt: connInfo.connectedAt?.toDate?.() ?? null,
          };
        })
      );

      setUserConnections(connectionsData);
    } catch (error) {
      console.error('Error fetching user connections:', error);
      setUserConnections([]);
    } finally {
      setLoadingConnections(false);
    }
  };

  // Show user detail modal
  const handleShowUserDetail = (user) => {
    setSelectedUserDetail(user);
    setShowUserDetailModal(true);
  };

  const handleDeleteEvent = (event) => {
    setSelectedEventToDelete(event);
    setShowDeleteEventModal(true);
  };

  const handleEditDates = (user) => {
    setSelectedUserForDates(user);
    setNewDatesRemaining(user.datesRemaining || 0);
    setShowEditDatesModal(true);
  };

  const confirmUpdateDates = async () => {
    if (!selectedUserForDates) return;
    
    try {
      setUpdatingDates(true);
      
      const userDocRef = doc(db, 'users', selectedUserForDates.id);
      await updateDoc(userDocRef, {
        datesRemaining: parseInt(newDatesRemaining)
      });
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === selectedUserForDates.id 
          ? { ...user, datesRemaining: parseInt(newDatesRemaining) }
          : user
      ));
      
      setShowEditDatesModal(false);
      setSelectedUserForDates(null);
      setNewDatesRemaining(0);
      
      console.log('✅ User dates updated successfully');
    } catch (error) {
      console.error('Error updating user dates:', error);
      alert('Failed to update user dates. Please try again.');
    } finally {
      setUpdatingDates(false);
    }
  };

  const confirmDeleteEvent = async () => {
    if (!selectedEventToDelete || !selectedUser) return;
    
    try {
      setDeletingEvent(true);
      
      console.log('Selected event to delete:', selectedEventToDelete);
      console.log('Selected user:', selectedUser);
      
      const userId = selectedUser.id;
      const eventId = selectedEventToDelete.id;
      
      console.log(`Attempting to delete event ${eventId} from user ${userId}`);
      
      // Try to delete from both sides, but don't fail if one doesn't exist
      try {
        await deleteDoc(doc(db, 'users', userId, 'signedUpEvents', eventId));
        console.log('✅ Deleted from user signedUpEvents');
      } catch (error) {
        console.log('⚠️ Could not delete from user signedUpEvents (might not exist):', error.message);
      }
      
      try {
        await deleteDoc(doc(db, 'events', eventId, 'signedUpUsers', userId));
        console.log('✅ Deleted from event signedUpUsers');
      } catch (error) {
        console.log('⚠️ Could not delete from event signedUpUsers (might not exist):', error.message);
      }
      
      // Update event signup counts and available spots
      try {
        const eventDocRef = doc(db, 'events', eventId);
        const eventDoc = await getDoc(eventDocRef);
        if (eventDoc.exists()) {
          const data = eventDoc.data();
          const userGender = selectedUser.gender?.toLowerCase();
          
          console.log('🔍 Debug signup count update (AdminUserManagement):');
          console.log('- User gender:', userGender);
          console.log('- Event data:', data);
          console.log('- Current menSignupCount:', data.menSignupCount);
          console.log('- Current womenSignupCount:', data.womenSignupCount);
          
          // Use transaction-based signout for reliable count updates
          if (userGender === 'male' || userGender === 'female') {
            try {
              await signOutFromEvent(eventId, userId, userGender);
              console.log('✅ User removed from event using transaction');
            } catch (error) {
              console.log('⚠️ Transaction-based removal failed, falling back to manual count update:', error.message);
              // Fallback: manually update counts
              const actualCounts = await calculateActualCounts(eventId);
              await reconcileCounts(eventId, actualCounts);
            }
          } else {
            console.log('⚠️ Unknown gender, reconciling counts manually');
            const actualCounts = await calculateActualCounts(eventId);
            await reconcileCounts(eventId, actualCounts);
          }
        } else {
          console.log('⚠️ Event document does not exist');
        }
      } catch (error) {
        console.log('⚠️ Could not update signup counts:', error.message);
      }
      
      // Update user's datesRemaining count
      try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentDatesRemaining = userData.datesRemaining || 0;
          
          console.log('🔍 Debug datesRemaining update (AdminUserManagement):');
          console.log('- Current datesRemaining:', currentDatesRemaining);
          console.log('- User ID:', userId);
          
          await updateDoc(userDocRef, {
            datesRemaining: increment(1) // Increase available dates by 1
          });
          console.log('✅ Updated user datesRemaining count');
        } else {
          console.log('⚠️ User document does not exist');
        }
      } catch (error) {
        console.log('⚠️ Could not update user datesRemaining:', error.message);
      }
      
      // Update local state
      setUserEvents(prev => prev.filter(e => e.id !== selectedEventToDelete.id));
      
      setShowDeleteEventModal(false);
      setSelectedEventToDelete(null);
      
      console.log('✅ Event deletion completed successfully');
    } catch (error) {
      console.error('Error deleting event from user:', error);
      alert('Failed to delete event from user. Please try again.');
    } finally {
      setDeletingEvent(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-7 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold">User Management</h1>
        <div className="relative flex-1 sm:flex-none">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left font-medium text-gray-600 min-w-[150px]">Name</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left font-medium text-gray-600 min-w-[100px]">Status</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left font-medium text-gray-600 min-w-[80px]">Role</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left font-medium text-gray-600 min-w-[80px]">Gender</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left font-medium text-gray-600 min-w-[100px]">Preference</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left font-medium text-gray-600 min-w-[80px]">Dates</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left font-medium text-gray-600 min-w-[80px]">Sparks</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left font-medium text-gray-600 min-w-[80px]">Events</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left font-medium text-gray-600 min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-600">Loading...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-600">No users found.</td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className={`hover:bg-gray-50 ${user.id === auth.currentUser?.uid ? 'bg-blue-50' : ''}`}>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap cursor-pointer text-blue-700 hover:underline" onClick={() => { setSelectedUserDetail(user); setShowUserDetailModal(true); }}>
                      <div className="flex items-center">
                        <span
                          className="relative text-gray-900 cursor-default"
                          onMouseEnter={() => setHoverUserId(user.id)}
                          onMouseLeave={() => setHoverUserId(null)}
                        >
                          <div className="truncate max-w-[150px] sm:max-w-[200px]" title={formatUserName(user)}>
                            {formatUserName(user)}
                          </div>
                          {hoverUserId === user.id && (
                            <div
                              className="absolute z-10 left-full ml-4 top-1/2 -translate-y-1/2 bg-white border border-gray-300 shadow-lg rounded-lg p-3 text-xs whitespace-nowrap"
                              onMouseEnter={() => setHoverUserId(user.id)}
                              onMouseLeave={() => setHoverUserId(null)}
                            >
                              <div className="font-semibold text-gray-700 mb-1">User Details</div>
                              <div><span className="font-medium">Email:</span> {user.email}</div>
                              <div><span className="font-medium">User ID:</span> {user.id}</div>
                            </div>
                          )}
                        </span>
                        {user.id === auth.currentUser?.uid && (
                          <span className="ml-2 text-xs text-blue-600">(Me)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? <IoMdCheckmark className="mr-1" /> : <IoMdClose className="mr-1" />}
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        adminUsers.includes(user.id) ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        <FaUserShield className="mr-1" />
                        {adminUsers.includes(user.id) ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap capitalize">
                      <div className="truncate max-w-[80px]" title={user.gender || '-'}>
                        {user.gender || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap capitalize">
                      <div className="truncate max-w-[100px]" title={user.sexualPreference || user.genderPreference || '-'}>
                        {user.sexualPreference || user.genderPreference || '-'}
                      </div>
                    </td>
                    {/* Dates column */}
                    <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{user.datesRemaining || 0}</span>
                        <button
                          onClick={() => handleEditDates(user)}
                          className="text-blue-600 hover:text-blue-900 text-sm hover:bg-blue-50 p-1 rounded transition-colors"
                          title="Edit Dates"
                        >
                          ✏️
                        </button>
                      </div>
                    </td>
                    {/* Sparks column */}
                    <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleShowConnections(user)}
                        className="px-3 py-1 bg-pink-600 text-white text-sm rounded-lg hover:bg-pink-700 transition-colors hover:shadow-md"
                      >
                        Sparks
                      </button>
                    </td>
                    {/* Events column */}
                    <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleShowEvents(user)}
                        className="px-3 py-1 bg-[#0043F1] text-white text-sm rounded-lg hover:bg-[#0034BD] transition-colors hover:shadow-md"
                      >
                        Events
                      </button>
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {!adminUsers.includes(user.id) && (
                          <button
                            onClick={() => handleMakeAdmin(user)}
                            className="text-purple-600 hover:text-purple-900 transition-colors p-1 rounded hover:bg-purple-50"
                            title="Make Admin"
                          >
                            <FaUserShield className="w-4 h-4" />
                          </button>
                        )}
                        {adminUsers.includes(user.id) && user.id !== auth.currentUser?.uid && (
                          <button
                            onClick={() => handleRemoveAdmin(user)}
                            className="text-orange-600 hover:text-orange-900 transition-colors p-1 rounded hover:bg-orange-50"
                            title="Remove Admin"
                          >
                            <FaUserShield className="w-4 h-4" />
                          </button>
                        )}
                        {user.id !== auth.currentUser?.uid && (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50"
                            title="Delete User"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 max-w-md w-full mx-4">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">Delete User</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {formatUserName(selectedUser)}? 
              This action cannot be undone.
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

      {/* Make Admin Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 max-w-md w-full mx-4">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">Make User Admin</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to make {formatUserName(selectedUser)} an admin? 
              They will have full administrative access.
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
              <button
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors order-2 sm:order-1"
                onClick={() => setShowAdminModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors order-1 sm:order-2"
                onClick={confirmMakeAdmin}
              >
                Make Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Admin Modal */}
      {showRemoveAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 max-w-md w-full mx-4">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">Remove Admin Status</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove admin status from {selectedUser?.firstName} {selectedUser?.lastName}? 
              They will lose administrative access.
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
              <button
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors order-2 sm:order-1"
                onClick={() => setShowRemoveAdminModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors order-1 sm:order-2"
                onClick={confirmRemoveAdmin}
              >
                Remove Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {showUserDetailModal && selectedUserDetail && (
        <AdminUserDetailModal
          isOpen={showUserDetailModal}
          onClose={() => setShowUserDetailModal(false)}
          user={selectedUserDetail}
        />
      )}

      {/* User Events Modal */}
      {showEventsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex-shrink-0">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4">Events for {formatUserName(selectedUser)}</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {loadingEvents ? (
                <div className="text-center py-8">Loading...</div>
              ) : userEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-600">No events found.</div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-3 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[150px]">Title</th>
                          <th className="px-3 py-3 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[100px]">Date</th>
                          <th className="px-3 py-3 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[100px]">Time</th>
                          <th className="px-3 py-3 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[120px]">Signed-Up At</th>
                          <th className="px-3 py-3 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[120px]">Event ID</th>
                          <th className="px-3 py-3 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[100px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {userEvents.map(ev => (
                          <tr key={ev.id} className="hover:bg-gray-50">
                            <td className="px-3 py-3 sm:px-4 sm:py-3 whitespace-nowrap">
                              <div className="truncate max-w-[150px] sm:max-w-[200px]" title={ev.title}>
                                {ev.title}
                              </div>
                            </td>
                            <td className="px-3 py-3 sm:px-4 sm:py-3 whitespace-nowrap">
                              <div className="truncate max-w-[100px]" title={ev.date}>
                                {ev.date}
                              </div>
                            </td>
                            <td className="px-3 py-3 sm:px-4 sm:py-3 whitespace-nowrap">
                              <div className="truncate max-w-[100px]" title={ev.time}>
                                {ev.time}
                              </div>
                            </td>
                            <td className="px-3 py-3 sm:px-4 sm:py-3 whitespace-nowrap">
                              <div className="truncate max-w-[120px]" title={ev.signUp}>
                                {ev.signUp}
                              </div>
                            </td>
                            <td className="px-3 py-3 sm:px-4 sm:py-3 whitespace-nowrap">
                              <div className="truncate max-w-[120px]" title={ev.id}>
                                {ev.id}
                              </div>
                            </td>
                            <td className="px-3 py-3 sm:px-4 sm:py-3 whitespace-nowrap">
                              <button
                                onClick={() => handleDeleteEvent(ev)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium hover:underline"
                                title="Remove user from event"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex-shrink-0 flex justify-end mt-6 pt-4 border-t border-gray-200">
              <button
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                onClick={() => setShowEventsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Sparks (Connections) Modal */}
      {showConnectionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex-shrink-0">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4">Sparks for {formatUserName(selectedUser)}</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {loadingConnections ? (
                <div className="text-center py-8">Loading...</div>
              ) : userConnections.length === 0 ? (
                <div className="text-center py-8 text-gray-600">No sparks found.</div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-3 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[150px]">Name</th>
                          <th className="px-3 py-3 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[200px]">Email</th>
                          <th className="px-3 py-3 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[80px]">Gender</th>
                          <th className="px-3 py-3 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[100px]">Status</th>
                          <th className="px-3 py-3 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[80px]">Match %</th>
                          <th className="px-3 py-3 sm:px-4 sm:py-3 text-left font-medium text-gray-600 min-w-[120px]">Connected At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {userConnections.map(conn => (
                          <tr key={conn.id} className="hover:bg-gray-50">
                            <td className="px-3 py-3 sm:px-4 sm:py-3 whitespace-nowrap">
                              <div className="truncate max-w-[150px] sm:max-w-[200px]" title={conn.name}>
                                {conn.name}
                              </div>
                            </td>
                            <td className="px-3 py-3 sm:px-4 sm:py-3 whitespace-nowrap">
                              <div className="truncate max-w-[200px]" title={conn.email}>
                                {conn.email}
                              </div>
                            </td>
                            <td className="px-3 py-3 sm:px-4 sm:py-3 whitespace-nowrap capitalize">
                              <div className="truncate max-w-[80px]" title={conn.gender}>
                                {conn.gender}
                              </div>
                            </td>
                            <td className="px-3 py-3 sm:px-4 sm:py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                conn.status === 'mutual'
                                  ? 'bg-green-100 text-green-800'
                                  : conn.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {conn.status}
                              </span>
                            </td>
                            <td className="px-3 py-3 sm:px-4 sm:py-3 whitespace-nowrap">
                              <div className="truncate max-w-[80px]" title={conn.matchScore ?? '-'}>
                                {conn.matchScore ?? '-'}
                              </div>
                            </td>
                            <td className="px-3 py-3 sm:px-4 sm:py-3 whitespace-nowrap">
                              <div className="truncate max-w-[120px]" title={conn.connectedAt ? conn.connectedAt.toLocaleDateString() : '-'}>
                                {conn.connectedAt ? conn.connectedAt.toLocaleDateString() : '-'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex-shrink-0 flex justify-end mt-6 pt-4 border-t border-gray-200">
              <button
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                onClick={() => setShowConnectionsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Event Confirmation Modal */}
      {showDeleteEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 max-w-md w-full mx-4">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">Remove User from Event</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong> from the event "{selectedEventToDelete?.title}"?
            </p>
            <p className="text-sm text-red-600 mb-6">
              This action will remove the user from the event and update the signup counts. This action cannot be undone.<br/>
              <span className="text-xs text-red-500 block mt-2">Reminder: You must manually remove this user from the Remo event in the Remo dashboard. This is not handled automatically.</span>
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
              <button
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors order-2 sm:order-1"
                onClick={() => {
                  setShowDeleteEventModal(false);
                  setSelectedEventToDelete(null);
                }}
                disabled={deletingEvent}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 order-1 sm:order-2"
                onClick={confirmDeleteEvent}
                disabled={deletingEvent}
              >
                {deletingEvent ? 'Removing...' : 'Remove User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dates Modal */}
      {showEditDatesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 max-w-md w-full mx-4">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">Edit User Dates</h2>
            <p className="text-gray-600 mb-6">
              Update the number of dates remaining for <strong>{selectedUserForDates?.firstName} {selectedUserForDates?.lastName}</strong>
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dates Remaining
              </label>
              <input
                type="number"
                min="0"
                value={newDatesRemaining}
                onChange={(e) => setNewDatesRemaining(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter number of dates"
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
              <button
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors order-2 sm:order-1"
                onClick={() => {
                  setShowEditDatesModal(false);
                  setSelectedUserForDates(null);
                  setNewDatesRemaining(0);
                }}
                disabled={updatingDates}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 order-1 sm:order-2"
                onClick={confirmUpdateDates}
                disabled={updatingDates}
              >
                {updatingDates ? 'Updating...' : 'Update Dates'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement; 