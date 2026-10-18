import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch initial notifications
  const fetchNotifications = async () => {
    try {
      const q = query(
        collection(db, 'adminNotifications'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore Timestamp to JS Date for display
        createdAt: doc.data().createdAt?.toDate?.() || null,
      }));
      setNotifications(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
      setLoading(false);
    }
  };

  // Mark a single notification as read
  const markAsRead = async (id) => {
    try {
      await updateDoc(doc(db, 'adminNotifications', id), {
        read: true,
        readAt: new Date(),
      });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      for (const n of unread) {
        await updateDoc(doc(db, 'adminNotifications', n.id), {
          read: true,
          readAt: new Date(),
        });
      }
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Real‑time listener for new notifications (only if the component is mounted)
  useEffect(() => {
    fetchNotifications();

    // Set up real‑time listener
    const q = query(
      collection(db, 'adminNotifications'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const notif = {
            id: change.doc.id,
            ...change.doc.data(),
            createdAt: change.doc.data().createdAt?.toDate?.() || null,
          };
          setNotifications(prev => {
            // Replace or add
            const index = prev.findIndex(n => n.id === notif.id);
            if (index !== -1) {
              const newArr = [...prev];
              newArr[index] = notif;
              return newArr;
            }
            return [notif, ...prev];
          });
        }
      });
    }, (err) => {
      console.error('Real-time listener error:', err);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="p-4 text-gray-600">Loading notifications…</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          Notifications
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
              {unreadCount} new
            </span>
          )}
        </h2>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="max-h-[70vh] overflow-y-auto space-y-2">
        {notifications.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No notifications yet.</p>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-3 border rounded-lg transition-colors cursor-pointer ${
                notif.read
                  ? 'bg-gray-50 border-gray-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
              onClick={() => !notif.read && markAsRead(notif.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${notif.read ? 'text-gray-700' : 'text-blue-700'}`}>
                      {notif.message}
                    </span>
                    {!notif.read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full inline-block" />
                    )}
                  </div>
                  {notif.data && (
                    <div className="mt-1 text-xs text-gray-500 space-y-0.5">
                      {notif.data.cancelledUserName && (
                        <div>👤 Cancelled: {notif.data.cancelledUserName}</div>
                      )}
                      {notif.data.promotedEmail && (
                        <div>📧 Promoted: {notif.data.promotedEmail}</div>
                      )}
                      {notif.data.expiredEmail && (
                        <div>⏰ Expired: {notif.data.expiredEmail}</div>
                      )}
                      {notif.data.hoursUntilEvent !== undefined && (
                        <div>⏱️ Hours until event: {notif.data.hoursUntilEvent}</div>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                  {notif.createdAt
                    ? new Date(notif.createdAt).toLocaleString()
                    : 'Just now'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;