import React, { useState, useEffect } from "react";

import { useNavigate, Link } from 'react-router-dom';
import EventCard from "../DashboardHelperComponents/EventCard";
import ConnectionsTable from "../DashboardHelperComponents/ConnectionsTable";
import { collection, query, getDocs, Timestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from '../../../firebaseConfig';

const DashHome = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [signUpEvents, setSignUpEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsRef = collection(db, "events");
        const querySnapshot = await getDocs(eventsRef);
        const currentTime = Timestamp.now();
        
        const userEvents = [];
        const availableEvents = [];

        querySnapshot.forEach((doc) => {
          const eventData = doc.data();
          const eventDate = eventData.date;
          
          // Format the event for display
          const formattedEvent = {
            id: doc.id,
            title: eventData.title,
            date: eventDate.toDate().toLocaleDateString(),
            time: eventDate.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            menSpots: `${eventData.men ? eventData.men.length : 0}/10`,
            womenSpots: `${eventData.women ? eventData.women.length : 0}/10`,
            isActive: eventDate > currentTime,
          };

          // Check if user is registered
          const isUserRegistered = 
            (eventData.men && eventData.men.includes(user.uid)) || 
            (eventData.women && eventData.women.includes(user.uid));

          if (isUserRegistered) {
            userEvents.push({
              ...formattedEvent,
              action: eventDate > currentTime ? "Join Now" : "Event Passed"
            });
          } else {
            availableEvents.push({
              ...formattedEvent
            });
          }
        });

        // Sort events by date
        const sortByDate = (a, b) => new Date(a.date) - new Date(b.date);
        setUpcomingEvents(userEvents.sort(sortByDate));
        setSignUpEvents(availableEvents.sort(sortByDate));
 

  const handleEventSignUp = (event) => {
    // Remove the event from signUpEvents
    setSignUpEvents(signUpEvents.filter(e => 
      e.title !== event.title || e.date !== event.date || e.time !== event.time
    ));

    // Add the event to upcomingEvents with updated status
    const newUpcomingEvent = {
      ...event,
      status: "1/10 sign ups",
      action: "Join Now",
      isActive: false
    };
    setUpcomingEvents([...upcomingEvents, newUpcomingEvent]);
  };

      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchEvents();
  }, [user.uid]);

  // Dummy connections data (moved outside useEffect)
  const connections = [
    {
      id: "01",
      name: "Kelly Rachel",
      matchLevel: 65,
    },
    {
      id: "02",
      name: "Taylor Swift",
      matchLevel: 29,
    },
    {
      id: "03",
      name: "Jennifer Lopex",
      matchLevel: 48,
    },
  ];

  const handleMatchesClick = () => {
    navigate('myMatches');
  };

  const handleConnectionsClick = () => {
    navigate('dashMyConnections');
  };

  return (
    <div>
      <div className="p-7 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)] max-sm:p-5">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex flex-col gap-2">
              <button 
                onClick={handleMatchesClick}
                className="px-4 py-2 text-sm font-medium text-white bg-[#0043F1] rounded-lg hover:bg-[#0034BD] transition-colors"
              >
                You just went on a date! Here are your ai rec matches! 
              </button>
              <button 
                onClick={handleConnectionsClick}
                className="px-4 py-2 text-sm font-medium text-white bg-[#85A2F2] rounded-lg hover:opacity-90 transition-colors"
              >
                See your new connections
              </button>
            </div>
            <div className="text-xl font-semibold text-indigo-950 mt-4">
              Upcoming Events
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <div className="flex bg-white rounded-xl min-w-max">
            {upcomingEvents.map((event, index) => (
              <EventCard key={index} event={event} type="upcoming" />
            ))}
          </div>
        </div>

        <div className="p-7 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)] max-sm:p-5 mt-6">
            <div className="flex justify-between">
              <div className="mb-6 text-xl font-semibold text-[#05004E]">
                Sign-Up for Dates
              </div>
              <div className="text-right font-semibold text-[#05004E]">Dates Remaining: 3</div>
            </div>
            <div className="overflow-x-auto">
              <div className="flex bg-white rounded-xl min-w-max">
                {signUpEvents.map((event, index) => (
                  <EventCard 
                    key={index} 
                    event={event} 
                    type="signup" 
                    onSignUp={handleEventSignUp}
                  />
                ))}
              </div>
            </div>
            <Link 
              to="dashDateCalendar"
              className="mt-5 text-xs text-center text-blue-500 cursor-pointer block"
            >
              Purchase More Dates
            </Link>
          </div>

          <div className="p-7 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)] max-sm:p-5 mt-6">
            <div className="mb-6 text-xl font-semibold text-indigo-950">
              Current Connections
            </div>
          </div>
          <div className="flex bg-white rounded-xl">
            {signUpEvents.map((event) => (
              <EventCard key={event.id} event={event} type="signup" />
            ))}
          </div>
          <Link 
            to="dashDateCalendar"
            className="mt-5 text-xs text-center text-blue-500 cursor-pointer block"
          >
            Purchase More Dates
          </Link>
        </div>

        <div className="p-7 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)] max-sm:p-5">
          <div className="mb-6 text-xl font-semibold text-indigo-950">
            Current Connections
          </div>
          <ConnectionsTable connections={connections} />
        </div>
      </div>
    </div>
  );
};

export default DashHome;