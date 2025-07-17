import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { calculateAge } from '../../../utils/ageCalculator';

const MyMatches = ({ onConnect }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        const user = auth.currentUser;
        if (!user) return;
        // 1. Fetch matches from Firestore
        const matchesDoc = await getDoc(doc(db, 'matches', user.uid));
        if (!matchesDoc.exists()) {
          setMatches([]);
          setLoading(false);
          return;
        }
        const results = matchesDoc.data().results || [];
        // 2. For each match, fetch user profile
        const top3 = results.slice(0, 3);
        const profiles = await Promise.all(
          top3.map(async (m) => {
            const userDoc = await getDoc(doc(db, 'users', m.userId));
            if (!userDoc.exists()) return null;
            const data = userDoc.data();
            return {
              userId: m.userId,
              score: m.score,
              name: data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : data.displayName || 'Unknown',
              age: calculateAge(data.birthDate),
              image: data.image || '',
              ...data,
            };
          })
        );
        setMatches(profiles.filter(Boolean));
      } catch (err) {
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  const handleConnect = async (matchedUid) => {
    const user = auth.currentUser;
    if (!user) {
      console.error('[CONNECT] No authenticated user found');
      return;
    }
    
    console.log('[CONNECT] Starting connection process...');
    console.log('[CONNECT] Current user ID:', user.uid);
    console.log('[CONNECT] Matched user ID:', matchedUid);
    
    // Find the match score for this user
    const match = matches.find(m => m.userId === matchedUid);
    const matchScore = match ? match.score : 0; // Use actual score or 0, not hardcoded 85
    
    console.log('[CONNECT] Found match:', match);
    console.log('[CONNECT] Match score to store:', matchScore);
    
    try {
      // Check if the other user has already connected with current user
      const otherUserConnectionRef = doc(db, 'users', matchedUid, 'connections', user.uid);
      const otherUserConnectionDoc = await getDoc(otherUserConnectionRef);
      const isMutual = otherUserConnectionDoc.exists();
      
      console.log('[CONNECT] Other user connection exists:', isMutual);
      
      // Store current user's connection
      const connectionRef = doc(db, 'users', user.uid, 'connections', matchedUid);
      console.log('[CONNECT] Connection document path:', connectionRef.path);
      
      const connectionData = {
        connectedAt: serverTimestamp(),
        matchScore: matchScore,
        status: isMutual ? 'mutual' : 'pending'
      };
      
      await setDoc(connectionRef, connectionData, { merge: true });
      console.log('[CONNECT] Current user connection saved with status:', connectionData.status);
      
      // If mutual, update the other user's connection status too
      if (isMutual) {
        await setDoc(otherUserConnectionRef, { status: 'mutual' }, { merge: true });
        console.log('[CONNECT] Updated other user connection to mutual');
      }
      
      console.log('[CONNECT] Connection saved successfully to Firebase');
      
      setMatches((prev) => prev.map(m => m.userId === matchedUid ? { ...m, connected: true } : m));
      if (onConnect) onConnect();
      
      console.log('[CONNECT] UI updated and onConnect callback triggered');
    } catch (error) {
      console.error('[CONNECT] Error saving connection to Firebase:', error);
    }
  };

  if (loading) return <div className="p-8 text-lg text-gray-600">Loading your matches...</div>;
  if (!matches.length) return <div className="p-8 text-lg text-gray-600">No matches found yet. Try again after your next event!</div>;

  return (
    <div className="p-7 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)] max-sm:p-5">
      <div className="mb-6 text-xl font-semibold text-indigo-950">Matched in Heaven</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {matches.map((match, idx) => (
          <div key={match.userId} className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <img
              src={match.image || '/default-profile.png'}
              alt={match.name}
              className="w-24 h-24 rounded-full object-cover mb-4 border"
            />
            <div className="text-lg font-bold text-indigo-900 mb-1">{match.name}</div>
            <div className="text-gray-600 mb-2">Age: {match.age}</div>
            <div className="text-blue-600 font-semibold text-xl mb-2">{Math.round(match.score)}% Match</div>
            {/* Add more profile info as needed */}
            <button
              className={`mt-2 px-4 py-1 text-sm font-medium rounded-lg transition-colors ${match.connected ? 'bg-green-400 text-white cursor-default' : 'bg-[#0043F1] text-white hover:bg-[#0034BD]'}`}
              onClick={() => handleConnect(match.userId)}
              disabled={match.connected}
            >
              {match.connected ? 'Connected!' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
      <button
        className="mt-8 px-4 py-2 text-sm font-medium text-white bg-[#0043F1] rounded-lg hover:bg-[#0034BD] transition-colors"
        onClick={() => navigate('/dashboard')}
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default MyMatches;
