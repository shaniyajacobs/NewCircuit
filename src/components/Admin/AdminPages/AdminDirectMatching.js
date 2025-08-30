import React, { useState, useEffect } from 'react';
import { db } from '../../../pages/firebaseConfig';
import { collection, getDocs, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { FaSearch, FaHeart, FaUserPlus, FaCheck, FaTimes } from 'react-icons/fa';
import { formatUserName } from '../../../utils/nameFormatter';
import { calculateAge } from '../../../utils/ageCalculator';

const AdminDirectMatching = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser1, setSelectedUser1] = useState(null);
  const [selectedUser2, setSelectedUser2] = useState(null);
  const [matchScore, setMatchScore] = useState(85);
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      setErrorMessage('Failed to fetch users');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const name = formatUserName(user).toLowerCase();
    const email = (user.email || '').toLowerCase();
    return name.includes(searchLower) || email.includes(searchLower);
  });

  const handleUserSelect = (user, isUser1) => {
    if (isUser1) {
      setSelectedUser1(user);
      // Clear user2 if it's the same user
      if (selectedUser2 && selectedUser2.id === user.id) {
        setSelectedUser2(null);
      }
    } else {
      setSelectedUser2(user);
      // Clear user1 if it's the same user
      if (selectedUser1 && selectedUser1.id === user.id) {
        setSelectedUser1(null);
      }
    }
  };

  const canCreateMatch = () => {
    return selectedUser1 && selectedUser2 && selectedUser1.id !== selectedUser2.id;
  };

  const createMatch = async () => {
    if (!canCreateMatch()) return;

    try {
      setCreatingMatch(true);

      // Check if connection already exists
      const existingConn1 = await getDoc(doc(db, 'users', selectedUser1.id, 'connections', selectedUser2.id));
      const existingConn2 = await getDoc(doc(db, 'users', selectedUser2.id, 'connections', selectedUser1.id));

      if (existingConn1.exists() || existingConn2.exists()) {
        setErrorMessage('A connection already exists between these users');
        setShowErrorModal(true);
        return;
      }

      // Create mutual connection
      await Promise.all([
        // Connection from User 1 to User 2
        setDoc(doc(db, 'users', selectedUser1.id, 'connections', selectedUser2.id), {
          status: 'mutual',
          matchScore: matchScore,
          connectedAt: serverTimestamp(),
          createdBy: 'admin',
          createdAt: serverTimestamp()
        }),
        // Connection from User 2 to User 1
        setDoc(doc(db, 'users', selectedUser2.id, 'connections', selectedUser1.id), {
          status: 'mutual',
          matchScore: matchScore,
          connectedAt: serverTimestamp(),
          createdBy: 'admin',
          createdAt: serverTimestamp()
        })
      ]);

      // Reset selections
      setSelectedUser1(null);
      setSelectedUser2(null);
      setMatchScore(85);
      setShowSuccessModal(true);

    } catch (error) {
      console.error('Error creating match:', error);
      setErrorMessage('Failed to create match. Please try again.');
      setShowErrorModal(true);
    } finally {
      setCreatingMatch(false);
    }
  };

  const resetSelections = () => {
    setSelectedUser1(null);
    setSelectedUser2(null);
    setMatchScore(85);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Direct Matching</h1>
        <p className="text-gray-600">
          Create matches between users without requiring an event. These connections will appear in both users' sparks.
        </p>
      </div>

      {/* User Selection */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Users to Match</h2>
        
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* User Selection Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User 1 Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              {selectedUser1 ? 'Selected User 1' : 'Select First User'}
            </h3>
            
            {selectedUser1 ? (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  {selectedUser1.image ? (
                    <img
                      src={selectedUser1.image}
                      alt={formatUserName(selectedUser1)}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center">
                      <FaUserPlus className="text-blue-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {formatUserName(selectedUser1)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedUser1.email} • {calculateAge(selectedUser1.birthDate)} years
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser1(null)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[80px] flex items-center justify-center">
                <span className="text-gray-500">No user selected</span>
              </div>
            )}
          </div>

          {/* User 2 Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              {selectedUser2 ? 'Selected User 2' : 'Select Second User'}
            </h3>
            
            {selectedUser2 ? (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  {selectedUser2.image ? (
                    <img
                      src={selectedUser2.image}
                      alt={formatUserName(selectedUser2)}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center">
                      <FaUserPlus className="text-green-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {formatUserName(selectedUser2)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedUser2.email} • {calculateAge(selectedUser2.birthDate)} years
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser2(null)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[80px] flex items-center justify-center">
                <span className="text-gray-500">No user selected</span>
              </div>
            )}
          </div>
        </div>

        {/* Match Score */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Match Score (0-100%)
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={matchScore}
            onChange={(e) => setMatchScore(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-sm text-gray-600 mt-1">
            <span>0%</span>
            <span className="font-medium">{matchScore}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex space-x-4">
          <button
            onClick={createMatch}
            disabled={!canCreateMatch() || creatingMatch}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              canCreateMatch() && !creatingMatch
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {creatingMatch ? 'Creating Match...' : 'Create Match'}
          </button>
          
          <button
            onClick={resetSelections}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* User List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">All Users ({filteredUsers.length})</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredUsers.map((user) => {
            const isSelected1 = selectedUser1?.id === user.id;
            const isSelected2 = selectedUser2?.id === user.id;
            const isSelected = isSelected1 || isSelected2;
            
            return (
              <div
                key={user.id}
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                  isSelected ? 'bg-blue-50' : ''
                }`}
                onClick={() => {
                  if (!isSelected) {
                    if (!selectedUser1) {
                      handleUserSelect(user, true);
                    } else if (!selectedUser2) {
                      handleUserSelect(user, false);
                    }
                  }
                }}
              >
                <div className="flex items-center space-x-3">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={formatUserName(user)}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <FaUserPlus className="text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {formatUserName(user)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {user.email} • {calculateAge(user.birthDate)} years
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isSelected1 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        User 1
                      </span>
                    )}
                    {isSelected2 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        User 2
                      </span>
                    )}
                    {!isSelected && (
                      <span className="text-gray-400">
                        <FaHeart />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <FaCheck className="text-green-600 text-xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Match Created Successfully!</h3>
            </div>
            <p className="text-gray-600 mb-6">
              The connection has been created and will appear in both users' sparks.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <FaTimes className="text-red-600 text-xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Error</h3>
            </div>
            <p className="text-gray-600 mb-6">
              {errorMessage}
            </p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDirectMatching;
