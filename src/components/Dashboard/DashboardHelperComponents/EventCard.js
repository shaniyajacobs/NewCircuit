import React, { useState } from "react";

const EventCard = ({ event, type, onSignUp }) => {
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState("");

  const handleActionClick = (action) => {
    setModalAction(action);
    setShowModal(true);
  };

  const handleConfirm = () => {
    if (type === "signup" && onSignUp) {
      onSignUp(event);
    }
    setShowModal(false);
  };

  return (
    <>
      <div
        className={`flex-col items-center p-8 rounded-2xl mr-[30px] ${
          event.isActive ? "bg-[#85A2F2]" : "bg-[#F3F3F3]"
        }`}
      >
        <div className="text-2xl font-medium text-center text-black">
          {event.title}
        </div>
        <div className="text-2xl font-semibold text-center text-indigo-950">
          <span>{event.date}</span>
          <br />
          <span>{event.time}</span>
        </div>

        {type === "upcoming" ? (
          <>
            <div className="text-base text-slate-600">{event.status}</div>
            {event.action && (
              <div 
                className="text-xs mt-5 p-1 text-center text-blue-500 cursor-pointer bg-white rounded-xl"
                onClick={() => handleActionClick(event.action)}
              >
                {event.action}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="text-base text-slate-600">
              <span>Open Spots for Men: {event.menSpots}</span>
              <br />
              <span>Open Spots for Women: {event.womenSpots}</span>
            </div>
            {event.isActive && (
              <div 
                className="text-xs mt-5 p-1 text-center text-blue-500 cursor-pointer bg-white rounded-xl"
                onClick={() => handleActionClick("Sign Up")}
              >
                Sign Up
              </div>
            )}
            {!event.isActive && (
              <div 
                className="text-xs mt-5 p-1 text-center text-blue-500 cursor-pointer bg-white rounded-xl"
                onClick={() => handleActionClick("Join Wait List")}
              >
                Join Wait List
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-semibold text-[#151D48] mb-4">
              Confirm {modalAction}
            </h3>
            <p className="text-gray-600 mb-6">Are you sure you want to {modalAction.toLowerCase()} for this event?</p>
            <div className="flex justify-end gap-4">
              <button 
                onClick={() => setShowModal(false)}
                className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirm}
                className="px-6 py-2 rounded-lg bg-[#85A2F2] text-white hover:bg-[#7491e1]"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EventCard;
