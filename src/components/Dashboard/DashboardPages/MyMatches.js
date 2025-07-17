import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { calculateAge } from '../../../utils/ageCalculator';

const MyMatches = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleMatches, setVisibleMatches] = useState([]);

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        const user = auth.currentUser;
        if (!user) return;
        const matchesDoc = await getDoc(doc(db, 'matches', user.uid));
        if (!matchesDoc.exists()) {
          setMatches([]);
          return;
        }
        const results = (matchesDoc.data().results || []).sort((a,b) => b.score - a.score);
        const profiles = await Promise.all(
          results.map(async (m) => {
            const userDoc = await getDoc(doc(db, 'users', m.userId));
            if (!userDoc.exists()) return null;
            const data = userDoc.data();
            return {
              id: m.userId,
              name: data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : data.displayName || 'Unknown',
              age: calculateAge(data.birthDate),
              image: data.image || '/default-profile.png',
              compatibility: Math.round(m.score),
            };
          })
        );
        setMatches(profiles.filter(Boolean));
      } catch (e) {
        console.error('Error fetching matches', e);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  // animation when matches list changes
  useEffect(() => {
    setVisibleMatches([]);
    const timers = [
      setTimeout(() => setVisibleMatches([2]), 500),
      setTimeout(() => setVisibleMatches([2,1]), 1500),
      setTimeout(() => setVisibleMatches([2,1,0]), 2500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, [matches]);

  if (loading) return <div className="p-8 text-lg text-gray-600">Loading your matches...</div>;
  if (!matches.length) return <div className="p-8 text-lg text-gray-600">No matches yet. Check after your next event!</div>;

  const topThree = matches.slice(0,3);

  return (
    <div className="min-h-screen bg-white p-8">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-center mb-2">Matched in Heaven</h1>
        <p className="text-xl text-center text-gray-700">Here are your suggestions powered by AI</p>
      </div>

      {/* Matches Container */}
      <div className="max-w-3xl mx-auto space-y-6">
        {topThree.map((match, index) => (
          <div key={match.id} className={`flex items-center bg-white rounded-lg overflow-hidden border-2 border-[#85A2F2] transition-all duration-500 transform ${visibleMatches.includes(index) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full'}`}>
            {/* Rank */}
            <div className="w-12 flex items-center justify-center">
              <span className={`text-2xl font-bold text-[#85A2F2] transition-all duration-500 transform ${visibleMatches.includes(index) ? 'scale-100' : 'scale-0'}`}>#{index+1}</span>
            </div>
            {/* Heart */}
            <div className="w-20 bg-[#85A2F2] h-full flex items-center justify-center p-4">
              <div className={`text-white text-3xl transition-transform duration-500 ${visibleMatches.includes(index) ? 'scale-100' : 'scale-0'}`}>♥</div>
            </div>
            {/* Details */}
            <div className="flex flex-col p-4 flex-grow">
              <div className="flex items-center mb-2">
                <div className="w-16 h-16 rounded-full overflow-hidden mr-4">
                  <img src={match.image} alt={match.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold mr-2">{match.name},</span>
                    <span className="text-2xl">{match.age}</span>
                  </div>
                  <div className="flex items-center mt-1">
                    <div className="w-48 h-2 bg-gray-200 rounded-full mr-3 overflow-hidden">
                      <div className="h-full bg-[#85A2F2] rounded-full transition-all duration-1000" style={{ width: visibleMatches.includes(index) ? `${match.compatibility}%` : 0 }} />
                    </div>
                    <span className={`text-sm font-medium text-gray-600 transition-opacity duration-500 ${visibleMatches.includes(index) ? 'opacity-100' : 'opacity-0'}`}>{match.compatibility}% Match</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* See All Button */}
      <div className="flex justify-end mt-8 max-w-3xl mx-auto">
        <button onClick={() => navigate('seeAllMatches')} className="bg-[#85A2F2] text-white px-8 py-2 rounded-lg text-lg font-semibold hover:bg-[#7491e0] transition-colors">SEE ALL</button>
      </div>
    </div>
  );
};

export default MyMatches;
