import React from "react";

const EventCard = ({ event, type }) => {
  return (
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

      {/* Show men and women spots for both upcoming and signup events */}
      <div className="text-base text-slate-600">
        <span>Open Spots for Men: {event.menSpots}</span>
        <br />
        <span>Open Spots for Women: {event.womenSpots}</span>
      </div>

      {type === "upcoming" && event.action && (
        <div className="text-xs mt-5 p-1 text-center text-blue-500 cursor-pointer bg-white rounded-xl">
          {event.action}
        </div>
      )}

      {type === "signup" && (
        <>
          {event.isActive && (
            <div className="text-xs mt-5 p-1 text-center text-blue-500 cursor-pointer bg-white rounded-xl">
              Sign Up
            </div>
          )}
          {!event.isActive && (
            <div className="text-xs mt-5 p-1 text-center text-blue-500 cursor-pointer bg-white rounded-xl">
              Join Wait List
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EventCard;
