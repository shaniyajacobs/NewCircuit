import { doc, getDoc, getDocFromServer, onSnapshot, setDoc } from "firebase/firestore";
import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "../../../pages/firebaseConfig";
import { FaPaperPlane } from "react-icons/fa";
import userEvent from "@testing-library/user-event";

const messages = [
  { senderId: "user", receiverId: "other", text: "Salutations M'Lady.", timeStamp: 0},
  { senderId: "other", receiverId: "user", text: "I loved our chat!! 🥰��", timeStamp: 0},
  { senderId: "user", receiverId: "other", text: "Let's go on a date? 🙏🏻", timeStamp: 0},
  // EXAMPLE MESSAGE ARRAY
];

export function DashMessages(props) {
  const { connection } = props;
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageArray, setMessageArray] = useState([]);
  const [newMessageText, setNewMessageText] = useState("");
  const messagesEndRef = useRef(null);

  const CONVERSATION_ID = () => {
    if (auth.currentUser.uid < connection.id) {
      return `${auth.currentUser.uid}${connection.id}`;
    } else {
      return `${connection.id}${auth.currentUser.uid}`;
    }
  };

  useEffect(() => {
    const initializeConversation = async () => {
      const convoId = CONVERSATION_ID();
      const convoRef = doc(db, "conversations", convoId);
      const convoSnap = await getDoc(convoRef);

      if (!convoSnap.exists()) {
        // Initialize new conversation
        const newConversation = {
          conversationId: convoId,
          userIds: [auth.currentUser.uid, connection.id],
          messages: []
        };
        await setDoc(convoRef, newConversation);
        setSelectedConversation(newConversation);
        setMessageArray([]);
      } else {
        const convoData = convoSnap.data();
        setSelectedConversation(convoData);
        setMessageArray(convoData.messages || []);
      }
    };

    initializeConversation();

    // Set up real-time listener for conversation updates
    const unsub = onSnapshot(doc(db, "conversations", CONVERSATION_ID()), (doc) => {
      if (doc.exists()) {
        const convoData = doc.data();
        setSelectedConversation(convoData);
        setMessageArray(convoData.messages || []);
      }
    });

    return () => unsub();
  }, [connection.id]);

  const handleOnKeyDown = (event) => {
    if (event.key === 'Enter' && newMessageText.trim()) {
      submitNewMessage();
    }
  };

  async function submitNewMessage() {
    if (!newMessageText.trim() || !selectedConversation) return;

    const newMessage = {
      senderId: auth.currentUser.uid,
      receiverId: connection.id,
      text: newMessageText.trim(),
      timeStamp: Date.now()
    };

    const updatedConversation = {
      ...selectedConversation,
      messages: [...messageArray, newMessage]
    };

    try {
      await setDoc(doc(db, "conversations", selectedConversation.conversationId), updatedConversation);
      setNewMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messageArray]);

  return (
    <div className="flex flex-col h-[57vh] pb-1 mt-1 mx-3 mx-5 text-sm font-semibold leading-snug bg-white rounded-3xl border border-gray-50 shadow-[0px_4px_20px_rgba(238,238,238,0.502)] max-md:max-w-full">
      <div className="flex flex-col flex-grow overflow-hidden">
        <div className="flex flex-col flex-grow overflow-y-auto px-11 pt-6 pb-4">
          {messageArray.map((message, index) => (
            <div
              key={index}
              className={`${
                message.senderId === auth.currentUser.uid
                  ? "self-end px-8 py-3.5 text-white bg-blue-700 mt-4 rounded-[40px]"
                  : "self-start px-6 py-3.5 text-black bg-gray-300 mt-4 rounded-[40px]"
              }`}
            >
              {message.text}
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
            className={`${!newMessageText.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <FaPaperPlane className="text-indigo-600 text-4xl cursor-pointer hover:text-indigo-800" />
          </button>
        </div>
      </div>
    </div>
  );
}