import React from "react";

function getDateParts(dateString) {
  if (!dateString) return { dayOfWeek: '', day: '', month: '' };
  const dateObj = new Date(dateString);
  if (isNaN(dateObj)) return { dayOfWeek: '', day: '', month: '' };
  const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  return { dayOfWeek, day, month };
}

const EventCard = ({ event, type }) => {
  const { dayOfWeek, day, month } = getDateParts(event.date);
  return (
    <div
      className={
        "flex-col items-center p-8 rounded-2xl mr-[30px] bg-[#F3F3F3]"
      }
    >
      {/* Date Display */}
      <div style={{ border: '1px solid #222', borderRadius: '16px', width: 70, margin: '0 auto', padding: '8px 0', background: 'rgba(200,220,255,0.1)' }}>
        <div style={{ textAlign: 'center', fontWeight: 500, fontSize: 16 }}>{dayOfWeek}</div>
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 32 }}>{day}</div>
        <div style={{ textAlign: 'center', fontWeight: 500, fontSize: 16 }}>{month}</div>
      </div>
      {/* Age Range */}
      {event.ageRange && (
        <div className="text-lg font-semibold text-center text-gray-700 mb-1">
          Ages {event.ageRange}
        </div>
      )}
      {/* Title
      <div className="text-2xl font-medium text-center text-black">
        {event.title || "Event"}
      </div>  */}
      {/* Location */}
      <div className="text-base text-slate-600 text-center mt-2">
        {event.location && <span>{event.location} <br /></span>}
      </div>

      {/* Event Type and Time */}
      {(event.eventType || event.time) && (
        <div className="text-base text-slate-600 text-center mt-2">
          {event.eventType || ''}{event.eventType && event.time ? ' @ ' : ''}{event.time || ''}
        </div>
      )}
      {/* TimeZone */}
      <div className="text-base text-slate-600 text-center mt-2">
        {event.timeZone && <span>Time Zone: {event.timeZone}</span>}
      </div>
      {/* Spots Info */}
      <div className="text-base text-slate-600 text-center mt-2">
        <span>Open Spots for Men: {event.menSignupCount ?? "-"}/{event.menSpots ?? "-"}</span>
        <br />
        <span>Open Spots for Women: {event.womenSignupCount ?? "-"}/{event.womenSpots ?? "-"}</span>
      </div>
      {/* Sign Up / Wait List Button */}
      {(() => {
        // Parse numbers for comparison
        const menCount = Number(event.menSignupCount);
        const menMax = Number(event.menSpots);
        const womenCount = Number(event.womenSignupCount);
        const womenMax = Number(event.womenSpots);
        const hasSpace = (menCount < menMax) || (womenCount < womenMax);
        if (hasSpace) {
          return (
            <div className="text-xs mt-5 p-1 text-center text-blue-500 cursor-pointer bg-white rounded-xl">
              Sign Up
            </div>
          );
        } else {
          return (
            <div className="text-xs mt-5 p-1 text-center text-blue-500 cursor-pointer bg-white rounded-xl">
              Join Wait List
            </div>
          );
        }
      })()}
    </div>
  );
};

export default EventCard;
