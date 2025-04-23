import { doc, getDoc, getDocFromServer, onSnapshot, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
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

  return (
    <div className="flex flex-col h-screen pb-2.5 mt-2.5 mr-5 ml-5 text-4xl font-semibold leading-snug bg-white rounded-3xl border border-gray-50 border-solid shadow-[0px_4px_20px_rgba(238,238,238,0.502)] max-md:pr-5 max-md:mr-2.5 max-md:max-w-full">
      <div className="flex z-10 flex-col flex-grow overflow-y-auto pt-6 pb-12 mt-0 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0px_4px_20px_rgba(238,238,238,0.502)] max-md:max-w-full">
        <div className="flex flex-col flex-grow overflow-y-auto px-11 w-full max-md:px-5 max-md:max-w-full">
          <div className="flex flex-wrap gap-9 self-start text-black">
            
          </div>
          {messageArray ? messageArray.map((message, index) => (
            <div
              key={index}
              className={`${
                message.senderId === auth.currentUser.uid || message.senderId === "user" //TODO: REMOVE USER
                  ? "self-end px-8 py-3.5 text-white bg-blue-700 mt-4 rounded-[40px] max-md:px-5 max-md:max-w-full"
                  : "self-start px-6 py-3.5 text-black bg-gray-300 mt-4 rounded-[40px] max-md:px-5 max-md:max-w-full"
              }`}
            >
              {message.text}
            </div>
          )) : <div/>}
        </div>
        <div className="self-end px-16 py-5 mt-24 mr-10 max-w-full text-3xl text-black whitespace-nowrap bg-white border border-black border-solid rounded-[40px] shadow-[0px_4px_4px_rgba(0,0,0,0.25)] w-[1385px] max-md:px-5 max-md:mt-10 max-md:mr-2.5">
          <input
            type="text"
            id="messageInput"
            placeholder="Message"
            value={newMessageText}
            className="w-full bg-transparent outline-none"
            aria-label="Message"
            onChange={e => setNewMessageText(e.target.value)}
            onKeyDown={handleOnKeyDown}
          />
          <button onClick={() => submitNewMessage()}>
            <FaPaperPlane className="text-indigo-600 cursor-pointer hover:text-indigo-800" />
          </button>
        </div>
      </div>
    </div>
  );
}