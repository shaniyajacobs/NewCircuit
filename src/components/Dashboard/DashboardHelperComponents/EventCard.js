import React from "react";

const EventCard = ({ event, type, onJoin }) => {
  const handleJoinClick = () => {
    if (event.action === "Join Now") {
      window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "_blank");
      if (onJoin) {
        onJoin(event);
      }
    }
  };

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

      {type === "upcoming" ? (
        <>
          <div className="text-base text-slate-600">{event.status}</div>
          {event.action && (
            <div 
              onClick={handleJoinClick}
              className="text-xs mt-5 p-1 text-center text-blue-500 cursor-pointer bg-white rounded-xl hover:bg-blue-50 transition-colors"
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
