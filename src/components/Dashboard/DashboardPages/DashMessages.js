import React, { useState, useEffect, useRef } from "react";
import { auth, db } from "../../../firebaseConfig";
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy, onSnapshot, serverTimestamp, setDoc, arrayUnion, Timestamp } from "firebase/firestore";
import { IoPersonCircle } from "react-icons/io5";
import { FaPaperPlane } from "react-icons/fa";
import { markSparkAsRead } from "../../../utils/notificationManager";

export function DashMessages({ connection }) {
  // Auth state
  const [me, setMe] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  useEffect(() => {
    return auth.onAuthStateChanged(user => {
      setMe(user?.uid ?? null);
      setAuthLoading(false);
    });
  }, []);

  // Conversation data
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageArray, setMessageArray] = useState([]);
  const [invites, setInvites] = useState([]);
  const [dates, setDates] = useState([]);

  // Invite modal form
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteDateTime, setInviteDateTime] = useState("");
  const [inviteLocation, setInviteLocation] = useState("");

  // Chat input + scroll
  const [newMessageText, setNewMessageText] = useState("");
  const messagesEndRef = useRef(null);

  // Dates modal toggle
  const [isDatesModalOpen, setDatesModalOpen] = useState(false);

  // Build conversation ID
  const CONVERSATION_ID = () =>
    me && connection.id
      ? me < connection.id
        ? `${me}${connection.id}`
        : `${connection.id}${me}`
      : "";

  // Subscribe to Firestore
  useEffect(() => {
    if (!me) return;
    const convoId = CONVERSATION_ID();
    if (!convoId) return;
    const ref = doc(db, "conversations", convoId);

    // initialize
    (async () => {
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          conversationId: convoId,
          userIds: [me, connection.id],
          messages: [],
          invites: [],
          dates: []
        });
      }
    })();

    const unsub = onSnapshot(ref, snap => {
      if (!snap.exists()) return;
      const data = snap.data();
      setSelectedConversation(data);
      setMessageArray(data.messages || []);
      setInvites(data.invites || []);
      setDates(data.dates || []);
    });
    return () => unsub();
  }, [me, connection.id]);

  // Invite handlers
  const handleOpenInviteModal = () => setInviteModalOpen(true);
  const handleCloseInviteModal = () => setInviteModalOpen(false);

  const handleSendInvite = async () => {
    const ref = doc(db, "conversations", CONVERSATION_ID());
    const newInvite = {
      id: `invite_${Date.now()}`,
      invitedBy: me,
      timestamp: Timestamp.fromDate(new Date(inviteDateTime)),
      location: inviteLocation,
      status: "pending",
      photos: {
        [me]: { uploaded: false, url: "" },
        [connection.id]: { uploaded: false, url: "" }
      }
    };
    await updateDoc(ref, { invites: arrayUnion(newInvite) });
    setInviteDateTime("");
    setInviteLocation("");
    setInviteModalOpen(false);
  };

  const handleRespond = async (inviteId, accepted) => {
    const ref = doc(db, "conversations", CONVERSATION_ID());
    const remaining = invites.filter(i => i.id !== inviteId);
    const payload = { invites: remaining };

    if (accepted) {
      const inv = invites.find(i => i.id === inviteId);

      // add to dates array
      payload.dates = arrayUnion({
        ...inv,
        status: "accepted",
        photos: {
          [me]: { uploaded: false, url: "" },
          [connection.id]: { uploaded: false, url: "" }
        }
      });

      // persist a system‐style chat message
      const confirmationMsg = {
        senderId: "system",
        receiverId: null,
        text: `Date scheduled for ${new Date(inv.timestamp.toDate()).toLocaleString()} @ ${inv.location}`,
        timeStamp: inv.timestamp.toMillis()
      };
      payload.messages = arrayUnion(confirmationMsg);
    } else {
      // Add declined message
      const inv = invites.find(i => i.id === inviteId);
      const declinedMsg = {
        senderId: "system",
        receiverId: null,
        text: `Date invitation declined for ${new Date(inv.timestamp.toDate()).toLocaleString()} @ ${inv.location}`,
        timeStamp: Date.now()
      };
      payload.messages = arrayUnion(declinedMsg);
    }

    await updateDoc(ref, payload);
  };

  // Send chat message
  const submitNewMessage = async () => {
    if (!newMessageText.trim() || !selectedConversation) return;
    const newMsg = {
      senderId: me,
      receiverId: connection.id,
      text: newMessageText.trim(),
      timeStamp: Date.now()
    };
    const ref = doc(db, "conversations", selectedConversation.conversationId);
    await updateDoc(ref, { messages: arrayUnion(newMsg) });
    
    // Mark the spark as read when user sends their first message
    await markSparkAsRead(connection.id);
    
    setNewMessageText("");
  };
  const handleOnKeyDown = e => {
    if (e.key === "Enter" && newMessageText.trim()) submitNewMessage();
  };

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageArray]);

  // Early returns
  if (authLoading) return <div className="p-4 text-center">Loading…</div>;
  if (!me)      return <div className="p-4 text-center text-red-500">Please log in to chat.</div>;

  return (
    <div className="flex flex-col h-screen">
      {/* Profile Card */}
      <div className="flex flex-col items-start self-stretch bg-white mb-8">
        <div className="flex items-center justify-between w-full mb-6">
          <div className="flex items-center gap-4">
            {/* Profile Picture */}
            <div 
              className="flex w-12 h-12 justify-center items-center rounded-full border border-[rgba(33,31,32,0.25)] bg-cover bg-center bg-no-repeat overflow-hidden"
              style={{ backgroundImage: `url(${connection.img})` }}
            >
            </div>
            
            {/* Name */}
            <div className="text-[#211F20] font-poppins text-[20px] font-normal leading-[130%]">
              {connection.name}, {connection.age || '27'}
            </div>
          </div>

          {/* Action Buttons moved to the right side */}
          <div className="flex gap-3">
            <button
              onClick={() => setDatesModalOpen(true)}
              className="flex px-6 py-3 justify-center items-center gap-3 rounded-lg border border-[rgba(33,31,32,0.50)]"
            >
              <span className="text-[#211F20] font-poppins text-[16px] font-medium leading-normal">
                View Dates
              </span>
            </button>
            <button
              onClick={handleOpenInviteModal}
              className="flex px-6 py-3 justify-center items-center gap-3 rounded-lg bg-[#211F20]"
            >
              <span className="text-white font-poppins text-[16px] font-medium leading-normal">
                Invite to Date
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages - Scrollable area with bottom padding for input */}
      <div className="flex flex-col px-[50px] flex-1 gap-[30px] self-stretch rounded-[24px] overflow-hidden pb-4">
        <div className="flex flex-col flex-1 overflow-y-auto">
          {messageArray.map((msg, idx) => (
            <div key={idx} className="mb-4">
              {msg.senderId === me ? (
                // My message (right side, blue background)
                <div className="flex flex-col items-end">
                  <div className="flex items-end gap-2">
                    <div className="max-w-[600px] px-4 py-4 rounded-lg rounded-br-none bg-[#1C50D8]">
                      <span className="text-white font-poppins text-[16px] font-normal leading-normal break-words whitespace-pre-wrap">
                        {msg.text}
                      </span>
                    </div>
                    {/* My profile picture */}
                    <div 
                      className="flex w-8 h-8 justify-center items-center rounded-full border border-[rgba(33,31,32,0.25)] bg-cover bg-center bg-no-repeat overflow-hidden"
                      style={{ backgroundImage: `url(${auth.currentUser?.photoURL || 'https://via.placeholder.com/32x32/9CA3AF/FFFFFF?text=U'})` }}
                    >
                    </div>
                  </div>
                  {/* Receipt for my message */}
                  <div className="mt-2 mr-2">
                    <span className="text-[rgba(34,34,34,0.75)] font-poppins text-base font-normal leading-normal">
                      {new Date(msg.timeStamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true}).toUpperCase()} - You
                    </span>
                  </div>
                </div>
              ) : msg.senderId === "system" ? (
                // System message (center)
                <div className="flex justify-center">
                  <div className="px-6 py-2 text-gray-700 bg-green-100 rounded text-center">
                    {msg.text}
                  </div>
                </div>
              ) : (
                // Other person's message (left side, with profile picture)
                <div className="flex items-start gap-3">
                  {/* Other person's profile picture */}
                  <div 
                    className="flex w-8 h-8 justify-center items-center rounded-full border border-[rgba(33,31,32,0.25)] bg-cover bg-center bg-no-repeat overflow-hidden"
                    style={{ backgroundImage: `url(${connection.img})` }}
                  >
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="max-w-[600px] px-4 py-4 bg-white border border-gray-200 rounded-lg">
                      <span className="text-[#211F20] font-poppins text-[16px] font-normal leading-normal break-words whitespace-pre-wrap">
                        {msg.text}
                      </span>
                    </div>
                    {/* Receipt for other person's message */}
                    <div className="ml-2">
                      <span className="text-[rgba(34,34,34,0.75)] font-poppins text-base font-normal leading-normal">
                        {new Date(msg.timeStamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true}).toUpperCase()} - {connection.name}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input - Sticky at bottom */}
      <div className="sticky bottom-0 bg-white border-t border-[rgba(0,0,0,0.10)] px-[50px] py-4">
        <div className="flex py-3 px-6 items-center gap-6 self-stretch rounded-lg border border-[rgba(0,0,0,0.10)] bg-white">
          <input
            type="text"
            value={newMessageText}
            onChange={e => setNewMessageText(e.target.value)}
            onKeyDown={handleOnKeyDown}
            placeholder="Type a message"
            className="flex-grow text-[#211F20] font-poppins text-base font-medium leading-normal opacity-50 outline-none bg-transparent"
          />
          <button
            onClick={submitNewMessage}
            disabled={!newMessageText.trim()}
            className={`${!newMessageText.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <FaPaperPlane className="text-[#1C50D8] text-2xl cursor-pointer hover:text-[#1a45c0]" />
          </button>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Invite to Date</h3>
            <label className="block mb-2 text-sm">Date & Time</label>
            <input
              type="datetime-local"
              value={inviteDateTime}
              onChange={e => setInviteDateTime(e.target.value)}
              className="border p-2 mb-4 w-full"
            />
            <label className="block mb-2 text-sm">Location</label>
            <input
              type="text"
              value={inviteLocation}
              onChange={e => setInviteLocation(e.target.value)}
              placeholder="Enter location"
              className="border p-2 mb-4 w-full"
            />
            <div className="flex justify-end">
              <button onClick={handleCloseInviteModal} className="mr-2 px-4 py-2 border rounded">
                Cancel
              </button>
              <button
                onClick={handleSendInvite}
                disabled={!inviteDateTime || !inviteLocation}
                className={`px-4 py-2 rounded text-white ${
                  inviteDateTime && inviteLocation
                    ? "bg-[#211F20] hover:bg-[#1a1a1a]"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dates Modal */}
      {isDatesModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-xl font-semibold mb-4">Scheduled Dates</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {dates.filter(d => d.status === "accepted").length > 0 ? (
                dates
                  .filter(d => d.status === "accepted")
                  .map(d => (
                    <div
                      key={d.id}
                      className="px-4 py-2 bg-green-100 rounded text-gray-800"
                    >
                      {`Date scheduled for ${new Date(d.timestamp.toDate()).toLocaleString()} @ ${d.location}`}
                    </div>
                  ))
              ) : (
                <p className="text-gray-500">No accepted dates yet.</p>
              )}
            </div>
            <div className="mt-6 text-right">
              <button
                onClick={() => setDatesModalOpen(false)}
                className="px-4 py-2 bg-[#211F20] text-white rounded hover:bg-[#1a1a1a]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Invites */}
      {invites.length > 0 && (
        <div className="px-4 py-2 mb-6">
          {invites.map(inv => (
            <div
              key={inv.id}
              className="bg-yellow-100 p-4 mb-2 rounded flex justify-between items-center"
            >
              <span>
                {connection.name} invited you on{" "}
                {new Date(inv.timestamp.toDate()).toLocaleString()} @ {inv.location}
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => handleRespond(inv.id, true)}
                  className="px-3 py-1 bg-green-500 text-white rounded"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleRespond(inv.id, false)}
                  className="px-3 py-1 bg-red-500 text-white rounded"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
