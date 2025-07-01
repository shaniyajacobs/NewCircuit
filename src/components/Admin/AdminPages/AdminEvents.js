import React, { useState, useEffect } from 'react';
import { db } from '../../../pages/firebaseConfig';
import { collection, getDocs, deleteDoc, doc, addDoc, updateDoc } from 'firebase/firestore';
import { FaSearch, FaTrash, FaPlus, FaEdit } from 'react-icons/fa';

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    location: '',
    time: '',
    timeZone: '',
    menSpots: '',
    womenSpots: '',
    ageRange: '',
    eventType: '',
    eventID: ''
  });

  const LOCATION_OPTIONS = [
    'Atlanta',
    'Chicago',
    'Dallas',
    'Houston',
    'Los Angeles',
    'Miami',
    'New York City',
    'San Francisco',
    'Seattle',
    'Washington D.C.'
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const eventsList = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(eventsList);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = (event) => {
    setSelectedEvent(event);
    setShowDeleteModal(true);
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setShowEditModal(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'events', selectedEvent.id));
      setEvents(events.filter(evt => evt.id !== selectedEvent.id));
      setShowDeleteModal(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'events'), { ...newEvent, menSignupCount: 0, womenSignupCount: 0 });
      setShowAddModal(false);
      setNewEvent({ title: '', date: '', location: '', time: '', timeZone: '', menSpots: '', womenSpots: '', ageRange: '', eventType: '', eventID: '' });
      fetchEvents();
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'events', selectedEvent.id), selectedEvent);
      setShowEditModal(false);
      fetchEvents();
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const filteredEvents = events.filter(evt =>
    evt.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-7 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Events Management</h1>
        <div className="flex gap-4 items-center">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#0043F1] text-white rounded-xl hover:bg-[#0034BD] transition-colors"
          >
            <FaPlus />
            Create New Event
          </button>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
        <table className="min-w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Zone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Men</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Women</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age Range</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="4" className="text-center py-4">Loading...</td>
              </tr>
            ) : filteredEvents.map(evt => (
              <tr key={evt.id}>
                <td className="px-6 py-4 whitespace-nowrap">{evt.title}</td>
                <td className="px-6 py-4 whitespace-nowrap">{evt.date}</td>
                <td className="px-6 py-4 whitespace-nowrap">{evt.time}</td>
                <td className="px-6 py-4 whitespace-nowrap">{evt.timeZone}</td>
                <td className="px-6 py-4 whitespace-nowrap">{evt.location}</td>
                <td className="px-6 py-4 whitespace-nowrap">{(evt.menSignupCount ?? 0)} / {evt.menSpots}</td>
                <td className="px-6 py-4 whitespace-nowrap">{(evt.womenSignupCount ?? 0)} / {evt.womenSpots}</td>
                <td className="px-6 py-4 whitespace-nowrap">{evt.eventType}</td>
                <td className="px-6 py-4 whitespace-nowrap">{evt.ageRange}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleEditEvent(evt)}
                    className="text-yellow-600 hover:text-yellow-900 mr-3"
                    title="Edit Event"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(evt)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete Event"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-semibold mb-4">Delete Event</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {selectedEvent?.title}? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-semibold mb-4">Add New Event</h2>
            <form onSubmit={handleAddEvent} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Event Title</label>
                <input
                  type="text"
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Location</label>
                <select
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none"
                  value={newEvent.location}
                  onChange={(e)=>setNewEvent({...newEvent, location:e.target.value})}
                  required
                >
                  <option value="" disabled>Select location</option>
                  {LOCATION_OPTIONS.map(loc => (<option key={loc} value={loc}>{loc}</option>))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-sm font-medium text-gray-700">Time (e.g., 7:00 PM)</label>
                  <input
                    type="text"
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none w-full"
                    value={newEvent.time}
                    onChange={(e)=>setNewEvent({...newEvent, time:e.target.value})}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-sm font-medium text-gray-700">Time Zone</label>
                  <input
                    type="text"
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none w-full"
                    value={newEvent.timeZone}
                    onChange={(e)=>setNewEvent({...newEvent, timeZone:e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-sm font-medium text-gray-700">Men Spots</label>
                  <input
                    type="number"
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none w-full"
                    value={newEvent.menSpots}
                    onChange={(e) => setNewEvent({ ...newEvent, menSpots: e.target.value })}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-sm font-medium text-gray-700">Women Spots</label>
                  <input
                    type="number"
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none w-full"
                    value={newEvent.womenSpots}
                    onChange={(e) => setNewEvent({ ...newEvent, womenSpots: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Age Range (e.g., 25-35)</label>
                <input
                  type="text"
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none"
                  value={newEvent.ageRange}
                  onChange={(e) => setNewEvent({ ...newEvent, ageRange: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Event Type</label>
                <select
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none"
                  value={newEvent.eventType}
                  onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value })}
                  required
                >
                  <option value="" disabled>Select type</option>
                  {['Brunch','Happy Hour','Dinner'].map(t=>(<option key={t} value={t}>{t}</option>))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Event ID</label>
                <input
                  type="text"
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none"
                  value={newEvent.eventID}
                  onChange={(e) => setNewEvent({ ...newEvent, eventID: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end gap-4 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0043F1] text-white rounded-lg hover:bg-[#0034BD] transition-colors"
                >
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-semibold mb-4">Edit Event</h2>
            <form onSubmit={handleUpdateEvent} className="flex flex-col gap-4">
              {/* Event Title */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Event Title</label>
                <input
                  type="text"
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none"
                  value={selectedEvent.title}
                  onChange={(e)=>setSelectedEvent({...selectedEvent,title:e.target.value})}
                  required
                />
              </div>

              {/* Location before Date */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Location</label>
                <select
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none"
                  value={selectedEvent.location}
                  onChange={(e)=>setSelectedEvent({...selectedEvent,location:e.target.value})}
                  required
                >
                  {LOCATION_OPTIONS.map(loc=>(<option key={loc} value={loc}>{loc}</option>))}
                </select>
              </div>

              {/* Date */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none"
                  value={selectedEvent.date}
                  onChange={(e)=>setSelectedEvent({...selectedEvent,date:e.target.value})}
                  required
                />
              </div>

              {/* Time & TimeZone Row */}
              <div className="flex gap-4">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-sm font-medium text-gray-700">Time (e.g., 7:00 PM)</label>
                  <input
                    type="text"
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none w-full"
                    value={selectedEvent.time}
                    onChange={(e)=>setSelectedEvent({...selectedEvent,time:e.target.value})}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-sm font-medium text-gray-700">Time Zone</label>
                  <input
                    type="text"
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none w-full"
                    value={selectedEvent.timeZone}
                    onChange={(e)=>setSelectedEvent({...selectedEvent,timeZone:e.target.value})}
                    required
                  />
                </div>
              </div>

              {/* Men & Women Spots Row */}
              <div className="flex gap-4">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-sm font-medium text-gray-700">Men Spots</label>
                  <input
                    type="number"
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none w-full"
                    value={selectedEvent.menSpots}
                    onChange={(e)=>setSelectedEvent({...selectedEvent, menSpots:e.target.value})}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-sm font-medium text-gray-700">Women Spots</label>
                  <input
                    type="number"
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none w-full"
                    value={selectedEvent.womenSpots}
                    onChange={(e)=>setSelectedEvent({...selectedEvent, womenSpots:e.target.value})}
                    required
                  />
                </div>
              </div>

              {/* Age Range */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Age Range</label>
                <input
                  type="text"
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none"
                  value={selectedEvent.ageRange}
                  onChange={(e)=>setSelectedEvent({...selectedEvent,ageRange:e.target.value})}
                  required
                />
              </div>

              {/* Event Type */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Event Type</label>
                <select
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none"
                  value={selectedEvent.eventType}
                  onChange={(e)=>setSelectedEvent({...selectedEvent,eventType:e.target.value})}
                  required
                >
                  {['Brunch','Happy Hour','Dinner'].map(t=>(<option key={t} value={t}>{t}</option>))}
                </select>
              </div>

              {/* Event ID */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Event ID</label>
                <input
                  type="text"
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none"
                  value={selectedEvent.eventID}
                  onChange={(e)=>setSelectedEvent({...selectedEvent,eventID:e.target.value})}
                  required
                />
              </div>


              <div className="flex justify-end gap-4 mt-4">
                <button type="button" className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" onClick={()=>setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#0043F1] text-white rounded-lg hover:bg-[#0034BD] transition-colors">Update Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvents; 