import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { calculateAge } from '../../../utils/ageCalculator';

const SeeAllMatches = () => {
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]); // {id,name,age,image,compatibility,selected}
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]); // up to 3

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
            const d = userDoc.data();
            return {
              id: m.userId,
              name: d.firstName ? `${d.firstName} ${d.lastName || ''}`.trim() : d.displayName || 'Unknown',
              age: calculateAge(d.birthDate),
              image: d.image || '/default-profile.png',
              compatibility: Math.round(m.score),
              selected: false,
            };
          })
        );
        setMatches(profiles.filter(Boolean));
      } catch (err) {
        console.error('Error fetching full matches', err);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  const toggleSelect = (matchId) => {
    setMatches((prev) => prev.map(m => m.id === matchId ? { ...m, selected: !m.selected } : m));
    setSelectedIds((prev) => {
      const exists = prev.includes(matchId);
      if (exists) return prev.filter(id => id !== matchId);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, matchId];
    });
  };

  const handleConfirm = async () => {
    if (selectedIds.length === 0) return navigate(-1);
    const user = auth.currentUser;
    if (!user) return;

    try {
      for (const matchedUid of selectedIds) {
        const otherRef = doc(db, 'users', matchedUid, 'connections', user.uid);
        const otherSnap = await getDoc(otherRef);
        const isMutual = otherSnap.exists();

        await setDoc(doc(db, 'users', user.uid, 'connections', matchedUid), {
          connectedAt: serverTimestamp(),
          status: isMutual ? 'mutual' : 'pending',
        }, { merge: true });

        if (isMutual) {
          await setDoc(otherRef, { status: 'mutual' }, { merge: true });
        }
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('Error saving selections', err);
    }
  };

  if (loading) return <div className="p-8 text-lg text-gray-600">Loading matches...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold text-center mb-8">Select your Matches</h1>
      <div className="grid grid-cols-2 gap-6 max-w-5xl mx-auto">
        {matches.map(match => (
          <div key={match.id} onClick={() => toggleSelect(match.id)}
            className={`cursor-pointer flex items-center bg-white rounded-2xl overflow-hidden border-2 ${match.selected ? 'border-[#0043F1] bg-[#0043F1]' : 'border-[#85A2F2]'}`}
          >
            <div className={`w-20 flex items-center justify-center p-4 ${match.selected ? 'bg-[#0043F1]' : 'bg-[#85A2F2]'}`}>
              <div className={`h-10 w-10 ${match.selected ? 'text-[#9FE870]' : 'text-white'}`}>♥</div>
            </div>
            <div className="flex flex-col p-4 flex-grow bg-white">
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
                    <div className="w-32 h-2 bg-gray-200 rounded-full mr-3">
                      <div className="h-full bg-[#85A2F2] rounded-full" style={{ width: `${match.compatibility}%` }} />
                    </div>
                    <span className="text-sm font-medium text-gray-600">{match.compatibility}% Match</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-8 max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="bg-[#85A2F2] text-white px-8 py-2 rounded-lg text-lg font-semibold hover:bg-[#7491e0] transition-colors">Back</button>
        <button onClick={handleConfirm} disabled={selectedIds.length === 0} className={`px-8 py-2 rounded-lg text-lg font-semibold transition-colors ${selectedIds.length ? 'bg-[#0043F1] text-white hover:bg-[#0034BD]' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}>SELECT</button>
      </div>
    </div>
  );
};

export default SeeAllMatches;
