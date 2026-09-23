import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';

/* ============================================================
   PRESENTATION ONLY — shared style tag, no logic touched.
   ============================================================ */
const StyleTag = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&display=swap');
    .circuit-sparks { font-family: 'Poppins','Calibri','Candara',system-ui,sans-serif; }
    .circuit-sparks .display { font-family: 'Bricolage Grotesque','Calibri',sans-serif; }
    @keyframes sparksIn { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform: translateY(0); } }
    @keyframes sparksSpin { to { transform: rotate(360deg); } }
    @keyframes sparkPulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50%      { transform: scale(1.08); opacity: 0.85; }
    }
    @keyframes sparkPop {
      from { opacity: 0; transform: scale(0.94); }
      to   { opacity: 1; transform: scale(1); }
    }
    .circuit-sparks-in { animation: sparksIn .6s cubic-bezier(.22,1,.36,1) both; }
    .circuit-sparks-pop { animation: sparkPop .55s cubic-bezier(.22,1,.36,1) both; }
    .circuit-sparks-pulse { animation: sparkPulse 2.4s ease-in-out infinite; }
    .circuit-sparks-card {
      transition: transform .28s cubic-bezier(.22,1,.36,1), box-shadow .28s ease, border-color .28s ease;
    }
    .circuit-sparks-card:hover {
      transform: translateY(-4px);
      box-shadow:
        0 1px 2px rgba(28,25,23,0.04),
        0 24px 48px -20px rgba(28,25,23,0.18),
        0 0 0 1px rgba(245,158,11,0.35),
        0 30px 60px -30px rgba(245,158,11,0.35);
      border-color: #d97706;
    }
    @media (prefers-reduced-motion: reduce) {
      .circuit-sparks-in, .circuit-sparks-pop, .circuit-sparks-pulse { animation: none !important; }
      .circuit-sparks-card:hover { transform: none; }
      * { transition: none !important; }
    }
  `}</style>
);

const canvasBg =
  'radial-gradient(900px 620px at 12% 6%, #fff5d6 0%, transparent 60%), ' +
  'radial-gradient(800px 620px at 92% 94%, #f0e2bd 0%, transparent 58%), ' +
  'linear-gradient(160deg, #fdfaf3 0%, #f4ecd9 100%)';

const MySparks = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const guestUid = location.state?.guestUid || localStorage.getItem('guestUid');

  const [sparks, setSparks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSparks = async () => {
      const userId = guestUid || auth.currentUser?.uid;
      if (!userId) {
        setError('No user identifier found. Please register for an event first.');
        setLoading(false);
        return;
      }

      try {
        const connsSnap = await getDocs(collection(db, 'users', userId, 'connections'));
        const sparksList = [];

        for (const connDoc of connsSnap.docs) {
          const otherUserId = connDoc.id;
          const connData = connDoc.data();

          if (connData.status !== 'mutual' && !connData.isSpark) continue;

          const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
          let name = otherUserId;
          if (otherUserDoc.exists()) {
            const data = otherUserDoc.data();
            name = data.firstName
              ? `${data.firstName} ${data.lastName || ''}`.trim()
              : data.userName || data.displayName || otherUserId;
          }

          let eventTitle = 'Event';
          if (connData.eventId) {
            const eventSnap = await getDoc(doc(db, 'events', connData.eventId));
            if (eventSnap.exists()) {
              eventTitle = eventSnap.data().title || eventSnap.data().eventName || 'Event';
            }
          }

          sparksList.push({
            partnerId: otherUserId,
            partnerName: name,
            eventId: connData.eventId,
            eventTitle,
            isSpark: connData.isSpark || false,
            matchedAt: connData.createdAt?.toDate?.() || new Date(),
          });
        }

        setSparks(sparksList);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching sparks:', err);
        setError(err.message || 'Failed to load your sparks.');
        setLoading(false);
      }
    };

    fetchSparks();
  }, [guestUid]);

  /* ---------- Loading state ---------- */
  if (loading) {
    return (
      <>
        <StyleTag />
        <div
          className="circuit-sparks min-h-screen flex items-center justify-center p-4"
          style={{ background: canvasBg }}
        >
          <div className="circuit-sparks-in relative w-full max-w-md overflow-hidden rounded-[26px] border border-[#eae4d2] bg-white p-10 text-center shadow-[0_1px_2px_rgba(28,25,23,0.04),0_24px_48px_-20px_rgba(28,25,23,0.18)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f59e0b] via-[#ffd24a] to-[#d9f55c]" />
            <div
              className="mx-auto mb-5 h-11 w-11 rounded-full border-[3px] border-[#eae4d2]"
              style={{ borderTopColor: '#d97706', animation: 'sparksSpin .9s linear infinite' }}
            />
            <p className="m-0 text-[11px] font-bold uppercase tracking-[0.28em] text-[#a85e02]">
              Gathering your sparks
            </p>
          </div>
        </div>
      </>
    );
  }

  /* ---------- Error state ---------- */
  if (error) {
    return (
      <>
        <StyleTag />
        <div
          className="circuit-sparks min-h-screen flex items-center justify-center p-4"
          style={{ background: canvasBg }}
        >
          <div className="circuit-sparks-in relative w-full max-w-md overflow-hidden rounded-[26px] border border-[#eae4d2] bg-white p-9 text-center shadow-[0_1px_2px_rgba(28,25,23,0.04),0_24px_48px_-20px_rgba(28,25,23,0.18)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f59e0b] via-[#ffd24a] to-[#d9f55c]" />
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#fdecef] text-[26px]">
              ⚠️
            </div>
            <p className="m-0 text-[15px] font-semibold leading-relaxed text-[#c7385a]">{error}</p>
          </div>
        </div>
      </>
    );
  }

  /* ---------- Main render ---------- */
  return (
    <>
      <StyleTag />
      <div
        className="circuit-sparks min-h-screen p-5 sm:p-8"
        style={{ background: canvasBg }}
      >
        <div className="mx-auto max-w-3xl">

          {/* 🔥 Back to Dashboard button */}
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-6 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-[#1c1917] bg-white border border-[#eae4d2] hover:bg-[#fff8e1] transition-colors"
          >
            ← Back to Dashboard
          </button>

          {/* Header */}
          <header className="circuit-sparks-in mb-8 sm:mb-10">
            <p className="m-0 mb-3 text-[11px] font-extrabold uppercase tracking-[0.28em] text-[#a85e02]">
              Your connections
            </p>

            <h1 className="display m-0 text-[32px] sm:text-[44px] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#1c1917] flex items-center gap-3">
              <span
                className="circuit-sparks-pulse inline-flex h-11 w-11 flex-none items-center justify-center rounded-full bg-gradient-to-b from-[#fff8e1] to-[#ffe9a3] text-[22px] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_24px_-10px_rgba(217,119,6,0.55),0_0_0_8px_rgba(255,210,74,0.15)]"
                aria-hidden="true"
              >
                💥
              </span>
              <span>
                Your <span className="italic text-[#a85e02]">Sparks</span>
              </span>
            </h1>

            <div className="mt-5 h-[3px] w-12 rounded-full bg-gradient-to-r from-[#f59e0b] to-[#ffd24a]" />

            {sparks.length > 0 && (
              <p className="mt-5 mb-0 max-w-md text-[14.5px] leading-relaxed text-[#4a4540]">
                {sparks.length} mutual {sparks.length === 1 ? 'spark' : 'sparks'}. Reach out — the fun part starts now.
              </p>
            )}
          </header>

          {/* Empty state */}
          {sparks.length === 0 ? (
            <div className="circuit-sparks-pop relative overflow-hidden rounded-[28px] border border-[#eae4d2] bg-white p-8 sm:p-12 text-center shadow-[0_1px_2px_rgba(28,25,23,0.04),0_24px_48px_-20px_rgba(28,25,23,0.18)]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f59e0b] via-[#ffd24a] to-[#d9f55c]" />

              <div className="mx-auto mb-6 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-gradient-to-b from-[#fff8e1] to-[#ffe9a3] text-[40px] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_14px_30px_-10px_rgba(217,119,6,0.5),0_0_0_10px_rgba(255,210,74,0.15)]">
                ⚡
              </div>

              <h2 className="display m-0 text-[24px] sm:text-[28px] font-extrabold leading-[1.15] tracking-[-0.02em] text-[#1c1917]">
                No sparks <span className="italic text-[#a85e02]">yet</span>
              </h2>

              <p className="mx-auto mt-4 mb-0 max-w-sm text-[15px] leading-relaxed text-[#4a4540]">
                Attend an event and pick your favourites — when the feeling is mutual, they'll appear right here.
              </p>
            </div>
          ) : (
            /* Sparks list */
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {sparks.map((spark, idx) => {
                const initial = (spark.partnerName || '?').trim().charAt(0).toUpperCase();

                return (
                  <li
                    key={idx}
                    className="circuit-sparks-card circuit-sparks-in group relative overflow-hidden rounded-3xl border-[1.5px] border-[#eae4d2] bg-white p-5 sm:p-6 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_12px_28px_-14px_rgba(28,25,23,0.14)]"
                    style={{ animationDelay: `${Math.min(idx * 60, 400)}ms` }}
                  >
                    {/* Amber → lime accent line on the left edge */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-0 top-5 bottom-5 w-1 rounded-full bg-gradient-to-b from-[#f59e0b] via-[#ffd24a] to-[#d9f55c] opacity-90 transition-all duration-300 group-hover:top-3 group-hover:bottom-3"
                    />

                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">

                      {/* Left: avatar + info */}
                      <div className="flex min-w-0 items-start gap-4">
                        <span
                          className="flex h-14 w-14 flex-none items-center justify-center rounded-full text-[20px] font-extrabold text-[#a85e02] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_16px_-6px_rgba(168,94,2,0.4)]"
                          style={{
                            background:
                              'linear-gradient(180deg, #fff8e1 0%, #ffe9a3 100%)',
                          }}
                          aria-hidden="true"
                        >
                          {initial}
                        </span>

                        <div className="min-w-0">
                          <p className="m-0 mb-1 text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-[#a85e02]">
                            Mutual spark
                          </p>

                          <h3 className="display m-0 truncate text-[19px] sm:text-[21px] font-extrabold leading-tight tracking-[-0.015em] text-[#1c1917]">
                            {spark.partnerName}
                          </h3>

                          <p className="m-0 mt-2 flex items-center gap-2 text-[13px] text-[#4a4540]">
                            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
                            <span className="truncate font-semibold">{spark.eventTitle}</span>
                          </p>

                          <p className="m-0 mt-1 text-[12px] text-[#7a736b]">
                            Matched {spark.matchedAt.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Right: message CTA */}
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/dashboard/messages/${spark.partnerId}/${spark.eventId}`)
                        }
                        className="group/btn flex w-full flex-none items-center justify-center gap-2 rounded-2xl px-5 py-3 text-[14.5px] font-extrabold tracking-[0.005em] text-[#fffaf0] transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ffd24a]/60 hover:-translate-y-0.5 active:translate-y-0 sm:w-auto"
                        style={{
                          background: 'linear-gradient(180deg, #1c1917 0%, #0d0a09 100%)',
                          boxShadow:
                            'inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 20px -8px rgba(0,0,0,0.5), 0 18px 36px -16px rgba(0,0,0,0.35)',
                        }}
                      >
                        <span>Message</span>
                        <span className="text-[16px] transition-transform duration-200 group-hover/btn:translate-x-1">
                          →
                        </span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Footer note (only when there are sparks) */}
          {sparks.length > 0 && (
            <p className="mt-8 text-center text-[12.5px] leading-relaxed text-[#7a736b]">
              Only mutual sparks appear here. Everyone you see picked you back. ⚡
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default MySparks;