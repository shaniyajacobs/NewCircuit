import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';

/* ============================================================
   PRESENTATION ONLY — shared style tag, no logic touched.
   ============================================================ */
const StyleTag = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&display=swap');
    .circuit-selections { font-family: 'Poppins','Calibri','Candara',system-ui,sans-serif; }
    .circuit-selections .display { font-family: 'Bricolage Grotesque','Calibri',sans-serif; }
    @keyframes selectionsIn { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform: translateY(0); } }
    @keyframes spinRing { to { transform: rotate(360deg); } }
    @keyframes checkPop { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
    @keyframes successPop { from { opacity:0; transform: scale(0.94); } to { opacity:1; transform: scale(1); } }
    .circuit-selections-in { animation: selectionsIn .6s cubic-bezier(.22,1,.36,1) both; }
    .circuit-selections-check { animation: checkPop .35s cubic-bezier(.22,1,.36,1) both; }
    .circuit-selections-success { animation: successPop .6s cubic-bezier(.22,1,.36,1) both; }
    @media (prefers-reduced-motion: reduce) {
      .circuit-selections-in, .circuit-selections-check, .circuit-selections-success { animation: none !important; }
      * { transition: none !important; }
    }
  `}</style>
);

const canvasBg =
  'radial-gradient(900px 620px at 12% 6%, #fff5d6 0%, transparent 60%), ' +
  'radial-gradient(800px 620px at 92% 94%, #f0e2bd 0%, transparent 58%), ' +
  'linear-gradient(160deg, #fdfaf3 0%, #f4ecd9 100%)';

const EventSelections = () => {
  const { eventId, phone } = useParams();
  const navigate = useNavigate();
  const [attendees, setAttendees] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [currentUserDocId, setCurrentUserDocId] = useState(null);

  const user = auth.currentUser;

  useEffect(() => {
    const fetchData = async () => {
      if (!eventId) return;

      try {
        const attendeesRef = collection(db, 'events', eventId, 'signedUpUsers');
        let q;
        if (phone) {
          q = query(attendeesRef, where('phoneNumber', '==', phone));
        } else if (user) {
          q = query(attendeesRef, where('userId', '==', user.uid));
        } else {
          setError('No user identifier found.');
          setLoading(false);
          return;
        }

        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          setError('Attendee not found.');
          setLoading(false);
          return;
        }

        const currentDoc = querySnapshot.docs[0];
        setCurrentUserDocId(currentDoc.id);
        const currentData = currentDoc.data();
        const myRoundAssignments = currentData.roundAssignments || {};

        console.log(' My doc ID:', currentDoc.id);
        console.log(' My roundAssignments:', myRoundAssignments);

        // Get unique partner IDs from roundAssignments
        const partnerIds = [...new Set(Object.values(myRoundAssignments))].filter(Boolean);

        console.log('🔎 Unique partner IDs:', partnerIds);

        if (partnerIds.length === 0) {
          setError('No round assignments found. Please contact the host to regenerate rounds.');
          setLoading(false);
          return;
        }

        // Fetch only the partner attendees
        const allAttendeesSnap = await getDocs(attendeesRef);
        const partners = allAttendeesSnap.docs
          .filter(d => partnerIds.includes(d.id))
          .map(d => ({ id: d.id, ...d.data() }));

        console.log('🔎 Partners found:', partners.length);

        if (partners.length === 0) {
          setError('No matching partners found. The round data may be stale — please contact the host.');
          setLoading(false);
          return;
        }

        setAttendees(partners);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching attendees:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId, phone, user]);

  const toggleSelect = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(s => s !== id));
    } else if (selected.length < 3) {
      setSelected([...selected, id]);
    }
  };

  const submitSelections = async () => {
    if (selected.length === 0) {
      alert('Select at least one person');
      return;
    }

    try {
      const attendeeRef = doc(db, 'events', eventId, 'signedUpUsers', currentUserDocId);
      await updateDoc(attendeeRef, {
        selections: selected,
        selectionSubmitted: true,
        selectionSubmittedAt: new Date(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting selections:', err);
      alert('Failed to submit. Please try again.');
    }
  };

  /* ---------- Loading state ---------- */
  if (loading) {
    return (
      <>
        <StyleTag />
        <div
          className="circuit-selections min-h-screen flex items-center justify-center p-4"
          style={{ background: canvasBg }}
        >
          <div className="circuit-selections-in relative w-full max-w-md overflow-hidden rounded-[26px] border border-[#eae4d2] bg-white p-10 text-center shadow-[0_1px_2px_rgba(28,25,23,0.04),0_24px_48px_-20px_rgba(28,25,23,0.18)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f59e0b] via-[#ffd24a] to-[#d9f55c]" />
            <div
              className="mx-auto mb-5 h-11 w-11 rounded-full border-[3px] border-[#eae4d2]"
              style={{ borderTopColor: '#d97706', animation: 'spinRing .9s linear infinite' }}
            />
            <p className="m-0 text-[11px] font-bold uppercase tracking-[0.28em] text-[#a85e02]">
              Gathering your connections
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
          className="circuit-selections min-h-screen flex items-center justify-center p-4"
          style={{ background: canvasBg }}
        >
          <div className="circuit-selections-in relative w-full max-w-md overflow-hidden rounded-[26px] border border-[#eae4d2] bg-white p-9 text-center shadow-[0_1px_2px_rgba(28,25,23,0.04),0_24px_48px_-20px_rgba(28,25,23,0.18)]">
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

  /* ---------- Submitted state ---------- */
  if (submitted) {
    return (
      <>
        <StyleTag />
        <div
          className="circuit-selections min-h-screen flex items-center justify-center p-4"
          style={{ background: canvasBg }}
        >
          <div className="circuit-selections-success relative w-full max-w-md overflow-hidden rounded-[28px] border border-[#eae4d2] bg-white p-9 text-center shadow-[0_1px_2px_rgba(28,25,23,0.04),0_24px_48px_-20px_rgba(28,25,23,0.18)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f59e0b] via-[#ffd24a] to-[#d9f55c]" />

            <div className="mx-auto mb-6 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-gradient-to-b from-[#fff8e1] to-[#ffe9a3] text-[42px] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_14px_30px_-10px_rgba(217,119,6,0.5),0_0_0_10px_rgba(255,210,74,0.15)]">
              🎉
            </div>

            <p className="m-0 mb-3 text-[11px] font-extrabold uppercase tracking-[0.28em] text-[#a85e02]">
              Submitted
            </p>

            <h2 className="display m-0 text-[26px] sm:text-[30px] font-extrabold leading-[1.15] tracking-[-0.025em] text-[#1c1917]">
              Your sparks are in.
            </h2>

            <p className="mx-auto mt-4 mb-0 max-w-sm text-[15px] leading-relaxed text-[#4a4540]">
              Thank you — we'll let you know tomorrow if any of your picks are mutual. Fingers crossed. ⚡
            </p>
          </div>
        </div>
      </>
    );
  }

  /* ---------- Derived UI values (no logic change) ---------- */
  const atLimit = selected.length >= 3;

  /* ---------- Main render ---------- */
  return (
    <>
      <StyleTag />
      <div
        className="circuit-selections min-h-screen flex flex-col items-center justify-center p-4 sm:p-6"
        style={{ background: canvasBg }}
      >
        <div className="circuit-selections-in w-full max-w-3xl">
          <div className="relative overflow-hidden rounded-[28px] border border-[#eae4d2] bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04),0_24px_48px_-20px_rgba(28,25,23,0.18),0_60px_100px_-50px_rgba(28,25,23,0.14)]">

            {/* Amber → lime accent bar */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f59e0b] via-[#ffd24a] to-[#d9f55c]" />

            <div className="p-6 sm:p-10">
              {/* Header */}
              <div className="text-center">
                <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.28em] text-[#a85e02]">
                  The final step
                </p>

                <h2 className="display m-0 text-[26px] sm:text-[36px] font-extrabold leading-[1.1] tracking-[-0.03em] text-[#1c1917]">
                  Who sparked <span className="italic text-[#a85e02]">your interest?</span>
                </h2>

                <div className="mx-auto mt-5 mb-6 h-[3px] w-12 rounded-full bg-gradient-to-r from-[#f59e0b] to-[#ffd24a]" />

                <p className="mx-auto mb-0 max-w-md text-[14.5px] leading-relaxed text-[#4a4540]">
                  Pick up to 3 people you'd like to see again. If they pick you too, we'll connect you tomorrow.
                </p>
              </div>

              {/* Progress meter */}
              <div className="mt-8 mb-6 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-2.5 w-8 rounded-full transition-all duration-300"
                      style={{
                        background:
                          i < selected.length
                            ? 'linear-gradient(90deg, #f59e0b 0%, #ffd24a 100%)'
                            : '#f0e9d4',
                        boxShadow:
                          i < selected.length ? '0 0 12px rgba(255, 210, 74, 0.55)' : 'none',
                      }}
                    />
                  ))}
                </div>

                <span className="text-[13px] font-bold tabular-nums text-[#4a4540]">
                  {selected.length}{' '}
                  <span className="text-[#7a736b]">of 3 selected</span>
                </span>

                {atLimit && (
                  <span className="ml-auto rounded-full bg-[#fff8e1] px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-[#a85e02]">
                    Max reached
                  </span>
                )}
              </div>

              {/* Attendee grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {attendees.map((attendee) => {
                  const name =
                    attendee.firstName ||
                    attendee.userName ||
                    attendee.displayName ||
                    'Unknown';
                  const outfit = attendee.outfitDescription || 'No outfit';
                  const isSelected = selected.includes(attendee.id);
                  const isDimmed = atLimit && !isSelected;
                  const initial = name.charAt(0).toUpperCase();

                  return (
                    <button
                      key={attendee.id}
                      type="button"
                      onClick={() => toggleSelect(attendee.id)}
                      className="group relative flex items-start gap-3.5 rounded-2xl border-[1.5px] p-4 text-left transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ffd24a]/50"
                      style={{
                        background: isSelected
                          ? 'linear-gradient(180deg, #fff8e1 0%, #ffefc2 100%)'
                          : '#fffdf7',
                        borderColor: isSelected ? '#d97706' : '#e0dbd0',
                        opacity: isDimmed ? 0.45 : 1,
                        cursor: isDimmed ? 'not-allowed' : 'pointer',
                        boxShadow: isSelected
                          ? '0 0 0 3px rgba(255, 210, 74, 0.35), 0 10px 24px -10px rgba(168, 94, 2, 0.4)'
                          : '0 1px 2px rgba(28, 25, 23, 0.03)',
                      }}
                    >
                      {/* Avatar */}
                      <span
                        className="flex h-12 w-12 flex-none items-center justify-center rounded-full text-[17px] font-extrabold transition-all duration-200"
                        style={{
                          background: isSelected
                            ? 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)'
                            : 'linear-gradient(180deg, #fff8e1 0%, #ffe9a3 100%)',
                          color: isSelected ? '#fffaf0' : '#a85e02',
                          boxShadow: isSelected
                            ? '0 6px 14px -6px rgba(168, 94, 2, 0.6)'
                            : 'inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 10px -4px rgba(168, 94, 2, 0.3)',
                        }}
                      >
                        {initial}
                      </span>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="m-0 text-[15.5px] font-extrabold leading-tight text-[#1c1917]">
                          {name}
                        </p>
                        <p className="m-0 mt-1.5 text-[13.5px] leading-snug text-[#4a4540]">
                          {outfit}
                        </p>
                      </div>

                      {/* Checkmark badge */}
                      {isSelected && (
                        <span className="circuit-selections-check absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-b from-[#f59e0b] to-[#d97706] text-[13px] font-extrabold text-white shadow-[0_4px_10px_-2px_rgba(168,94,2,0.7)]">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Submit */}
              <button
                onClick={submitSelections}
                disabled={selected.length === 0}
                className="group mt-8 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-[17px] text-[16.5px] font-extrabold tracking-[0.005em] transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ffd24a]/60 disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none"
                style={{
                  background:
                    selected.length === 0
                      ? '#e0dbd0'
                      : 'linear-gradient(180deg, #1c1917 0%, #0d0a09 100%)',
                  color: selected.length === 0 ? '#7a736b' : '#fffaf0',
                  boxShadow:
                    selected.length === 0
                      ? 'none'
                      : 'inset 0 1px 0 rgba(255,255,255,0.08), 0 10px 26px -8px rgba(0,0,0,0.5), 0 22px 44px -16px rgba(0,0,0,0.4)',
                }}
              >
                <span>
                  {selected.length === 0
                    ? 'Select someone first'
                    : `Submit ${selected.length} ${selected.length === 1 ? 'selection' : 'selections'}`}
                </span>
                {selected.length > 0 && (
                  <span className="text-[18px] transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                )}
              </button>

              {/* Footer note */}
              <p className="mt-6 text-center text-[12.5px] leading-relaxed text-[#7a736b]">
                Matches are revealed the next day. Only mutual sparks get shared.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EventSelections;