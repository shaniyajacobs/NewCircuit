import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, onSnapshot, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { format } from 'date-fns';

/* ============================================================
   PRESENTATION ONLY — design tokens & shared style block.
   These do not affect logic, state, or side effects.
   ============================================================ */

const canvasStyle = {
  background:
    'radial-gradient(900px 600px at 15% 0%, #FFF6C9 0%, transparent 60%), ' +
    'radial-gradient(720px 520px at 100% 100%, #FFF3B8 0%, transparent 55%), ' +
    '#FFFBE6',
  fontFamily:
    "'Poppins','Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
};

const CX = {
  canvas: 'min-h-screen flex items-center justify-center p-4 sm:p-6',
  card:
    'cpsd-card relative w-full max-w-2xl overflow-hidden rounded-[28px] ' +
    'bg-white border border-[#EAE4D2] ' +
    'shadow-[0_1px_2px_rgba(33,31,32,0.04),0_12px_32px_-12px_rgba(33,31,32,0.16),0_40px_80px_-40px_rgba(33,31,32,0.14)]',
  cardTight:
    'cpsd-card relative w-full max-w-md overflow-hidden rounded-[28px] ' +
    'bg-white border border-[#EAE4D2] ' +
    'shadow-[0_1px_2px_rgba(33,31,32,0.04),0_12px_32px_-12px_rgba(33,31,32,0.16)]',
  accentBar:
    'pointer-events-none absolute inset-x-0 top-0 h-1 ' +
    'bg-gradient-to-r from-[#FFC107] via-[#E2FF65] to-[#B8D936]',
  eyebrow:
    'text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A8377]',
  timer:
    'cpsd-timer block text-center font-extrabold tabular-nums leading-[0.9] ' +
    'tracking-[-0.045em] text-[#211F20] ' +
    'text-[64px] sm:text-[88px] md:text-[104px]',
  timerMd:
    'cpsd-timer block text-center font-extrabold tabular-nums leading-[0.9] ' +
    'tracking-[-0.04em] text-[#211F20] ' +
    'text-[56px] sm:text-[72px] md:text-[80px]',
  divider: 'h-px w-full bg-[#EAE4D2]',
  chip:
    'inline-flex items-center gap-1.5 rounded-full border border-[#EAE4D2] ' +
    'bg-[#FBF8EE] px-3 py-1.5 text-[12.5px] font-medium text-[#55514C]',
  btnCharcoal:
    'inline-flex w-full items-center justify-center gap-2 rounded-2xl ' +
    'bg-[#211F20] px-6 py-4 text-[16px] font-bold text-white ' +
    'shadow-[0_10px_24px_-10px_rgba(33,31,32,0.5)] ' +
    'transition-all duration-150 ' +
    'hover:bg-black hover:-translate-y-px active:translate-y-0 ' +
    'focus:outline-none focus-visible:ring-4 focus-visible:ring-[#E2FF65]/60',
  btnLime:
    'inline-flex w-full items-center justify-center gap-2 rounded-2xl ' +
    'bg-gradient-to-b from-[#D9F55C] to-[#B8D936] px-6 py-4 ' +
    'text-[16px] font-extrabold text-[#2A3606] ' +
    'shadow-[0_4px_0_#9DB92A] ' +
    'transition-all duration-150 ' +
    'hover:-translate-y-px hover:shadow-[0_5px_0_#9DB92A,0_14px_28px_-8px_rgba(184,217,54,0.55)] ' +
    'active:translate-y-0.5 active:shadow-[0_2px_0_#9DB92A] ' +
    'focus:outline-none focus-visible:ring-4 focus-visible:ring-[#E2FF65]/60',
  textarea:
    'w-full resize-none rounded-2xl border-[1.5px] border-[#D9D1B7] bg-[#FBF8EE] ' +
    'px-4 py-3.5 text-[15px] leading-relaxed text-[#211F20] ' +
    'placeholder:text-[#8A8377] ' +
    'focus:outline-none focus:border-[#B8D936] focus:bg-white focus:ring-4 focus:ring-[#E2FF65]/55 ' +
    'transition-all',
};

const StyleTag = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&display=swap');
    .cpsd-timer { font-family: 'Bricolage Grotesque','Poppins',system-ui,sans-serif; }
    @keyframes cpsdCardIn {
      from { opacity: 0; transform: translateY(14px) }
      to   { opacity: 1; transform: translateY(0) }
    }
    .cpsd-card { animation: cpsdCardIn .55s cubic-bezier(.22,1,.36,1) both; }
    @media (prefers-reduced-motion: reduce) {
      .cpsd-card { animation: none !important; }
      * { transition: none !important; }
    }
  `}</style>
);

/* ============================================================
   Component — all original logic is preserved below.
   ============================================================ */

const EventNight = () => {
  const { eventId, phone } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [event, setEvent] = useState(null);
  const [attendee, setAttendee] = useState(null);
  const [attendeeDocId, setAttendeeDocId] = useState(null);
  const [allAttendees, setAllAttendees] = useState({});
  const [roundAssignments, setRoundAssignments] = useState({});
  const [roundStartTimes, setRoundStartTimes] = useState([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(-1);
  const [partner, setPartner] = useState(null);
  const [partnerStatus, setPartnerStatus] = useState('noShow');
  const [partnerEta, setPartnerEta] = useState(null);
  const [icebreakers, setIcebreakers] = useState([]);
  const [phase, setPhase] = useState('preRound'); // 'preRound' | 'round' | 'break' | 'noShow' | 'postEvent' | 'imLate'
  const [timeLeft, setTimeLeft] = useState(0);
  const intervalRef = useRef();

  const getTimestampMillis = (ts) => {
    if (typeof ts === 'number') return ts;
    if (ts && typeof ts.toMillis === 'function') return ts.toMillis();
    return 0;
  };

  // SMS sender (will be updated in Step 4)
  const sendSMS = useCallback(async (type, data) => {
    try {
      const functions = getFunctions();
      const func = httpsCallable(functions, 'sendEventSMS');
      await func({ type, ...data, attendeeId: phone, eventId });
    } catch (err) {
      console.error('SMS send error:', err);
    }
  }, [phone, eventId]);

  useEffect(() => {
    if (!eventId || !phone) {
      setError('Missing event or phone.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);
        if (!eventSnap.exists()) throw new Error('Event not found');
        const eventData = eventSnap.data();
        setEvent(eventData);
        setRoundStartTimes(eventData.roundStartTimes || []);
        setIcebreakers(eventData.icebreakers || []);

        const attendeesRef = collection(db, 'events', eventId, 'signedUpUsers');
        const q = query(attendeesRef, where('phoneNumber', '==', phone));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          setError('Attendee not found.');
          setLoading(false);
          return;
        }
        const docSnap = querySnapshot.docs[0];
        setAttendeeDocId(docSnap.id);
        const attendeeData = docSnap.data();
        setAttendee(attendeeData);
        setRoundAssignments(attendeeData.roundAssignments || {});

        const unsubscribe = onSnapshot(
          collection(db, 'events', eventId, 'signedUpUsers'),
          (snapshot) => {
            const map = {};
            snapshot.forEach((doc) => {
              map[doc.id] = doc.data();
            });
            setAllAttendees(map);
          }
        );
        window.__unsubscribeEventNight = unsubscribe;
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();

    return () => {
      if (window.__unsubscribeEventNight) window.__unsubscribeEventNight();
      clearInterval(intervalRef.current);
    };
  }, [eventId, phone]);

  // ✅ Step 3 – Update state to handle noShow phase
  const updateState = useCallback(() => {
    if (!event || !attendee || Object.keys(allAttendees).length === 0) return;
    const now = Date.now();
    const starts = roundStartTimes;
    if (!starts || starts.length === 0) return;

    // 🔥 NEW: If the current user checked in as "late" and hasn't arrived yet,
    // show a dedicated "You're Running Late" screen.
    const myStatus = attendee.checkInStatus;
    const myArrived = attendee.arrivedAtEvent === true;

    if (myStatus === 'late' && !myArrived) {
      setPhase('imLate');
      const nextRoundStart = starts.find(s => getTimestampMillis(s) > now);
      if (nextRoundStart) {
        setTimeLeft(Math.floor((getTimestampMillis(nextRoundStart) - now) / 1000));
      }
      return;
    }

    let idx = -1;
    for (let i = 0; i < starts.length; i++) {
      const start = getTimestampMillis(starts[i]);
      const end = start + event.roundDurationSeconds * 1000;
      if (now >= start && now < end) {
        idx = i;
        break;
      }
    }

    // Pre‑round
    if (idx === -1) {
      const firstStart = getTimestampMillis(starts[0]);
      if (now < firstStart) {
        setPhase('preRound');
        setTimeLeft(Math.floor((firstStart - now) / 1000));
        setCurrentRoundIndex(-1);
        setPartner(null);
        return;
      }
      // Post‑event
      const lastEnd = getTimestampMillis(starts[starts.length - 1]) + event.roundDurationSeconds * 1000;
      if (now >= lastEnd) {
        setPhase('postEvent');
        sendSMS('eventEnd', {});
        navigate(`/event/${eventId}/selections/${phone}`);
        return;
      }
      // Break (between rounds)
      let nextRoundIdx = -1;
      for (let i = 0; i < starts.length - 1; i++) {
        const roundEnd = getTimestampMillis(starts[i]) + event.roundDurationSeconds * 1000;
        const nextStart = getTimestampMillis(starts[i+1]);
        if (now >= roundEnd && now < nextStart) {
          nextRoundIdx = i+1;
          break;
        }
      }
      if (nextRoundIdx !== -1) {
        setPhase('break');
        setCurrentRoundIndex(nextRoundIdx);
        const nextStart = getTimestampMillis(starts[nextRoundIdx]);
        setTimeLeft(Math.floor((nextStart - now) / 1000));
        const roundKey = `round${nextRoundIdx+1}`;
        const nextPartnerId = roundAssignments[roundKey];
        const nextPartner = nextPartnerId ? allAttendees[nextPartnerId] : null;
        setPartner(nextPartner);
        if (nextPartner) {
          sendSMS('nextRound', {
            roundNum: nextRoundIdx + 1,
            partnerName: nextPartner.firstName,
            partnerOutfit: nextPartner.outfitDescription || '',
          });
        }
        return;
      }
      // Fallback to post‑event
      setPhase('postEvent');
      sendSMS('eventEnd', {});
      navigate(`/event/${eventId}/selections/${phone}`);
      return;
    }

    // In a round
    const roundNum = idx + 1;
    const roundKey = `round${roundNum}`;
    const partnerId = roundAssignments[roundKey];
    const partnerData = partnerId ? allAttendees[partnerId] : null;
    setPartner(partnerData);
    setCurrentRoundIndex(idx);
    if (partnerData) {
      let status = partnerData.checkInStatus || 'noShow';

      if (status === 'late' && idx > 0) {
        status = 'onTime';
      }

      setPartnerStatus(status);
      setPartnerEta(status === 'late' ? partnerData.eta : null);
      // If partner is no‑show, treat as noShow phase
      if (status === 'noShow') {
        setPhase('noShow');
        const nextStart = getTimestampMillis(starts[idx + 1]);
        if (nextStart) {
          const diff = Math.floor((nextStart - now) / 1000);
          setTimeLeft(Math.max(0, diff));
        } else {
          setPhase('postEvent');
          sendSMS('eventEnd', {});
          navigate(`/event/${eventId}/selections/${phone}`);
        }
        sendSMS('noShow', {
          roundNum,
          partnerName: partnerData.firstName,
        });
        return;
      }

      // Normal round (onTime or late)
      setPhase('round');
      const roundEnd = getTimestampMillis(starts[idx]) + event.roundDurationSeconds * 1000;
      const remaining = Math.floor((roundEnd - now) / 1000);
      setTimeLeft(Math.max(0, remaining));

      if (status === 'onTime') {
        sendSMS('roundStart', {
          roundNum,
          partnerName: partnerData.firstName,
          partnerOutfit: partnerData.outfitDescription || '',
          icebreaker: icebreakers[idx] || '',
        });
      } else if (status === 'late') {
        sendSMS('late', {
          roundNum,
          partnerName: partnerData.firstName,
          partnerOutfit: partnerData.outfitDescription || '',
          eta: partnerData.eta || null,
        });
      }

      if (remaining <= 5 && remaining > 0) {
        sendSMS('roundEnd', { roundNum });
      }
    } else {
      setPhase('noShow');
      setPartnerStatus('noShow');
      setPartnerEta(null);
      const nextStart = getTimestampMillis(starts[idx + 1]);
      if (nextStart) {
        setTimeLeft(Math.floor((nextStart - now) / 1000));
      } else {
        setPhase('postEvent');
        navigate(`/event/${eventId}/selections/${phone}`);
      }
    }
  }, [
    event,
    attendee,
    allAttendees,
    roundAssignments,
    roundStartTimes,
    icebreakers,
    eventId,
    phone,
    navigate,
    sendSMS,
  ]);

  useEffect(() => {
    updateState();
    intervalRef.current = setInterval(updateState, 1000);
    return () => clearInterval(intervalRef.current);
  }, [updateState]);

  const saveNote = async (roundNum, note) => {
    if (!attendeeDocId || !eventId) return;
    try {
      const attendeeRef = doc(db, 'events', eventId, 'signedUpUsers', attendeeDocId);
      const currentNotes = attendee.notes || {};
      currentNotes[`round${roundNum}`] = note;
      await updateDoc(attendeeRef, { notes: currentNotes });
      setAttendee({ ...attendee, notes: currentNotes });
    } catch (err) {
      console.error('Error saving note:', err);
    }
  };

  //  Mark the current user as arrived (removes the "imLate" screen)
  const markAsArrived = async () => {
    if (!attendeeDocId || !eventId) return;
    try {
      const attendeeRef = doc(db, 'events', eventId, 'signedUpUsers', attendeeDocId);
      await updateDoc(attendeeRef, {
        checkInStatus: 'onTime',
        arrivedAtEvent: true,
        arrivedAt: new Date(),
      });
      setAttendee({ ...attendee, checkInStatus: 'onTime', arrivedAtEvent: true });
      console.log('✅ Marked as arrived');
    } catch (err) {
      console.error('Failed to mark as arrived:', err);
    }
  };

  /* ============================================================
     RENDER — styling only. All branches, conditions, values and
     handlers are identical to the original.
     ============================================================ */
  const renderContent = () => {
    // "You're Running Late" screen
    if (phase === 'imLate') {
      return (
        <div className={CX.card + ' p-7 sm:p-9 text-center'}>
          <div className={CX.accentBar} />
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF7E0] text-3xl shadow-[0_6px_16px_-6px_rgba(255,193,7,0.5)]">
            ⏰
          </div>
          <p className={CX.eyebrow + ' mb-1'}>You&rsquo;re running late</p>
          <h3 className="text-[24px] sm:text-[28px] font-extrabold tracking-[-0.02em] text-[#211F20]">
            Your first date is waiting
          </h3>
          <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-[#55514C]">
            Tap the button below the moment you arrive at the venue — we&rsquo;ll
            slot you straight into the next round.
          </p>

          <div className="my-7">
            <p className={CX.eyebrow + ' mb-2'}>Next round begins in</p>
            <div className={CX.timer + ' text-[#B8730A]'}>
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </div>
          </div>

          <button onClick={markAsArrived} className={CX.btnLime + ' text-[17px]'}>
            ✅ I&rsquo;m Here Now
          </button>
        </div>
      );
    }

    if (phase === 'preRound') {
      return (
        <div className={CX.card + ' p-7 sm:p-9'}>
          <div className={CX.accentBar} />
          <div className="text-center">
            <p className={CX.eyebrow + ' mb-2'}>Doors are open</p>
            <h2 className="text-[26px] sm:text-[30px] font-extrabold tracking-[-0.02em] text-[#211F20]">
              {event?.city} Speed Dating
            </h2>
            <p className="mx-auto mt-2 max-w-md text-[14px] text-[#8A8377]">
              Settle in, grab a drink, and get ready — your first round is about to start.
            </p>

            <div className="mt-7">
              <p className={CX.eyebrow + ' mb-2'}>Round 1 begins in</p>
              <div className={CX.timer}>
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-[#EAE4D2] bg-[#FBF8EE] p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-extrabold tracking-[-0.01em] text-[#211F20]">
                Your night at a glance
              </h3>
              <span className={CX.chip}>
                {Object.keys(roundAssignments).length} rounds
              </span>
            </div>

            <ul className="flex flex-col gap-2">
              {Object.keys(roundAssignments)
                .sort((a, b) => parseInt(a.replace('round', '')) - parseInt(b.replace('round', '')))
                .map((key) => {
                  const num = parseInt(key.replace('round', ''));
                  const pid = roundAssignments[key];
                  const p = pid ? allAttendees[pid] : null;
                  return (
                    <li
                      key={key}
                      className="flex items-center gap-3 rounded-2xl border border-[#EAE4D2] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(33,31,32,0.04)]"
                    >
                      <span className="inline-flex h-9 min-w-[3.25rem] items-center justify-center rounded-xl bg-[#211F20] px-3 text-[12.5px] font-bold text-[#E2FF65]">
                        R{num}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14.5px] font-semibold text-[#211F20]">
                          {p ? `${p.firstName} ${p.lastName?.charAt(0)}.` : 'TBD'}
                        </p>
                        <p className="truncate text-[12.5px] text-[#8A8377]">
                          {p?.outfitDescription || 'Outfit to be confirmed'}
                        </p>
                      </div>
                    </li>
                  );
                })}
            </ul>
          </div>
        </div>
      );
    }

    if (phase === 'break') {
      const nextRoundNum = currentRoundIndex + 1;
      const nextPartner = partner;
      return (
        <div className={CX.card + ' p-7 sm:p-9'}>
          <div className={CX.accentBar} />
          <div className="text-center">
            <span className={CX.chip + ' mx-auto'}>☕ Break time</span>
            <h3 className="mt-4 text-[22px] sm:text-[26px] font-extrabold tracking-[-0.02em] text-[#211F20]">
              Great round! look for your next partner.
            </h3>
            <p className="mx-auto mt-2 max-w-md text-[14.5px] leading-relaxed text-[#55514C]">
              Head to your Round {nextRoundNum} seat when the timer hits zero.
            </p>

            <div className="my-7">
              <p className={CX.eyebrow + ' mb-2'}>Round {nextRoundNum} starts in</p>
              <div className={CX.timer}>
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </div>
            </div>
          </div>

          {nextPartner && (
            <div className="rounded-3xl border border-[#EAE4D2] bg-[#FBF8EE] p-5 sm:p-6">
              <p className={CX.eyebrow + ' mb-3'}>Up next · Round {nextRoundNum}</p>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-[#E2FF65] text-[18px] font-extrabold text-[#2A3606] shadow-[0_6px_16px_-6px_rgba(184,217,54,0.6)]">
                  {(nextPartner.firstName || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-bold text-[#211F20]">
                    {nextPartner.firstName} {nextPartner.lastName?.charAt(0)}.
                  </p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-[#55514C]">
                    {nextPartner.outfitDescription || 'No outfit description'}
                  </p>
                  <p className="mt-2 text-[12.5px] font-medium text-[#8A8377]">
                    Starts at{' '}
                    {format(
                      new Date(getTimestampMillis(roundStartTimes[currentRoundIndex])),
                      'h:mm a'
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (phase === 'round') {
      const roundNum = currentRoundIndex + 1;
      const partnerData = partner;
      if (!partnerData) {
        return (
          <div className={CX.cardTight + ' p-7 text-center'}>
            <div className={CX.accentBar} />
            <div className="mx-auto mb-4 h-10 w-10 rounded-full border-[3px] border-[#EAE4D2] border-t-[#B8D936] animate-spin" />
            <p className={CX.eyebrow}>Finding your partner…</p>
          </div>
        );
      }
      const status = partnerStatus;

      if (status === 'onTime') {
        const icebreaker = icebreakers[currentRoundIndex] || 'What would you like to talk about?';
        return (
          <div className={CX.card + ' p-7 sm:p-9'}>
            <div className={CX.accentBar} />

            <div className="text-center">
              <span className={CX.chip + ' mx-auto'}>
                Round {roundNum} of {roundStartTimes.length}
              </span>
              <p className={CX.eyebrow + ' mt-4 mb-2'}>Time remaining</p>
              <div className={CX.timer}>
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </div>
            </div>

            <div className={CX.divider + ' my-7'} />

            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-[#211F20] text-[20px] font-extrabold text-[#E2FF65] shadow-[0_8px_20px_-8px_rgba(33,31,32,0.6)]">
                {(partnerData.firstName || partnerData.userName || partnerData.displayName || '?')
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className={CX.eyebrow + ' mb-1'}>Your date</p>
                <p className="text-[19px] sm:text-[21px] font-extrabold leading-tight tracking-[-0.01em] text-[#211F20]">
                  {partnerData.firstName || partnerData.userName || partnerData.displayName || 'Unknown'}{' '}
                  {partnerData.lastName?.charAt(0) || ''}.
                </p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-[#55514C]">
                  <span className="font-semibold text-[#211F20]">Wearing: </span>
                  {partnerData.outfitDescription || 'No outfit description'}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-[#EAE4D2] bg-gradient-to-b from-[#F8FFDF] to-[#F1FBD3] p-5">
              <p className={CX.eyebrow + ' mb-2 text-[#4A5D0E]'}>Icebreaker</p>
              <p className="text-[15px] font-semibold leading-snug text-[#2A3606]">
                {icebreaker}
              </p>
            </div>

            <div className="mt-6">
              <p className={CX.eyebrow + ' mb-2'}>Your notes</p>
              <textarea
                placeholder="Add a note about this date…"
                className={CX.textarea}
                rows="3"
                value={attendee?.notes?.[`round${roundNum}`] || ''}
                onChange={(e) => saveNote(roundNum, e.target.value)}
              />
            </div>
          </div>
        );
      } else if (status === 'late') {
        return (
          <div className={CX.card + ' p-7 sm:p-9'}>
            <div className={CX.accentBar} />
            <div className="text-center">
              <span className={CX.chip + ' mx-auto'}>
                Round {roundNum} of {roundStartTimes.length}
              </span>
              <div className="mt-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF7E0] text-3xl">
                🚶
              </div>
              <h3 className="mt-3 text-[22px] sm:text-[26px] font-extrabold tracking-[-0.02em] text-[#B8730A]">
                Late arrival
              </h3>
              <p className="mx-auto mt-2 max-w-md text-[14.5px] leading-relaxed text-[#55514C]">
                <span className="font-semibold text-[#211F20]">{partnerData.firstName}</span> is on
                their way — ETA {partnerEta ? format(partnerEta.toDate(), 'h:mm a') : 'soon'}.
                Sit tight, your date will be here shortly.
              </p>
              <div className="my-6">
                <p className={CX.eyebrow + ' mb-2'}>Time remaining</p>
                <div className={CX.timerMd}>
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </div>
              </div>
            </div>

            <div className={CX.divider + ' my-6'} />

            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-[#FFF7E0] text-[20px] font-extrabold text-[#B8730A]">
                {(partnerData.firstName || partnerData.userName || partnerData.displayName || '?')
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className={CX.eyebrow + ' mb-1'}>Your date</p>
                <p className="text-[18px] font-extrabold leading-tight text-[#211F20]">
                  {partnerData.firstName || partnerData.userName || partnerData.displayName || 'Unknown'}{' '}
                  {partnerData.lastName?.charAt(0) || ''}.
                </p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-[#55514C]">
                  <span className="font-semibold text-[#211F20]">Wearing: </span>
                  {partnerData.outfitDescription || 'No outfit description'}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className={CX.eyebrow + ' mb-2'}>Your notes</p>
              <textarea
                placeholder="Add a note about this date…"
                className={CX.textarea}
                rows="3"
                value={attendee?.notes?.[`round${roundNum}`] || ''}
                onChange={(e) => saveNote(roundNum, e.target.value)}
              />
            </div>
          </div>
        );
      } else {
        return (
          <div className={CX.cardTight + ' p-7 text-center'}>
            <div className={CX.accentBar} />
            <p className={CX.eyebrow}>Unexpected status</p>
          </div>
        );
      }
    }

    // ✅ Step 3 – No‑Show screen with countdown
    if (phase === 'noShow') {
      const roundNum = currentRoundIndex + 1;
      const nextRoundNum = roundNum + 1;
      const nextPartnerId = roundAssignments[`round${nextRoundNum}`];
      const nextPartner = nextPartnerId ? allAttendees[nextPartnerId] : null;
      const nextStart = roundStartTimes[currentRoundIndex + 1] || null;

      return (
        <div className={CX.card + ' p-7 sm:p-9'}>
          <div className={CX.accentBar} />
          <div className="text-center">
            <span className={CX.chip + ' mx-auto'}>Round {roundNum}</span>
            <div className="mt-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#FDECEF] text-3xl">
              💔
            </div>
            <h3 className="mt-3 text-[22px] sm:text-[26px] font-extrabold tracking-[-0.02em] text-[#C7385A]">
              No-show this round
            </h3>
            <p className="mx-auto mt-2 max-w-md text-[14.5px] leading-relaxed text-[#55514C]">
              Your date for this round hasn&rsquo;t confirmed attendance. We&rsquo;re
              sorry about that.
            </p>

            <div className="my-7">
              <p className={CX.eyebrow + ' mb-2'}>Next round starts in</p>
              <div className={CX.timerMd}>
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </div>
            </div>
          </div>

          {nextPartner && (
            <div className="rounded-3xl border border-[#EAE4D2] bg-[#FBF8EE] p-5 sm:p-6">
              <p className={CX.eyebrow + ' mb-3'}>Up next · Round {nextRoundNum}</p>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-[#E2FF65] text-[18px] font-extrabold text-[#2A3606]">
                  {(nextPartner.firstName || nextPartner.userName || nextPartner.displayName || '?')
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-bold text-[#211F20]">
                    {nextPartner.firstName || nextPartner.userName || nextPartner.displayName || 'Unknown'}{' '}
                    {nextPartner.lastName?.charAt(0) || ''}.
                  </p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-[#55514C]">
                    {nextPartner.outfitDescription || 'No outfit description'}
                  </p>
                  <p className="mt-2 text-[12.5px] font-medium text-[#8A8377]">
                    Starts at{' '}
                    {nextStart ? format(new Date(getTimestampMillis(nextStart)), 'h:mm a') : 'soon'}
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* No notes field – hidden as per spec */}
        </div>
      );
    }

    if (phase === 'postEvent') {
      return (
        <div className={CX.cardTight + ' p-7 text-center'}>
          <div className={CX.accentBar} />
          <p className={CX.eyebrow}>Event ended</p>
          <p className="mt-2 text-[15px] text-[#55514C]">
            Redirecting you to selections…
          </p>
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <>
        <StyleTag />
        <div className={CX.canvas} style={canvasStyle}>
          <div className={CX.cardTight + ' p-8 text-center'}>
            <div className={CX.accentBar} />
            <div className="mx-auto mb-4 h-10 w-10 rounded-full border-[3px] border-[#EAE4D2] border-t-[#B8D936] animate-spin" />
            <p className={CX.eyebrow}>Loading your night…</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <StyleTag />
        <div className={CX.canvas} style={canvasStyle}>
          <div className={CX.cardTight + ' p-8 text-center'}>
            <div className={CX.accentBar} />
            <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#FDECEF] text-2xl">
              ⚠️
            </div>
            <p className="text-[15px] font-semibold text-[#C7385A]">{error}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className={CX.canvas} style={canvasStyle}>
      <StyleTag />
      {renderContent()}
    </div>
  );
};

export default EventNight;