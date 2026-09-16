import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EventCard from "../DashboardHelperComponents/EventCard";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { sortEventsByDate } from "../../../utils/eventSorter";
import { DateTime } from 'luxon';

// Add a hook to detect window width
function useResponsiveGridCols() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile ? 1 : 3;
}

// Helper: map event timeZone field to IANA
const eventZoneMap = {
  'PST': 'America/Los_Angeles',
  'EST': 'America/New_York',
  'CST': 'America/Chicago',
  'MST': 'America/Denver',
  // Add more as needed
};

// Helper function to check if event is past
function isEventPast(event) {
  if (!event.date || !event.time || !event.timeZone) return true;
  
  let eventZone = eventZoneMap[event.timeZone] || event.timeZone || 'UTC';
  const normalizedTime = event.time ? event.time.replace(/am|pm/i, match => match.toUpperCase()) : '';
  
  let eventDateTime = DateTime.fromFormat(
    `${event.date} ${normalizedTime}`,
    'yyyy-MM-dd h:mma',
    { zone: eventZone }
  );
  
  if (!eventDateTime.isValid) {
    eventDateTime = DateTime.fromFormat(
      `${event.date} ${normalizedTime}`,
      'yyyy-MM-dd H:mm',
      { zone: eventZone }
    );
  }
  
  if (!eventDateTime.isValid) return true;

  // Add 90 minutes for event duration and 24 hours buffer
  const eventThreshold = eventDateTime.plus({ minutes: 90 }).plus({ days: 1 });
  const now = DateTime.now().setZone(eventZone);
  
  return eventThreshold <= now;
}

const AllDates = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userGender, setUserGender] = useState(null);
  const [datesRemaining, setDatesRemaining] = useState(100);
  const navigate = useNavigate();
  const gridCols = useResponsiveGridCols();

  useEffect(() => {
    fetchEvents();
    // Optionally fetch userGender and datesRemaining if needed for EventCard
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "events"));
      const eventsList = [];
      for (const docSnapshot of querySnapshot.docs) {
        const eventData = docSnapshot.data();
        eventsList.push({ ...eventData, firestoreID: docSnapshot.id });
      }
      
      // Filter out past events first, then sort remaining events chronologically
      const upcomingEvents = eventsList.filter(event => !isEventPast(event));
      const sortedEvents = sortEventsByDate(upcomingEvents);
      setEvents(sortedEvents);
    } catch (error) {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-7 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)] max-sm:p-5">
      <div className="flex items-center justify-between mb-6">
        <div className="text-xl font-semibold text-indigo-950">All Upcoming Events</div>
        <button
          className="px-4 py-2 text-sm font-medium text-white bg-gray-400 rounded-lg hover:bg-gray-600 transition-colors"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
      </div>
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 bg-white rounded-xl`}>
        {loading ? (
          <div className={`col-span-${gridCols} flex items-center justify-center w-full p-8`}>
            <div className="text-lg text-gray-600">Loading events...</div>
          </div>
        ) : events.length > 0 ? (
          events.map((event) => (
            <EventCard
              key={event.firestoreID}
              event={event}
              type="upcoming"
              userGender={userGender}
              datesRemaining={datesRemaining}
              onSignUp={() => {}}
            />
          ))
        ) : (
          <div className={`col-span-${gridCols} flex items-center justify-center w-full p-8`}>
            <div className="text-lg text-gray-600">No events available</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllDates; 