import React from "react";

const EventCard = ({ event, type }) => {
  return (
    <div
  className={`w-[260px] min-w-[260px] h-[230px] p-6 m-2 rounded-2xl flex flex-col items-center justify-between shadow-md ${
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
            <div className="text-xs mt-5 p-1 text-center text-blue-500 cursor-pointer bg-white rounded-xl">
              {event.action}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="text-base text-slate-600 text-center">
  <div>Seats for Men: {event.menSpots}</div>
  <div>Seats for Women: {event.womenSpots}</div>
</div>

          {event.isActive && (
            <div className="text-xs mt-2 p-1 text-center text-blue-500 cursor-pointer bg-white rounded-xl">
              Sign Up
              </div>
          )}
          {!event.isActive && (
            <div className="text-xs mt-2 p-1 text-center text-blue-500 cursor-pointer bg-white rounded-xl">
                Join Wait List
              </div>
          )}
        </>
      )}
    </div>
  );
};

export default EventCard;
