import React, { useState, useEffect } from "react";
import { useNavigate, Link } from 'react-router-dom';
import EventCard from "../DashboardHelperComponents/EventCard";
import ConnectionsTable from "../DashboardHelperComponents/ConnectionsTable";
import RemoEvent from "../DashboardHelperComponents/RemoEvent";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import CircuitEvent from "../DashboardHelperComponents/CircuitEvent";

const DashHome = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [firebaseEvents, setFirebaseEvents] = useState([]);
  const [loading, setLoading] = useState(true);


  const upcomingEvents = [
    {
      title: "25-34 yrs old SF",
      date: "01/24/25",
      time: "5:00pm",
      status: "10/10 sign ups",
      action: "Join Now",
      isActive: false,
    },
    {
      title: "35-44 yrs old SF",
      date: "01/27/25",
      time: "7:00pm",
      status: "10/10 sign ups",
      action: "Join in 24 hours",
      isActive: true,
    },
    {
      title: "45-55 yrs old SF",
      date: "01/27/25",
      time: "7:00pm",
      status: "10/10 sign ups",
      action: "Join in 24 hours",
      isActive: false,
    },
  ];

  const signUpEvents = [
    {
      title: "25-34 yrs old SF",
      date: "01/24/25",
      time: "5:00pm",
      menSpots: "5/10",
      womenSpots: "7/10",
      isActive: true,
    },
    {
      title: "35-44 yrs old SF",
      date: "01/27/25",
      time: "7:00pm",
      menSpots: "10/10",
      womenSpots: "10/10",
      isActive: false,
    },
    {
      title: "45-55 yrs old SF",
      date: "01/27/25",
      time: "7:00pm",
      menSpots: "4/10",
      womenSpots: "9/10",
      isActive: true,
    },
  ];

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

  useEffect(() => {
    fetchEventsFromFirebase();
  }, []);

  const fetchEventsFromFirebase = async () => {
    try {
      setLoading(true);
      const eventsList = [];
      const querySnapshot = await getDocs(collection(db, "events"));
      
      console.log("querySnapshot.docs", querySnapshot.docs);
      for (const docSnapshot of querySnapshot.docs) {
        try {
          const eventData = await getEventData(docSnapshot.id);
          console.log("eventData for doc", docSnapshot.id, eventData);
          if (eventData) {
            const transformedEvent = {
              ageRange: eventData.ageRange,
              date: eventData.date,
              eventType: eventData.eventType,
              location: eventData.location,
              menSignupCount: eventData.menSignupCount,
              menSpots: eventData.menSpots,
              time: eventData.time,
              timeZone: eventData.timeZone,
              title: eventData.title,
              womenSignupCount: eventData.womenSignupCount,
              womenSpots: eventData.womenSpots,
              remo: eventData.remo
            };
            eventsList.push(transformedEvent);
          }
        } catch (error) {
          console.error(`Error processing event ${docSnapshot.id}:`, error);
          eventsList.push({
            title: "TitleNotFound",
            date: "DateNotFound",
            time: "TimeNotFound",
            status: "StatusNotFound",
            action: "ActionNotFound",
            isActive: false,
            menSpots: "N/A",
            womenSpots: "N/A",
          });
        }
      }
      
      setFirebaseEvents(eventsList);
      setEvents(eventsList);
    } catch (error) {
      console.error('Error fetching events from Firebase:', error);
      setFirebaseEvents([{
        title: "N/A",
        date: "N/A",
        time: "N/A",
        status: "N/A",
        action: "N/A",
        isActive: false,
        menSpots: "N/A",
        womenSpots: "N/A",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const postNewEvent = async () => {
    try {
      const response = await fetch('https://live.remo.co/api/v1/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token: 3d7eff4be16752f1a52f8ba059b810fa',
        },
        body: JSON.stringify(RemoEvent())
      });

      // Check if the response was successful
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      // Parse the JSON response - this is an async operation
      const output = await response.json();
      console.log('API Response:', output);

      // Now you can safely access the fields
      const eventID = output.event._id;
      console.log('Event ID:', eventID);

      // Save to your database
      await setDoc(doc(db, 'events', eventID), {
        eventName: 'Test event 3',
        eventID: eventID,
        menCapacity: 10,
        womenCapacity: 10,
      });

      console.log('Event saved to database');
      return eventID; // Return the event ID if needed elsewhere
    } catch (error) {
      console.error('Error creating event:', error);
      throw error; // Re-throw to allow handling by caller
    }
  };

const getEventData = async (eventID) => {
  try {
    // Get Firestore data first
    const eventInfo = await getDoc(doc(db, 'events', eventID));

    if (eventInfo.exists()) {
      return eventInfo.data();
    } else {
      console.warn(`No Firestore document for event ID: ${eventID}`);
      return null;
    }

    // Optional: fetch Remo data AFTER confirming Firestore
    // const apiURL = `https://live.remo.co/api/v1/events/${eventID}`;
    // const response = await fetch(apiURL, {
    //   method: 'GET',
    //   headers: {
    //     accept: 'application/json',
    //     Authorization: 'Token: 3d7eff4be16752f1a52f8ba059b810fa',
    //   }
    // });
    // if (!response.ok) {
    //   const errorData = await response.json();
    //   throw new Error(`API error: ${response.status} - ${JSON.stringify(errorData)}`);
    // }

  } catch (error) {
    console.error(`Error fetching event data for ${eventID}:`, error);
    return null;
  }
};


  const handleMatchesClick = () => {
    navigate('myMatches');
  };

  const handleConnectionsClick = () => {
    navigate('dashMyConnections');
  };


  return (
    <div>
      <div className="p-7 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)] max-sm:p-5">
        <div className="flex bg-white justify-between items-center mb-6">
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
        
        <div className="flex bg-white rounded-xl">
          {upcomingEvents.map((event, index) => (
            <EventCard key={index} event={event} type="upcoming" />
          ))}
        </div>
        <div className="p-7 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)] max-sm:p-5">
            <div className="flex justify-between">
              <div className="mb-6 text-xl font-semibold text-[#05004E]">
                Sign-Up for Dates
              </div>
              <div className="text-right font-semibold text-[#05004E]">Dates Remaining: 3</div>
            </div>
            <div className="flex bg-white rounded-xl">
              {loading ? (
                <div className="flex items-center justify-center w-full p-8">
                  <div className="text-lg text-gray-600">Loading events...</div>
                </div>
              ) : firebaseEvents.length > 0 ? (
                firebaseEvents.map((event, index) => (
                  <EventCard key={index} event={event} type="signup" />
                ))
              ) : (
                <div className="flex items-center justify-center w-full p-8">
                  <div className="text-lg text-gray-600">No events available</div>
                </div>
              )}
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
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
              onClick={() => fetchEventsFromFirebase()}
            >
              Refresh Events
            </button>
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors ml-2"
              onClick={() => console.log('Firebase Events:', firebaseEvents)}
            >
              Log Events
            </button>
          </div>
        </div>
      </div>
  );
};

export default DashHome;