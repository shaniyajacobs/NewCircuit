import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../pages/firebaseConfig';
import { sortAndFilterUpcomingEvents } from '../utils/eventSorter';
import HomeEventCard from './HomeEventCard';

const UpcomingEventsHome = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllEvents, setShowAllEvents] = useState(false);

  // Load events from Firestore and filter for upcoming ones
  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      try {
        // Pull all events from Firestore
        const querySnapshot = await getDocs(collection(db, "events"));

        // Cloud Function to merge Remo data
        const functionsInst = getFunctions();
        const getEventDataCF = httpsCallable(functionsInst, "getEventData");

        const eventsList = await Promise.all(
          querySnapshot.docs.map(async (docSnapshot) => {
            const docData = docSnapshot.data() || {};
            const eventId = docData.eventID || docSnapshot.id;
            try {
              const res = await getEventDataCF({ eventId });
              const remoEvent = res.data?.event;
              if (remoEvent) {
                return { ...remoEvent, ...docData, firestoreID: docSnapshot.id, eventID: eventId };
              }
            } catch (err) {
              console.error(`Failed fetching Remo event for ${eventId}:`, err);
            }
            return null;
          })
        );

        const filteredEvents = eventsList.filter(Boolean);
        
        // Filter for upcoming events only (this will automatically hide past events)
        const upcomingEvents = sortAndFilterUpcomingEvents(filteredEvents, 'UTC');
        setEvents(upcomingEvents);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  return (
    <div className="w-full py-16 bg-white">
      <div className="w-full px-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-bricolage text-4xl md:text-5xl lg:text-6xl font-semibold text-black leading-[130%] mb-6">
            Upcoming Events
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Join our speed dating events and find your perfect match. All events are filtered to show only upcoming dates.
          </p>
        </div>

        {/* Events Grid */}
        <div className="grid gap-6 md:gap-8 lg:gap-10 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            // Loading state
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-gray-100 rounded-xl h-80 animate-pulse">
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))
          ) : events.length > 0 ? (
            // Show first 6 events
            events.slice(0, 6).map((event) => (
              <HomeEventCard
                key={event.firestoreID}
                event={event}
              />
            ))
          ) : (
            // No events available
            <div className="col-span-full text-center py-16">
              <div className="text-xl text-gray-600 mb-4">No upcoming events available at the moment</div>
              <p className="text-gray-500">Check back soon for new events!</p>
            </div>
          )}
        </div>

        {/* See All Events Button */}
        {events.length > 6 && (
          <div className="text-center mt-12">
            <button
              onClick={() => setShowAllEvents(true)}
              className="bg-black text-white font-semibold px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              See All Events ({events.length})
            </button>
          </div>
        )}

        {/* Sign Up CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-mindaro-light to-green-100 rounded-2xl p-8 md:p-12">
            <h3 className="font-bricolage text-2xl md:text-3xl lg:text-4xl font-semibold text-black mb-4">
              Ready to Find Your Match?
            </h3>
            <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
              Create your account and start your journey to meaningful connections. Join our community of singles looking for genuine relationships.
            </p>
            <Link to="/create-account">
              <button className="bg-black text-white font-semibold px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors text-lg">
                Sign Up Now
              </button>
            </Link>
          </div>
        </div>

        {/* Modal for All Events */}
        {showAllEvents && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowAllEvents(false)} />
            <div className="relative bg-white rounded-2xl shadow-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto p-8 z-10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold font-bricolage">All Upcoming Events</h2>
                <button 
                  className="text-gray-500 hover:text-gray-800 text-3xl" 
                  onClick={() => setShowAllEvents(false)}
                >
                  &times;
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <HomeEventCard
                    key={event.firestoreID}
                    event={event}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingEventsHome; 