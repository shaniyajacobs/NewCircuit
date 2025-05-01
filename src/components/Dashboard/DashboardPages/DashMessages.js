import { doc, getDoc, getDocFromServer, onSnapshot, setDoc } from "firebase/firestore";
import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "../../../pages/firebaseConfig";
import { FaPaperPlane } from "react-icons/fa";
import userEvent from "@testing-library/user-event";

const messages = [
  { senderId: "user", receiverId: "other", text: "Salutations M'Lady.", timeStamp: 0},
  { senderId: "other", receiverId: "user", text: "I loved our chat!! 🥰🥰", timeStamp: 0},
  { senderId: "user", receiverId: "other", text: "Let's go on a date? 🙏🏻", timeStamp: 0},
  // EXAMPLE MESSAGE ARRAY
];

export function DashMessages(props) {
    const { connection } = props;
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messageArray, setMessageArray] = useState(null);
    const [newMessageText, setNewMessageText] = useState("");
    const messagesEndRef = useRef(null);

    const CONVERSATION_ID = () => {
      if (auth.currentUser.uid < connection.id) {
        return `${auth.currentUser.uid}${connection.id}`
      } else {
        return `${connection.id}${auth.currentUser.uid}`
      }
    };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "conversations", CONVERSATION_ID()), (doc) => {
      console.log("NEW UPDATE");
      chooseConnection();
    });

    // Clean up the subscription on component unmount
    return () => {
      unsub();
    };
  }, [CONVERSATION_ID()]);

    async function chooseConnection() {
      const userConversation = await getDocFromServer(doc(db, "conversations", CONVERSATION_ID()));
      if (userConversation.exists()) {
        const userConversationData = userConversation.data();
        setSelectedConversation(userConversationData);
        setMessageArray(userConversationData.messages);
        console.log(userConversationData);
      }
    }

    // useEffect(() => {
    //   chooseConnection();
    // }, []);

    // useEffect(() => {
    //   if (selectedConversation) {
    //     console.log(selectedConversation.messages)
    //   }
    // }, [selectedConversation]);

    const handleOnKeyDown = (event) => {
      if (event.key === 'Enter') {
        // Action to perform when Enter key is pressed
        console.log('Enter key pressed');
        submitNewMessage();
        // Call a function or update state as needed
      }
    };

    async function submitNewMessage() {
      const newMessage = { senderId: auth.currentUser.uid, receiverId: connection.id, text: newMessageText, timeStamp: 0};
      const updatedConversation = {
        conversationId: selectedConversation.conversationId,
        userIds: selectedConversation.userIds,
        messages: [...messageArray, newMessage]
      }
      // setMessageArray([...messageArray, newMessage]);
      // setNewMessageText("");
      try {
        await setDoc(doc(db, "conversations", `${selectedConversation.conversationId}`), updatedConversation);
        await chooseConnection();
        setNewMessageText("");
      } catch(error) {
        console.log(error);
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
            {messageArray ? messageArray.map((message, index) => (
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
            )) : <div />}
            <div ref={messagesEndRef} />
          </div>
    
          <div className="px-8 py-5 border-t border-gray-200 bg-white flex items-center gap-4">
            <input
              type="text"
              value={newMessageText}
              onChange={e => setNewMessageText(e.target.value)}
              onKeyDown={handleOnKeyDown}
              placeholder="Message"
              className="flex-grow text-2xl outline-none bg-transparent"
            />
            <button onClick={submitNewMessage}>
              <FaPaperPlane className="text-indigo-600 text-4xl cursor-pointer hover:text-indigo-800" />
            </button>
          </div>
        </div>
      </div>
    );
    
}