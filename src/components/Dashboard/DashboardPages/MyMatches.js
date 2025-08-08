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
      <div className="max-w-[1292px] mx-auto">
        <div className="mb-4 xl:mb-5 2xl:mb-6 text-left">
          <h2 className="text-[#211F20] font-bricolage text-[32px] md:text-[40px] lg:text-[48px] font-semibold leading-[110%]">Matched in Heaven</h2>
        </div>
        <div className="mb-6 sm:mb-[50px] xl:mb-[75px] 2xl:mb-[100px] text-left">
          <p className="text-[rgba(33,31,32,0.75)] font-bricolage text-[14px] sm:text-[16px] md:text-[20px] lg:text-[24px] font-medium leading-[130%]">Here are 3 AI-powered suggestions to match with</p>
        </div>
      </div>

      {/* Matches Container */}
      <div className="max-w-[1292px] mx-auto">
        <div className="flex flex-col gap-4">
          {topThree.map((match, index) => {
            const compatibility = typeof match.compatibility === "number" ? match.compatibility : 0;
            return (
              <div
                key={match.id}
                className={`relative flex flex-col md:flex-row items-start md:items-center gap-y-3 md:gap-y-0 md:gap-x-0 w-full bg-white rounded-2xl border border-gray-200 p-[24px] xl:p-[20px] md:p-[16px] sm:p-[12px] shadow-sm transition-all duration-500 transform ${visibleMatches.includes(index) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full'}`}
              >
                {/* 1. Rank Number */}
                {/* Profile picture + name/age */}
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
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-xl">👤</span>
                    </div>
                  )}
                  <div className="w-2 sm:w-3 xl:w-3.5 2xl:w-4"></div>
                  <span className="text-[14px] sm:text-[14px] md:text-[16px] lg:text-[20px] leading-[130%] font-poppins font-normal text-[#211F20]">
                    {match.name}, {match.age}
                  </span>
                </div>

                {/* Gap-L between profile and compatibility */}
                <div className="w-[4.5] sm:w-6 xl:w-8 2xl:w-[12.5]"></div>

                {/* 2. Compatibility badge and progress bar - responsive layout */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 lg:gap-4 ml-auto w-full lg:w-auto">
                  <div className="flex justify-start w-full lg:w-auto">
                    <span className="flex items-center gap-2 px-2 sm:px-3 md:px-4 py-1 sm:py-2 rounded-[100px] font-bricolage font-normal text-[10px] sm:text-[12px] md:text-[14px] lg:text-[16px] leading-[130%] text-[#211F20] uppercase border border-[rgba(33,31,32,0.10)]"
                      style={{
                        background: index === 0 
                          ? "radial-gradient(50% 50% at 50% 50%, #B4FFF280 0%, #E1FFD680 100%)"
                          : index === 1
                          ? "radial-gradient(50% 50% at 50% 50%, #E2FF6580 0%, #D2FFD780 100%)"
                          : "radial-gradient(50% 50% at 50% 50%, #B0EEFF80 0%, #E7E9FF80 100%), radial-gradient(50% 50% at 50% 50%, #E2FF6580 0%, #D2FFD780 100%)"
                      }}
                    >
                      {compatibility}% COMPATIBILITY
                    </span>
                  </div>
                  
                  {/* 3. Progress bar */}
                  <div className="w-full lg:w-[700px]">
                    <div className="h-1 bg-[rgba(33,31,32,0.10)] rounded-full relative overflow-hidden" style={{ height: '4px' }}>
                      <div
                        className="absolute left-0 top-0 rounded-full transition-all duration-1000"
                        style={{
                          width: visibleMatches.includes(index) ? `${compatibility}%` : 0,
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
      </div>


      <div className="max-w-[1292px] mx-auto h-[45vh] flex flex-col justify-end">
        <div className="mt-auto">
          <button 
            onClick={() => navigate('seeAllMatches')} 
            className="w-full flex justify-center items-center 
            gap-3 sm:gap-2.5 md:gap-2.5 lg:gap-3 
            py-[8px] sm:py-[8px] md:py-[10px] lg:py-[12px] 
            px-5 sm:px-5 md:px-5 lg:px-6 
            rounded-lg font-poppins text-[12px] 
            sm:text-[12px] md:text-[14px] lg:text-[16px] 
            font-medium leading-normal text-white bg-[#211F20] hover:bg-[#333] transition-colors">
            Next
          </button>
        </div>
      </div>

    </div>
  );
};

export default MyMatches;
