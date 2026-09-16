import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

/* ============================================================
   PRESENTATION ONLY — shared style tag, no logic touched.
   ============================================================ */
const StyleTag = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&display=swap');
    .circuit-outfit-card { font-family: 'Bricolage Grotesque','Calibri','Candara',system-ui,sans-serif; }
    @keyframes circuitOutfitIn {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes circuitSpin {
      to { transform: rotate(360deg); }
    }
    .circuit-outfit-in { animation: circuitOutfitIn .6s cubic-bezier(.22,1,.36,1) both; }
    @media (prefers-reduced-motion: reduce) {
      .circuit-outfit-in { animation: none !important; }
      * { transition: none !important; animation: none !important; }
    }
  `}</style>
);

const OutfitDescription = () => {
  const { eventId, phone: paramPhone } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [outfit, setOutfit] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [attendeeId, setAttendeeId] = useState(null);

  // Get phone from URL param OR query param
  const queryParams = new URLSearchParams(location.search);
  const queryPhone = queryParams.get('phone');
  const phoneNumber = paramPhone || queryPhone;

  useEffect(() => {
    if (!phoneNumber || !eventId) {
      setError('Missing attendee or event information.');
      setLoading(false);
      return;
    }

    const findAttendee = async () => {
      try {
        const attendeesRef = collection(db, 'events', eventId, 'signedUpUsers');
        const q = query(attendeesRef, where('phoneNumber', '==', phoneNumber));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError('Attendee not found. Please make sure you registered for this event.');
          setLoading(false);
          return;
        }

        const docSnap = querySnapshot.docs[0];
        const docId = docSnap.id;
        const data = docSnap.data();
        setAttendeeId(docId);
        setOutfit(data.outfitDescription || '');
        setLoading(false);
      } catch (err) {
        setError('Error loading data.');
        console.error(err);
        setLoading(false);
      }
    };

    findAttendee();
  }, [eventId, phoneNumber]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (outfit.length > 100) {
      setError('Maximum 100 characters.');
      return;
    }
    if (!attendeeId) {
      setError('Attendee not found. Please refresh and try again.');
      return;
    }
    setSaving(true);
    try {
      const attendeeRef = doc(db, 'events', eventId, 'signedUpUsers', attendeeId);
      await updateDoc(attendeeRef, { outfitDescription: outfit });
      navigate(`/checkin/${eventId}/${phoneNumber}`);
    } catch (err) {
      setError('Failed to save. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Loading state ---------- */
  if (loading) {
    return (
      <>
        <StyleTag />
        <div
          className="min-h-screen flex items-center justify-center p-4"
          style={{
            background:
              'radial-gradient(900px 620px at 12% 6%, #fff5d6 0%, transparent 60%), radial-gradient(800px 620px at 92% 94%, #f0e2bd 0%, transparent 58%), linear-gradient(160deg, #fdfaf3 0%, #f4ecd9 100%)',
          }}
        >
          <div className="circuit-outfit-card circuit-outfit-in relative w-full max-w-md overflow-hidden rounded-[26px] border border-[#eae4d2] bg-white p-10 text-center shadow-[0_1px_2px_rgba(28,25,23,0.04),0_24px_48px_-20px_rgba(28,25,23,0.18)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f59e0b] via-[#ffd24a] to-[#d9f55c]" />
            <div
              className="mx-auto mb-5 h-11 w-11 rounded-full border-[3px] border-[#eae4d2]"
              style={{
                borderTopColor: '#d97706',
                animation: 'circuitSpin .9s linear infinite',
              }}
            />
            <p className="m-0 text-[11px] font-bold uppercase tracking-[0.28em] text-[#a85e02]">
              Preparing your outfit journal
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
          className="min-h-screen flex items-center justify-center p-4"
          style={{
            background:
              'radial-gradient(900px 620px at 12% 6%, #fff5d6 0%, transparent 60%), radial-gradient(800px 620px at 92% 94%, #f0e2bd 0%, transparent 58%), linear-gradient(160deg, #fdfaf3 0%, #f4ecd9 100%)',
          }}
        >
          <div className="circuit-outfit-card circuit-outfit-in relative w-full max-w-md overflow-hidden rounded-[26px] border border-[#eae4d2] bg-white p-9 text-center shadow-[0_1px_2px_rgba(28,25,23,0.04),0_24px_48px_-20px_rgba(28,25,23,0.18)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f59e0b] via-[#ffd24a] to-[#d9f55c]" />
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#fdecef] text-[26px]">
              ⚠️
            </div>
            <p className="m-0 text-[15px] font-semibold leading-relaxed text-[#c7385a]">
              {error}
            </p>
          </div>
        </div>
      </>
    );
  }

  const remaining = 100 - outfit.length;
  const progress = Math.min(100, (outfit.length / 100) * 100);
  const nearLimit = outfit.length >= 85;
  const atLimit = outfit.length >= 100;

  /* ---------- Main render ---------- */
  return (
    <>
      <StyleTag />
      <div
        className="min-h-screen flex items-center justify-center p-4 sm:p-6"
        style={{
          background:
            'radial-gradient(900px 620px at 12% 6%, #fff5d6 0%, transparent 60%), radial-gradient(800px 620px at 92% 94%, #f0e2bd 0%, transparent 58%), linear-gradient(160deg, #fdfaf3 0%, #f4ecd9 100%)',
        }}
      >
        <div className="circuit-outfit-card circuit-outfit-in relative w-full max-w-lg overflow-hidden rounded-[28px] border border-[#eae4d2] bg-white p-7 sm:p-10 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_24px_48px_-20px_rgba(28,25,23,0.18),0_60px_100px_-50px_rgba(28,25,23,0.14)]">

          {/* Amber → lime accent bar */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f59e0b] via-[#ffd24a] to-[#d9f55c]" />

          {/* Eyebrow */}
          <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.28em] text-[#a85e02]">
            Pre-event check-in
          </p>

          {/* Title */}
          <h2 className="m-0 text-[28px] sm:text-[34px] font-extrabold leading-[1.1] tracking-[-0.03em] text-[#1c1917]">
            What are you wearing <span className="italic text-[#a85e02]">tonight?</span>
          </h2>

          {/* Amber underline rule */}
          <div className="mt-5 mb-6 h-[3px] w-12 rounded-full bg-gradient-to-r from-[#f59e0b] to-[#ffd24a]" />

          {/* Subtitle */}
          <p className="mb-7 text-[15px] leading-relaxed text-[#4a4540]">
            Describe your outfit so your dates can spot you the moment you walk in.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Textarea label */}
            <label className="mb-2 block text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#4a4540]">
              Your outfit
            </label>

            {/* Textarea — warm journal feel */}
            <textarea
              value={outfit}
              onChange={(e) => setOutfit(e.target.value)}
              maxLength={100}
              rows={3}
              className="w-full resize-none rounded-2xl border-[1.5px] border-[#e0dbd0] bg-[#fffdf7] px-4 py-3.5 text-[15.5px] leading-relaxed text-[#1c1917] placeholder:text-[#a8a29e] transition-all duration-200 focus:border-[#d97706] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#ffd24a]/40"
              placeholder="e.g., Red floral dress, hair up"
            />

            {/* Character meter */}
            <div className="mt-3 mb-6 flex items-center gap-3">
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[#f0e9d4]">
                <div
                  className="h-full rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${progress}%`,
                    background: atLimit
                      ? 'linear-gradient(90deg, #c7385a 0%, #e11d48 100%)'
                      : nearLimit
                      ? 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)'
                      : 'linear-gradient(90deg, #f59e0b 0%, #ffd24a 100%)',
                    boxShadow: atLimit
                      ? '0 0 12px rgba(199, 56, 90, 0.5)'
                      : '0 0 12px rgba(255, 210, 74, 0.55)',
                  }}
                />
              </div>
              <span
                className="min-w-[3.5rem] text-right text-[12.5px] font-bold tabular-nums transition-colors duration-200"
                style={{
                  color: atLimit ? '#c7385a' : nearLimit ? '#a85e02' : '#7a736b',
                }}
              >
                {outfit.length}/100
              </span>
            </div>

            {/* Error (inline, after submit) */}
            {error && (
              <div className="mb-4 rounded-xl border border-[#f5c2cd] bg-[#fdecef] px-4 py-3 text-center text-[13.5px] font-medium text-[#c7385a]">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#1c1917] to-[#0d0a09] px-6 py-[17px] text-[16.5px] font-extrabold tracking-[0.005em] text-[#fffaf0] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_26px_-8px_rgba(0,0,0,0.5),0_22px_44px_-16px_rgba(0,0,0,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:from-[#2b2724] hover:to-[#1a1614] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_14px_32px_-8px_rgba(0,0,0,0.55),0_34px_66px_-20px_rgba(255,180,60,0.4)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ffd24a]/60"
            >
              <span>{saving ? 'Saving…' : 'Save Outfit'}</span>
              <span className="text-[18px] transition-transform duration-200 group-hover:translate-x-1">
                →
              </span>
            </button>
          </form>

          {/* Footer note */}
          <p className="mt-6 text-center text-[12.5px] leading-relaxed text-[#7a736b]">
            Your description appears live on your matches' screens throughout the night.
          </p>
        </div>
      </div>
    </>
  );
};

export default OutfitDescription;