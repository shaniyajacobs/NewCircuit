import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, getDocs, setDoc, deleteDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';
import { calculateAge } from '../../../utils/ageCalculator';
import { formatUserName } from '../../../utils/nameFormatter';

const MAX_SELECTIONS = 5; // maximum matches a user can choose

const SeeAllMatches = () => {
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]); // {id,name,age,image,compatibility,selected}
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]); // up to 3
  const [showMaxModal, setShowMaxModal] = useState(false); // controls the "max reached" modal visibility

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
        // Fetch any existing selections from the user's connections sub-collection so that
        // previously chosen sparks appear pre-selected.
        const prevConnSnap = await getDocs(collection(db, 'users', user.uid, 'connections'));
        const prevSelectedIds = prevConnSnap.docs.map(d => d.id);

        const results = (matchesDoc.data().results || []).sort((a,b) => b.score - a.score);
        const profiles = await Promise.all(
          results.map(async (m) => {
            const userDoc = await getDoc(doc(db, 'users', m.userId));
            if (!userDoc.exists()) return null;
            const d = userDoc.data();
            return {
              id: m.userId,
              name: formatUserName(d),
              age: calculateAge(d.birthDate),
              image: d.image || '/default-profile.png',
              compatibility: Math.round(m.score),
              selected: prevSelectedIds.includes(m.userId),
            };
          })
        );
        const filtered = profiles.filter(Boolean);
        setMatches(filtered);
        setSelectedIds(prevSelectedIds.slice(0, MAX_SELECTIONS));
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
    // Update the selected state for the clicked user (we assume capacity already checked)
    setMatches((prev) => prev.map(m => m.id === matchId ? { ...m, selected: !m.selected } : m));

    setSelectedIds((prev) => {
      const exists = prev.includes(matchId);
      return exists ? prev.filter(id => id !== matchId) : [...prev, matchId];
    });
  };

  // Handle the card click while respecting the max-selection rule
  const handleCardClick = (match) => {
    if (!match.selected && selectedIds.length >= MAX_SELECTIONS) {
      setShowMaxModal(true);
      return;
    }
    toggleSelect(match.id);
  };

  const handleConfirm = async () => {
    if (selectedIds.length === 0) return navigate(-1);
    const user = auth.currentUser;
    if (!user) return;

    try {
      // 1️⃣ Delete any previous selections that the user has now deselected
      const existingSnap = await getDocs(collection(db, 'users', user.uid, 'connections'));
      const deletions = existingSnap.docs
        .filter(d => !selectedIds.includes(d.id))
        .map(d => deleteDoc(d.ref).catch(() => {}));

      // 2️⃣ Upsert current selections
      for (const matchedUid of selectedIds) {
        // Find the compatibility score for this match in local state
        const matchObj = matches.find(m => m.id === matchedUid);
        const score = matchObj ? matchObj.compatibility : null;

        const otherRef = doc(db, 'users', matchedUid, 'connections', user.uid);
        const otherSnap = await getDoc(otherRef);
        const isMutual = otherSnap.exists();

        await setDoc(doc(db, 'users', user.uid, 'connections', matchedUid), {
          connectedAt: serverTimestamp(),
          status: isMutual ? 'mutual' : 'pending',
          matchScore: score,
        }, { merge: true });

        if (isMutual) {
          // Also store the match score on the other user's document if it wasn't set before
          await setDoc(otherRef, { status: 'mutual', matchScore: score }, { merge: true });
        }
      }

      await Promise.all(deletions);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error saving selections', err);
    }
  };

  // Log whenever the selectedIds state changes (additional safety)
  useEffect(() => {
    if (!loading) {
      console.log('[SELECTION] Selected users:', matches.filter(m => selectedIds.includes(m.id)));
    }
  }, [selectedIds, matches, loading]);

  if (loading) return <div className="p-8 text-lg text-gray-600">Loading connections...</div>;

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-4xl font-bold text-center mb-8">Select your Connections</h1>
        <div className="grid grid-cols-2 gap-6 max-w-5xl mx-auto">
          {matches.map(match => {
            const isDisabled = !match.selected && selectedIds.length >= MAX_SELECTIONS;
            return (
              <div
                key={match.id}
                onClick={() => handleCardClick(match)}
                className={`flex items-center rounded-2xl overflow-hidden border-2 transition-opacity ${match.selected ? 'border-[#0043F1] bg-[#0043F1]' : 'bg-white border-[#85A2F2]'} ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
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
            );
          })}
        </div>

        <div className="flex justify-between mt-8 max-w-5xl mx-auto">
          <button onClick={() => navigate(-1)} className="bg-[#85A2F2] text-white px-8 py-2 rounded-lg text-lg font-semibold hover:bg-[#7491e0] transition-colors">Back</button>
          <button onClick={handleConfirm} disabled={selectedIds.length === 0} className={`px-8 py-2 rounded-lg text-lg font-semibold transition-colors ${selectedIds.length ? 'bg-[#0043F1] text-white hover:bg-[#0034BD]' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}>SELECT</button>
        </div>
      </div>

      {/* Modal shown when user tries to exceed the maximum selections */}
      {showMaxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-xl font-semibold mb-4 text-center">Maximum selections reached</h2>
            <p className="mb-6 text-center">You can only select up to {MAX_SELECTIONS} connections. Deselect a current selection to choose another.</p>
            <button
              onClick={() => setShowMaxModal(false)}
              className="bg-[#0043F1] text-white px-4 py-2 rounded-lg w-full"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SeeAllMatches;
