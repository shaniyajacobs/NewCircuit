import React from "react";

const EventCard = ({ event, type }) => {
  return (
    <div
      className={`flex flex-col items-center p-8 rounded-2xl ${
        event.isActive ? "bg-blue-50" : ""
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
            <div className="text-xs text-blue-500 cursor-pointer">
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
            <div className="text-xs text-blue-500 cursor-pointer">Sign Up</div>
          )}
        </>
      )}
    </div>
  );
};

export default EventCard;
