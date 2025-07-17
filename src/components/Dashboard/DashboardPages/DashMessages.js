import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  arrayUnion,
  Timestamp
} from "firebase/firestore";
import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "../../../pages/firebaseConfig";
import { FaPaperPlane } from "react-icons/fa";

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
    <>
      {/* Header */}
      <div className="flex justify-end items-center px-4 py-2 border-b">
       
        <div className="space-x-2">
          <button
            onClick={() => setDatesModalOpen(true)}
            className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
          >
            View Dates
          </button>
          <button
            onClick={handleOpenInviteModal}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-800"
          >
            Invite to Date
          </button>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
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
                    ? "bg-indigo-600 hover:bg-indigo-800"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
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
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Invites */}
      <div className="px-4 py-2">
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

      {/* Chat Messages */}
      <div className="flex flex-col h-[57vh] pb-1 mt-1 mx-3 max-w-full shadow bg-white rounded-3xl border border-gray-50">
        <div className="flex flex-col flex-grow overflow-y-auto px-11 pt-6 pb-4">
          {messageArray.map((msg, idx) => (
            <div
              key={idx}
              className={
                msg.senderId === me
                  ? "self-end px-8 py-3.5 text-white bg-blue-700 mt-4 rounded-[40px]"
                  : msg.senderId === "system"
                  ? "self-center px-6 py-2 text-gray-700 bg-green-100 mt-4 rounded"
                  : "self-start px-6 py-3.5 text-black bg-gray-300 mt-4 rounded-[40px]"
              }
            >
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex items-center gap-4 px-6 py-4 border-t border-gray-200">
          <input
            type="text"
            value={newMessageText}
            onChange={e => setNewMessageText(e.target.value)}
            onKeyDown={handleOnKeyDown}
            placeholder="Type a message..."
            className="flex-grow text-2xl outline-none bg-transparent"
          />
          <button
            onClick={submitNewMessage}
            disabled={!newMessageText.trim()}
            className={`${!newMessageText.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <FaPaperPlane className="text-indigo-600 text-4xl cursor-pointer hover:text-indigo-800" />
          </button>
        </div>
      </div>
    </>
  );
}
