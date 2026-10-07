import { DateTime } from 'luxon';

// Helper: map event timeZone field to IANA
const eventZoneMap = {
  'PST': 'America/Los_Angeles',
  'EST': 'America/New_York',
  'CST': 'America/Chicago',
  'MST': 'America/Denver',
  // Add more as needed
};

/**
 * Sorts events chronologically from newest to oldest
 * @param {Array} events - Array of event objects
 * @returns {Array} - Sorted array of events (newest first)
 */
export const sortEventsByDate = (events) => {
  if (!Array.isArray(events) || events.length === 0) {
    return events;
  }

  return events.sort((a, b) => {
    // Get event dates for comparison
    const dateA = getEventDateTime(a);
    const dateB = getEventDateTime(b);

    // If both dates are invalid, maintain original order
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1; // Invalid dates go to the end
    if (!dateB) return -1;

    // Sort from newest to oldest (descending order)
    return dateB - dateA;
  });
};

/**
 * Gets the event date/time as a timestamp for comparison
 * @param {Object} event - Event object
 * @returns {number|null} - Timestamp in milliseconds or null if invalid
 */
const getEventDateTime = (event) => {
  if (!event) return null;

  // First try to use Remo startTime if available
  if (event.startTime) {
    const timestamp = Number(event.startTime);
    if (!isNaN(timestamp) && timestamp > 0) {
      return timestamp;
    }
  }

  // Try to parse date and time from event object
  if (event.date && event.time) {
    const eventZone = eventZoneMap[event.timeZone] || event.timeZone || 'UTC';
    const normalizedTime = event.time.replace(/am|pm/i, match => match.toUpperCase());
    
    // Try different date/time formats
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

    if (eventDateTime.isValid) {
      return eventDateTime.toMillis();
    }
  }

  // Try to parse just the date if no time is available
  if (event.date) {
    const eventDateTime = DateTime.fromISO(event.date);
    if (eventDateTime.isValid) {
      return eventDateTime.toMillis();
    }
  }

  return null;
};

/**
 * Sorts events by date and then filters for upcoming events
 * @param {Array} events - Array of event objects
 * @param {string} userLocation - User's location for timezone calculation
 * @returns {Array} - Sorted and filtered upcoming events (newest first)
 */
export const sortAndFilterUpcomingEvents = (events, userLocation) => {
  if (!Array.isArray(events) || events.length === 0) {
    return events;
  }

  // First sort all events by date (newest first)
  const sortedEvents = sortEventsByDate(events);
  
  // Then filter for upcoming events
  const upcomingEvents = sortedEvents.filter(event => isEventUpcoming(event, userLocation));
  
  return upcomingEvents;
};

/**
 * Checks if an event is upcoming based on current time and user location
 * @param {Object} event - Event object
 * @param {string} userLocation - User's location for timezone calculation
 * @returns {boolean} - True if event is upcoming
 */
const isEventUpcoming = (event, userLocation) => {
  if (!event.date || !event.time || !event.timeZone) return false;

  // Parse event time zone
  let eventZone = eventZoneMap[event.timeZone] || event.timeZone || 'UTC';

  // Normalize time string to uppercase AM/PM
  const normalizedTime = event.time ? event.time.replace(/am|pm/i, match => match.toUpperCase()) : '';

  // Combine date and time (assume time is like '6:00pm' or '18:00')
  // Try both 12-hour and 24-hour formats
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
  if (!eventDateTime.isValid) return false;

  // Add 90 minutes for event duration
  const eventEndDateTime = eventDateTime.plus({ minutes: 90 });

  // Get user's time zone from location or fallback to browser local zone
  const cityToTimeZone = {
    'Atlanta': 'America/New_York',
    'Chicago': 'America/Chicago',
    'Dallas': 'America/Chicago',
    'Houston': 'America/Chicago',
    'Los Angeles': 'America/Los_Angeles',
    'Miami': 'America/New_York',
    'New York City': 'America/New_York',
    'San Francisco': 'America/Los_Angeles',
    'Seattle': 'America/Los_Angeles',
    'Washington D.C.': 'America/New_York',
  };
  
  const userZone = cityToTimeZone[userLocation] || DateTime.local().zoneName || 'UTC';
  const now = DateTime.now().setZone(userZone);

  // Compare event end time (converted to user's zone) with now
  return eventEndDateTime.setZone(userZone) > now;
}; 