import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  collection,
  doc,
  addDoc,
  query,
  where,
  onSnapshot,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';

/* ============================================================
   PRESENTATION ONLY — shared style tag, no logic touched.
   ============================================================ */
const StyleTag = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&display=swap');
    .circuit-chat { font-family: 'Poppins','Calibri','Candara',system-ui,sans-serif; }
    .circuit-chat .display { font-family: 'Bricolage Grotesque','Calibri',sans-serif; }
    @keyframes chatIn { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform: translateY(0); } }
    @keyframes chatSpin { to { transform: rotate(360deg); } }
    @keyframes bubbleIn { from { opacity:0; transform: translateY(6px); } to { opacity:1; transform: translateY(0); } }
    .circuit-chat-in { animation: chatIn .6s cubic-bezier(.22,1,.36,1) both; }
    .circuit-chat-bubble { animation: bubbleIn .28s cubic-bezier(.22,1,.36,1) both; }
    .circuit-chat-scroll::-webkit-scrollbar { width: 8px; }
    .circuit-chat-scroll::-webkit-scrollbar-track { background: transparent; }
    .circuit-chat-scroll::-webkit-scrollbar-thumb {
      background: rgba(168, 94, 2, 0.18);
      border-radius: 999px;
    }
    .circuit-chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(168, 94, 2, 0.35); }
    @media (prefers-reduced-motion: reduce) {
      .circuit-chat-in, .circuit-chat-bubble { animation: none !important; }
      * { transition: none !important; }
    }
  `}</style>
);

const canvasBg =
  'radial-gradient(900px 620px at 12% 6%, #fff5d6 0%, transparent 60%), ' +
  'radial-gradient(800px 620px at 92% 94%, #f0e2bd 0%, transparent 58%), ' +
  'linear-gradient(160deg, #fdfaf3 0%, #f4ecd9 100%)';

const Messages = () => {
  const { partnerId, eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const guestUid = location.state?.guestUid || localStorage.getItem('guestUid');
  const currentUserId = guestUid || auth.currentUser?.uid;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [partnerName, setPartnerName] = useState('...');

  /* Presentation-only ref for auto-scroll */
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!eventId || !currentUserId || !partnerId) {
      setError('Missing conversation details.');
      setLoading(false);
      return;
    }

    console.log('💬 Chat between:', currentUserId, 'and', partnerId, 'on event', eventId);

    // 🔥 Fetch partner name
    (async () => {
      try {
        const partnerDoc = await getDoc(doc(db, 'users', partnerId));
        if (partnerDoc.exists()) {
          const data = partnerDoc.data();
          const firstName =
            data.firstName ||
            data.userName?.split(' ')[0] ||
            data.displayName?.split(' ')[0] ||
            '';
          const lastName =
            data.lastName ||
            data.userName?.split(' ')[1] ||
            data.displayName?.split(' ')[1] ||
            '';
          const lastInitial = lastName
            ? `${lastName.charAt(0).toUpperCase()}.`
            : '';
          setPartnerName(
            firstName ? `${firstName} ${lastInitial}`.trim() : partnerId
          );
        } else {
          setPartnerName(partnerId);
        }
      } catch (err) {
        console.warn('Could not fetch partner name:', err);
        setPartnerName(partnerId);
      }
    })();

    try {
      const messagesRef = collection(db, 'events', eventId, 'messages');

      const q1 = query(
        messagesRef,
        where('from', '==', currentUserId),
        where('to', '==', partnerId)
      );

      const q2 = query(
        messagesRef,
        where('from', '==', partnerId),
        where('to', '==', currentUserId)
      );

      let messagesFrom1 = [];
      let messagesFrom2 = [];

      const mergeAndSet = () => {
        const all = [...messagesFrom1, ...messagesFrom2].sort((a, b) => {
          const aTime = a.sentAt?.toMillis?.() || 0;
          const bTime = b.sentAt?.toMillis?.() || 0;
          return aTime - bTime;
        });
        setMessages(all);
        setLoading(false);
      };

      const unsub1 = onSnapshot(q1, (snap) => {
        messagesFrom1 = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        mergeAndSet();
        snap.docs.forEach(async (d) => {
          const data = d.data();
          if (data.to === currentUserId && !data.read) {
            await updateDoc(doc(db, 'events', eventId, 'messages', d.id), {
              read: true,
            });
          }
        });
      }, (err) => {
        console.error('Query 1 error:', err);
        setError('Failed to load messages: ' + err.message);
        setLoading(false);
      });

      const unsub2 = onSnapshot(q2, (snap) => {
        messagesFrom2 = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        mergeAndSet();
        snap.docs.forEach(async (d) => {
          const data = d.data();
          if (data.to === currentUserId && !data.read) {
            await updateDoc(doc(db, 'events', eventId, 'messages', d.id), {
              read: true,
            });
          }
        });
      }, (err) => {
        console.error('Query 2 error:', err);
        setError('Failed to load messages: ' + err.message);
        setLoading(false);
      });

      return () => {
        unsub1();
        unsub2();
      };
    } catch (err) {
      console.error('Messages setup error:', err);
      setError('Failed to load messages: ' + err.message);
      setLoading(false);
    }
  }, [eventId, partnerId, currentUserId]);

  /* ---------- Presentation-only: auto-scroll to newest message ---------- */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId || !partnerId) return;

    try {
      await addDoc(collection(db, 'events', eventId, 'messages'), {
        from: currentUserId,
        to: partnerId,
        content: newMessage.trim(),
        sentAt: new Date(),
        read: false,
      });
      setNewMessage('');
    } catch (err) {
      console.error('Send message error:', err);
      alert('Failed to send message: ' + err.message);
    }
  };

  /* ---------- Loading state ---------- */
  if (loading) {
    return (
      <>
        <StyleTag />
        <div
          className="circuit-chat min-h-screen flex items-center justify-center p-4"
          style={{ background: canvasBg }}
        >
          <div className="circuit-chat-in relative w-full max-w-md overflow-hidden rounded-[26px] border border-[#eae4d2] bg-white p-10 text-center shadow-[0_1px_2px_rgba(28,25,23,0.04),0_24px_48px_-20px_rgba(28,25,23,0.18)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f59e0b] via-[#ffd24a] to-[#d9f55c]" />
            <div
              className="mx-auto mb-5 h-11 w-11 rounded-full border-[3px] border-[#eae4d2]"
              style={{ borderTopColor: '#d97706', animation: 'chatSpin .9s linear infinite' }}
            />
            <p className="m-0 text-[11px] font-bold uppercase tracking-[0.28em] text-[#a85e02]">
              Opening your conversation
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
          className="circuit-chat min-h-screen flex items-center justify-center p-4"
          style={{ background: canvasBg }}
        >
          <div className="circuit-chat-in relative w-full max-w-md overflow-hidden rounded-[26px] border border-[#eae4d2] bg-white p-9 text-center shadow-[0_1px_2px_rgba(28,25,23,0.04),0_24px_48px_-20px_rgba(28,25,23,0.18)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f59e0b] via-[#ffd24a] to-[#d9f55c]" />
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#fdecef] text-[26px]">
              ⚠️
            </div>
            <p className="m-0 mb-6 text-[15px] font-semibold leading-relaxed text-[#c7385a]">
              {error}
            </p>
            <button
              onClick={() => navigate('/dashboard/mysparks')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#1c1917] to-[#0d0a09] px-6 py-3 text-[14.5px] font-extrabold text-[#fffaf0] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_24px_-8px_rgba(0,0,0,0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_14px_30px_-8px_rgba(0,0,0,0.55),0_28px_56px_-20px_rgba(255,180,60,0.4)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ffd24a]/60"
            >
              <span>←</span>
              <span>Back to Sparks</span>
            </button>
          </div>
        </div>
      </>
    );
  }

  const partnerInitial = (partnerName || '?').trim().charAt(0).toUpperCase();

  /* ---------- Main render ---------- */
  return (
    <>
      <StyleTag />
      <div
        className="circuit-chat min-h-screen p-4 sm:p-6 flex items-start justify-center"
        style={{ background: canvasBg }}
      >
        <div className="circuit-chat-in w-full max-w-2xl">

          {/* Chat panel */}
          <div className="relative overflow-hidden rounded-[28px] border border-[#eae4d2] bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04),0_24px_48px_-20px_rgba(28,25,23,0.18),0_60px_100px_-50px_rgba(28,25,23,0.14)]">

            {/* Amber → lime accent bar */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f59e0b] via-[#ffd24a] to-[#d9f55c]" />

            {/* Header */}
            <header className="flex items-center gap-4 border-b border-[#f0e9d4] px-5 py-4 sm:px-7 sm:py-5">
              <span
                className="flex h-12 w-12 flex-none items-center justify-center rounded-full text-[18px] font-extrabold text-[#a85e02] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_16px_-6px_rgba(168,94,2,0.4)]"
                style={{ background: 'linear-gradient(180deg, #fff8e1 0%, #ffe9a3 100%)' }}
                aria-hidden="true"
              >
                {partnerInitial}
              </span>

              <div className="min-w-0 flex-1">
                <p className="m-0 mb-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.24em] text-[#a85e02]">
                  Circuit chat
                </p>
                <h2 className="display m-0 truncate text-[18px] sm:text-[20px] font-extrabold leading-tight tracking-[-0.015em] text-[#1c1917]">
                  {partnerName}
                </h2>
              </div>

              {/* Live indicator */}
              <span className="hidden items-center gap-2 rounded-full bg-[#f1fbd3] px-3 py-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#4a5d0e] sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-[#84b32e]" />
                Live
              </span>
            </header>

            {/* Message thread */}
            <div
              ref={scrollRef}
              className="circuit-chat-scroll h-[420px] sm:h-[500px] overflow-y-auto bg-[#fffdf7] px-4 py-5 sm:px-6 sm:py-6"
            >
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-5 flex h-[76px] w-[76px] items-center justify-center rounded-full bg-gradient-to-b from-[#fff8e1] to-[#ffe9a3] text-[34px] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_26px_-10px_rgba(217,119,6,0.45),0_0_0_8px_rgba(255,210,74,0.12)]">
                    👋
                  </div>
                  <p className="display m-0 text-[18px] font-extrabold tracking-[-0.01em] text-[#1c1917]">
                    Say hi to {partnerName}
                  </p>
                  <p className="mt-2 max-w-xs text-[13.5px] leading-relaxed text-[#7a736b]">
                    You both picked each other. Break the ice — a simple hello goes a long way.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {messages.map((msg) => {
                    const isMe = msg.from === currentUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`circuit-chat-bubble flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <span
                          className={`inline-block max-w-[78%] break-words rounded-2xl px-4 py-2.5 text-[14.5px] leading-snug sm:text-[15px] ${
                            isMe
                              ? 'rounded-br-md font-medium text-[#fffaf0]'
                              : 'rounded-bl-md font-medium text-[#1c1917]'
                          }`}
                          style={
                            isMe
                              ? {
                                  background:
                                    'linear-gradient(180deg, #1c1917 0%, #0d0a09 100%)',
                                  boxShadow:
                                    'inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 20px -8px rgba(0,0,0,0.45), 0 18px 36px -20px rgba(255,180,60,0.35)',
                                }
                              : {
                                  background:
                                    'linear-gradient(180deg, #fff8e1 0%, #ffefc2 100%)',
                                  border: '1px solid #f0e2bd',
                                  boxShadow:
                                    'inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 12px -6px rgba(168,94,2,0.25)',
                                }
                          }
                        >
                          {msg.content}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Composer */}
            <form
              onSubmit={sendMessage}
              className="flex items-stretch gap-2 border-t border-[#f0e9d4] bg-white px-4 py-4 sm:px-6 sm:py-5"
            >
              <input
                type="text"
                className="flex-1 min-w-0 rounded-2xl border-[1.5px] border-[#e0dbd0] bg-[#fffdf7] px-4 py-3 text-[15px] text-[#1c1917] placeholder:text-[#a8a29e] transition-all duration-200 focus:border-[#d97706] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#ffd24a]/40"
                placeholder="Type a message…"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="group flex flex-none items-center gap-2 rounded-2xl px-5 py-3 text-[14.5px] font-extrabold tracking-[0.005em] transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ffd24a]/60 disabled:cursor-not-allowed disabled:opacity-45 sm:px-6 sm:text-[15px] hover:enabled:-translate-y-0.5 active:enabled:translate-y-0"
                style={{
                  background: newMessage.trim()
                    ? 'linear-gradient(180deg, #1c1917 0%, #0d0a09 100%)'
                    : '#e0dbd0',
                  color: newMessage.trim() ? '#fffaf0' : '#7a736b',
                  boxShadow: newMessage.trim()
                    ? 'inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 20px -8px rgba(0,0,0,0.5), 0 18px 36px -16px rgba(0,0,0,0.35)'
                    : 'none',
                }}
              >
                <span className="hidden sm:inline">Send</span>
                <span className="text-[17px] leading-none transition-transform duration-200 group-enabled:group-hover:translate-x-0.5 sm:text-[15px]">
                  ➤
                </span>
              </button>
            </form>
          </div>

          {/* Back to Sparks */}
          <button
            onClick={() => navigate('/dashboard/mysparks')}
            className="group mt-6 inline-flex items-center gap-2 rounded-full border border-[#eae4d2] bg-white/70 px-4 py-2 text-[13.5px] font-bold text-[#4a4540] shadow-[0_1px_2px_rgba(28,25,23,0.04)] backdrop-blur-sm transition-all duration-200 hover:-translate-x-0.5 hover:border-[#d97706] hover:bg-white hover:text-[#1c1917] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ffd24a]/50"
          >
            <span className="text-[15px] transition-transform duration-200 group-hover:-translate-x-1">←</span>
            <span>Back to Sparks</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Messages;