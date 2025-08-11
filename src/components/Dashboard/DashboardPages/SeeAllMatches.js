import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, getDocs, setDoc, deleteDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';
import { calculateAge } from '../../../utils/ageCalculator';
import { DateTime } from 'luxon';
import PopUp from '../DashboardHelperComponents/PopUp';
import { formatUserName } from '../../../utils/nameFormatter';
import { IoPersonCircle } from 'react-icons/io5';

const MAX_SELECTIONS = 3; // maximum matches a user can choose

// Function to format date as "Wed, 10th of June"
const formatEventDate = (dateString, startTime) => {
  let dt;
  
  if (startTime) {
    // Use startTime if available (Remo events)
    dt = DateTime.fromMillis(Number(startTime));
  } else if (dateString) {
    // Use dateString for regular events
    dt = DateTime.fromISO(dateString);
  } else {
    return '';
  }
  
  if (!dt.isValid) {
    return '';
  }
  
  const dayOfWeek = dt.toFormat('ccc');
  const day = dt.toFormat('d');
  const month = dt.toFormat('LLLL');
  
  // Add ordinal suffix to day
  const getOrdinalSuffix = (day) => {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  
  return `${dayOfWeek}, ${day}${getOrdinalSuffix(day)} of ${month}`;
};


const SeeAllMatches = () => {
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]); // {id,name,age,image,compatibility,selected}
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]); // up to 3
  const [showMaxModal, setShowMaxModal] = useState(false); // controls the "max reached" modal visibility
  const [showCongratulationsModal, setShowCongratulationsModal] = useState(false); // controls the congratulations modal
  const [eventDate, setEventDate] = useState(''); // stores the formatted event date

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
        
        // Get the latest event details to display the date
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const latestEventId = userDoc.data()?.latestEventId;
        if (latestEventId) {
          const eventsSnapshot = await getDocs(collection(db, 'events'));
          let eventData = null;
          eventsSnapshot.forEach(docSnap => {
            if (docSnap.data().eventID === latestEventId) {
              eventData = docSnap.data();
            }
          });
          if (eventData) {
            const formattedDate = formatEventDate(eventData.date, eventData.startTime);
            setEventDate(formattedDate);
          }
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
              image: d.image || null,
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
      
      // Check if user has reached max selections for this event
      if (selectedIds.length >= MAX_SELECTIONS) {
        // Store flag in localStorage to show congratulations modal on dashboard
        localStorage.setItem('showCongratulationsModal', 'true');
      }
      
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
      <div className="min-h-screen bg-white p-8">
        {/* Header */}
        <div className="max-w-[1292px] mx-auto">
          <div className="mb-4 xl:mb-5 2xl:mb-6">
            <h2 className="text-[#211F20] font-bricolage text-[32px] md:text-[40px] lg:text-[48px] font-semibold leading-[110%]">Select your Matches</h2>
          </div>
          <div className="mb-6 sm:mb-[50px] xl:mb-[75px] 2xl:mb-[100px]">
            <p className="text-[rgba(33,31,32,0.75)] font-bricolage text-[14px] sm:text-[16px] md:text-[20px] lg:text-[24px] font-medium leading-[130%]">
              Pick who you'd like to match with from your speed date on: {eventDate && <span>{eventDate}</span>}
            </p>
          </div>
        </div>
       
        <div className="max-w-[1292px] mx-auto flex flex-col gap-4">
  {matches.map((match, index) => {
    const isDisabled = !match.selected && selectedIds.length >= MAX_SELECTIONS;
    return (
      <div
        key={match.id}
        onClick={() => handleCardClick(match)}
        className={`relative flex flex-col md:flex-row items-start md:items-center gap-y-3 md:gap-y-0 md:gap-x-0 w-full bg-white rounded-2xl border border-gray-200 p-[24px] xl:p-[20px] md:p-[16px] sm:p-[12px] shadow-sm transition-all duration-500 cursor-pointer ${match.selected ? 'ring-2 ring-[#211F20]' : ''} ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {/* 1. Rank Number */}
        {/* 2. Profile picture + name/age */}
        <div className="flex items-center min-w-[200px]">
        <span className="text-[14px] sm:text-[16px] md:text-[20px] lg:text-[24px] leading-[130%] font-bricolage font-medium text-[rgba(33,31,32,0.50)]">
            #{index + 1}
          </span>
          <div className="w-2 sm:w-3 xl:w-3.5 2xl:w-4"></div>
          {match.image ? (
            <img
              src={match.image}
              alt={match.name}
              className="w-12 h-12 rounded-full object-cover border border-gray-300"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center border border-gray-300 overflow-hidden">
              <IoPersonCircle className="w-16 h-16 text-gray-400 transform scale-125" />
            </div>
          )}
          <div className="w-2 sm:w-3 xl:w-3.5 2xl:w-4"></div>
          <span className="text-[14px] sm:text-[14px] md:text-[16px] lg:text-[20px] leading-[130%] font-poppins font-normal text-[#211F20]">
            {match.name}, {match.age}
          </span>
        </div>

        {/* Gap-L between profile and compatibility */}
        <div className="w-[4.5] sm:w-6 xl:w-8 2xl:w-[12.5]"></div>

        {/* 3. Compatibility badge and progress bar - responsive layout */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 lg:gap-4 ml-auto w-full lg:w-auto">
          <div className="flex justify-start w-full lg:w-auto">
            <span className="flex items-center gap-2 px-2 sm:px-3 md:px-4 py-1 sm:py-2 rounded-[100px] font-bricolage font-normal text-[10px] sm:text-[12px] md:text-[14px] lg:text-[16px] leading-[130%] text-[#211F20] uppercase border border-[rgba(33,31,32,0.10)]"
              style={{
                background: (index % 3) === 0 
                  ? "radial-gradient(50% 50% at 50% 50%, #B4FFF280 0%, #E1FFD680 100%)"
                  : (index % 3) === 1
                  ? "radial-gradient(50% 50% at 50% 50%, #E2FF6580 0%, #D2FFD780 100%)"
                  : "radial-gradient(50% 50% at 50% 50%, #B0EEFF80 0%, #E7E9FF80 100%), radial-gradient(50% 50% at 50% 50%, #E2FF6580 0%, #D2FFD780 100%)"
              }}
            >
              {match.compatibility}% COMPATIBILITY
            </span>
          </div>
          
          {/* 4. Progress bar */}
          <div className="w-full lg:w-[700px]">
            <div className="h-1 bg-[rgba(33,31,32,0.10)] rounded-full relative overflow-hidden" style={{ height: '4px' }}>
              <div
                className="absolute left-0 top-0 rounded-full transition-all duration-1000"
                style={{
                  width: `${match.compatibility}%`,
                  height: '4px',
                  background: '#211F20',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  })}
</div>

        <div className="max-w-[1292px] mx-auto mt-8">
          <div className="flex gap-6 sm:gap-5 md:gap-4 lg:gap-4 py-3 sm:py-2.5 md:py-2 lg:py-2 w-full">  
            <button onClick={() => navigate(-1)} className="flex-1 bg-white text-[#211F20] px-4 sm:px-4 xl:px-5 2xl:px-6 py-3 sm:py-2.5 md:py-2 lg:py-2 rounded-lg font-poppins text-[12px] sm:text-[12px] md:text-[14px] lg:text-[16px] font-medium leading-normal border border-[#211F20] hover:bg-gray-50 transition-colors">Back</button>
            <button onClick={handleConfirm} disabled={selectedIds.length === 0} className={`flex-1 px-4 sm:px-4 xl:px-5 2xl:px-6 py-3 sm:py-2.5 md:py-2 lg:py-2 rounded-lg font-poppins text-[12px] sm:text-[12px] md:text-[14px] lg:text-[16px] font-medium leading-normal transition-colors ${selectedIds.length ? 'bg-[#211F20] text-white hover:bg-[#333]' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}>Select</button>
          </div>
        </div>
      </div>


      {/* Modal shown when user tries to exceed the maximum selections */}
      <PopUp
        isOpen={showMaxModal}
        onClose={() => setShowMaxModal(false)}
        title="Maximum selections reached"
        subtitle={`You can only select up to ${MAX_SELECTIONS} connections. Deselect a current selection to choose another.`}
        icon="⚠"
        iconColor="yellow"
        primaryButton={{
          text: "Got it",
          onClick: () => setShowMaxModal(false)
        }}
      />
    </>
  );
};

export default SeeAllMatches;
