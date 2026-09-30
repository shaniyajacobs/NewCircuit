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

const StyleTag = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Poppins:wght@400;500;600;700&display=swap');

    .circuit-chat {
      font-family: 'Poppins','Calibri','Candara',system-ui,sans-serif;
      font-size: 16.5px;
      letter-spacing: -0.005em;
    }
    .circuit-chat .display {
      font-family: 'Bricolage Grotesque','Poppins',sans-serif;
      font-variation-settings: 'opsz' 96;
      letter-spacing: -0.03em;
    }
    .circuit-chat .pop {
      /* text that steps forward */
      text-shadow: 0 1px 0 rgba(255,255,255,0.6), 0 2px 12px rgba(168,94,2,0.08);
    }

    @keyframes chatIn { from { opacity:0; transform: translateY(14px) scale(.985); } to { opacity:1; transform: translateY(0) scale(1); } }
    @keyframes chatSpin { to { transform: rotate(360deg); } }
    @keyframes bubbleIn { from { opacity:0; transform: translateY(8px) scale(.97); } to { opacity:1; transform: translateY(0) scale(1); } }
    @keyframes floaty {
      0%,100% { transform: translateY(0); }
      50%     { transform: translateY(-4px); }
    }
    .circuit-chat-in { animation: chatIn .6s cubic-bezier(.22,1,.36,1) both; }
    .circuit-chat-bubble { animation: bubbleIn .3s cubic-bezier(.22,1,.36,1) both; }
    .circuit-chat-float { animation: floaty 3s ease-in-out infinite; }

    .circuit-chat-scroll::-webkit-scrollbar { width: 8px; }
    .circuit-chat-scroll::-webkit-scrollbar-track { background: transparent; }
    .circuit-chat-scroll::-webkit-scrollbar-thumb {
      background: rgba(168, 94, 2, 0.22);
      border-radius: 999px;
    }
    .circuit-chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(168, 94, 2, 0.4); }

    @media (prefers-reduced-motion: reduce) {
      .circuit-chat-in, .circuit-chat-bubble, .circuit-chat-float { animation: none !important; }
      * { transition: none !important; }
    }
  `}</style>
);

const canvasBg =
  'radial-gradient(900px 620px at 12% 6%, #fff7dc 0%, transparent 60%), ' +
  'radial-gradient(800px 620px at 92% 94%, #ffe9b8 0%, transparent 58%), ' +
  'linear-gradient(160deg, #fffdf5 0%, #f7ecd0 100%)';

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

  const scrollRef = useRef(null);

  useEffect(() => {
    if (!eventId || !currentUserId || !partnerId) {
      setError('Missing conversation details.');
      setLoading(false);
      return;
    }

    console.log('💬 Chat between:', currentUserId, 'and', partnerId, 'on event', eventId);

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

  if (loading) {
    return (
      <>
        <StyleTag />
        <div
          className="circuit-chat min-h-screen flex items-center justify-center p-4"
          style={{ background: canvasBg }}
        >
          <div className="circuit-chat-in relative w-full max-w-md overflow-hidden rounded-[32px] border-2 border-[#ffd24a] bg-white p-10 text-center shadow-[0_24px_60px_-20px_rgba(168,94,2,0.35),0_0_0_8px_rgba(255,210,74,0.18)]">
            <div className="circuit-chat-float mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-[#ffe27a] to-[#f5a623] text-[26px] shadow-[inset_0_2px_0_rgba(255,255,255,0.6),0_12px_28px_-8px_rgba(217,119,6,0.55)]">
              💬
            </div>
            <p className="display pop m-0 text-[20px] font-extrabold text-[#1c1917]">
              Opening your chat…
            </p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <StyleTag />
        <div
          className="circuit-chat min-h-screen flex items-center justify-center p-4"
          style={{ background: canvasBg }}
        >
          <div className="circuit-chat-in relative w-full max-w-md overflow-hidden rounded-[32px] border-2 border-[#ffd24a] bg-white p-9 text-center shadow-[0_24px_60px_-20px_rgba(168,94,2,0.35),0_0_0_8px_rgba(255,210,74,0.18)]">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#fdecef] text-[30px]">
              ⚠️
            </div>
            <p className="display pop m-0 mb-6 text-[18px] font-extrabold leading-snug text-[#c7385a]">
              {error}
            </p>
            <button
              onClick={() => navigate('/dashboard/mysparks')}
              className="display inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#1c1917] to-[#0d0a09] px-7 py-3.5 text-[16px] font-extrabold text-[#fffaf0] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_12px_28px_-8px_rgba(0,0,0,0.55)] transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ffd24a]/60"
            >
              <span className="text-[18px]">←</span>
              <span>Back to Sparks</span>
            </button>
          </div>
        </div>
      </>
    );
  }

  const partnerInitial = (partnerName || '?').trim().charAt(0).toUpperCase();

  return (
    <>
      <StyleTag />
      <div
        className="circuit-chat min-h-screen p-4 sm:p-6 flex items-start justify-center"
        style={{ background: canvasBg }}
      >
        <div className="circuit-chat-in w-full max-w-2xl">

          {/* Chat panel — bright amber frame that "pops in front" */}
          <div className="relative overflow-hidden rounded-[32px] border-2 border-[#ffd24a] bg-white shadow-[0_24px_60px_-20px_rgba(168,94,2,0.35),0_60px_120px_-50px_rgba(168,94,2,0.35),0_0_0_8px_rgba(255,210,74,0.18)]">

            {/* Header */}
            <header className="relative flex items-center gap-4 border-b-2 border-[#ffe9a3] bg-gradient-to-b from-[#fff8e1] to-[#fffdf5] px-5 py-5 sm:px-7 sm:py-6">
              <span
                className="circuit-chat-float flex h-16 w-16 flex-none items-center justify-center rounded-full text-[24px] font-extrabold text-[#7a4402] shadow-[inset_0_2px_0_rgba(255,255,255,0.7),0_14px_30px_-10px_rgba(217,119,6,0.55),0_0_0_6px_rgba(255,210,74,0.25)]"
                style={{ background: 'linear-gradient(180deg, #ffe27a 0%, #f5a623 100%)' }}
                aria-hidden="true"
              >
                {partnerInitial}
              </span>

              <div className="min-w-0 flex-1">
                <p className="m-0 mb-1 text-[11px] font-extrabold uppercase tracking-[0.28em] text-[#a85e02]">
                  You&rsquo;re chatting with
                </p>
                <h2 className="display pop m-0 truncate text-[24px] sm:text-[28px] font-extrabold leading-[1.05] text-[#1c1917]">
                  {partnerName}
                </h2>
              </div>

              <span className="hidden items-center gap-2 rounded-full border border-[#d9f55c] bg-[#f1fbd3] px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#4a5d0e] sm:inline-flex">
                <span className="h-2 w-2 rounded-full bg-[#84b32e] shadow-[0_0_8px_rgba(132,179,46,0.9)]" />
                Live
              </span>
            </header>

            {/* Thread */}
            <div
              ref={scrollRef}
              className="circuit-chat-scroll h-[440px] sm:h-[520px] overflow-y-auto bg-[#fffdf5] px-4 py-6 sm:px-7 sm:py-7"
            >
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="circuit-chat-float mb-6 inline-flex h-[92px] w-[92px] items-center justify-center rounded-full text-[42px] shadow-[inset_0_2px_0_rgba(255,255,255,0.7),0_18px_40px_-12px_rgba(217,119,6,0.55),0_0_0_10px_rgba(255,210,74,0.18)]"
                    style={{ background: 'linear-gradient(180deg, #ffe27a 0%, #f5a623 100%)' }}
                  >
                    👋
                  </div>
                  <p className="display pop m-0 text-[24px] sm:text-[28px] font-extrabold leading-tight text-[#1c1917]">
                    Say hi to <span className="italic text-[#a85e02]">{partnerName}</span>
                  </p>
                  <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-[#4a4540]">
                    You both picked each other. Break the ice — a simple hello goes a long way.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {messages.map((msg) => {
                    const isMe = msg.from === currentUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`circuit-chat-bubble flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <span
                          className={`inline-block max-w-[80%] break-words rounded-[22px] px-4 py-3 text-[15.5px] font-medium leading-snug sm:text-[16px] ${
                            isMe
                              ? 'rounded-br-md text-[#fffaf0]'
                              : 'rounded-bl-md text-[#1c1917]'
                          }`}
                          style={
                            isMe
                              ? {
                                  background:
                                    'linear-gradient(180deg, #2a2018 0%, #0d0a09 100%)',
                                  boxShadow:
                                    'inset 0 1px 0 rgba(255,255,255,0.1), 0 10px 24px -8px rgba(0,0,0,0.45), 0 22px 44px -22px rgba(255,180,60,0.4)',
                                }
                              : {
                                  background:
                                    'linear-gradient(180deg, #fff8e1 0%, #ffe9a3 100%)',
                                  border: '1px solid #ffd24a',
                                  boxShadow:
                                    'inset 0 1px 0 rgba(255,255,255,0.9), 0 8px 20px -8px rgba(168,94,2,0.3)',
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
              className="flex items-stretch gap-2.5 border-t-2 border-[#ffe9a3] bg-gradient-to-b from-[#fffdf5] to-[#fff8e1] px-4 py-4 sm:px-6 sm:py-5"
            >
              <input
                type="text"
                className="flex-1 min-w-0 rounded-[20px] border-2 border-[#ffd24a] bg-white px-5 py-3.5 text-[16px] font-medium text-[#1c1917] placeholder:text-[#b39b6b] shadow-[inset_0_2px_4px_rgba(168,94,2,0.08)] transition-all duration-200 focus:border-[#d97706] focus:outline-none focus:ring-4 focus:ring-[#ffd24a]/40"
                placeholder="Say something nice…"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="display group flex flex-none items-center gap-2 rounded-[20px] px-5 py-3.5 text-[16px] font-extrabold transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ffd24a]/60 disabled:cursor-not-allowed disabled:opacity-45 sm:px-7 hover:enabled:-translate-y-0.5 active:enabled:translate-y-0"
                style={{
                  background: newMessage.trim()
                    ? 'linear-gradient(180deg, #2a2018 0%, #0d0a09 100%)'
                    : '#e0dbd0',
                  color: newMessage.trim() ? '#fffaf0' : '#7a736b',
                  boxShadow: newMessage.trim()
                    ? 'inset 0 1px 0 rgba(255,255,255,0.1), 0 12px 28px -8px rgba(0,0,0,0.5), 0 24px 48px -20px rgba(255,180,60,0.45)'
                    : 'none',
                }}
              >
                <span className="hidden sm:inline">Send</span>
                <span className="text-[18px] leading-none transition-transform duration-200 group-enabled:group-hover:translate-x-1">➤</span>
              </button>
            </form>
          </div>

          {/* Back to Sparks */}
          <button
            onClick={() => navigate('/dashboard/mysparks')}
            className="display group mt-6 inline-flex items-center gap-2 rounded-full border-2 border-[#ffd24a] bg-white px-5 py-2.5 text-[14.5px] font-extrabold text-[#4a4540] shadow-[0_10px_24px_-10px_rgba(168,94,2,0.4)] transition-all duration-200 hover:-translate-x-0.5 hover:border-[#d97706] hover:text-[#1c1917] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ffd24a]/50"
          >
            <span className="text-[16px] transition-transform duration-200 group-hover:-translate-x-1">←</span>
            <span>Back to Sparks</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Messages;