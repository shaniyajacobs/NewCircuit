import React from "react";
import { IoChevronBackCircleOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

const messages = [
  { sender: "user", text: "Salutations M'Lady." },
  { sender: "other", text: "I loved our chat!! 🥰🥰" },
  { sender: "user", text: "Let's go on a date? 🙏🏻" },
];

export function DashMessages(props) {
    const { connection } = props;
    console.log(connection.name);
  return (
    <div className="flex flex-col h-screen pb-2.5 mt-2.5 mr-5 ml-5 text-4xl font-semibold leading-snug bg-white rounded-3xl border border-gray-50 border-solid shadow-[0px_4px_20px_rgba(238,238,238,0.502)] max-md:pr-5 max-md:mr-2.5 max-md:max-w-full">
      <div className="flex z-10 flex-col flex-grow overflow-y-auto pt-6 pb-12 mt-0 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0px_4px_20px_rgba(238,238,238,0.502)] max-md:max-w-full">
        <div className="flex flex-col flex-grow overflow-y-auto px-11 w-full max-md:px-5 max-md:max-w-full">
          <div className="flex flex-wrap gap-9 self-start text-black">
            <button>
              <IoChevronBackCircleOutline size={50} />
            </button>

            <div className="flex-auto self-start max-md:max-w-full"> {connection.name} </div>
          </div>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`${
                message.sender === "user"
                  ? "self-end px-8 py-3.5 text-black bg-blue-700 mt-4 rounded-[40px] max-md:px-5 max-md:max-w-full"
                  : "self-start px-6 py-3.5 text-black bg-gray-300 rounded-[40px] max-md:px-5 max-md:max-w-full"
              }`}
            >
              {message.text}
            </div>
          ))}
        </div>
        <form className="self-end px-16 py-5 mt-24 mr-10 max-w-full text-3xl text-black whitespace-nowrap bg-white border border-black border-solid rounded-[40px] shadow-[0px_4px_4px_rgba(0,0,0,0.25)] w-[1385px] max-md:px-5 max-md:mt-10 max-md:mr-2.5">
          <label htmlFor="messageInput" className="sr-only">Message</label>
          <input
            type="text"
            id="messageInput"
            placeholder="Message"
            className="w-full bg-transparent outline-none"
            aria-label="Message"
          />
        </form>
      </div>
    </div>
  );
}