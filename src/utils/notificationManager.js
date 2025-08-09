import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

/**
 * Notification Manager for Spark notifications
 * Handles tracking and clearing of red dot notifications for new sparks
 */

/**
 * Mark a spark as viewed/read by the current user
 * This will clear the red dot notification for that specific spark
 */
export const markSparkAsRead = async (sparkUserId) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user found');
      return false;
    }

    // Create or update the notification tracking document
    const notificationRef = doc(db, 'users', user.uid, 'notifications', 'sparks');
    const notificationDoc = await getDoc(notificationRef);

    if (notificationDoc.exists()) {
      // Update existing notifications
      const currentData = notificationDoc.data();
      const readSparks = currentData.readSparks || [];
      
      if (!readSparks.includes(sparkUserId)) {
        readSparks.push(sparkUserId);
        await updateDoc(notificationRef, {
          readSparks: readSparks,
          lastUpdated: new Date()
        });
      }
    } else {
      // Create new notification tracking
      await setDoc(notificationRef, {
        readSparks: [sparkUserId],
        lastUpdated: new Date()
      });
    }

    console.log(`✅ Marked spark ${sparkUserId} as read`);
    return true;
  } catch (error) {
    console.error('Error marking spark as read:', error);
    return false;
  }
};

/**
 * Mark a spark as viewed (when user sees it in the list)
 * This is different from markSparkAsRead - it just acknowledges the user has seen it
 */
export const markSparkAsViewed = async (sparkUserId) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user found');
      return false;
    }

    // Create or update the notification tracking document
    const notificationRef = doc(db, 'users', user.uid, 'notifications', 'sparks');
    const notificationDoc = await getDoc(notificationRef);

    if (notificationDoc.exists()) {
      // Update existing notifications
      const currentData = notificationDoc.data();
      const readSparks = currentData.readSparks || [];
      
      if (!readSparks.includes(sparkUserId)) {
        readSparks.push(sparkUserId);
        await updateDoc(notificationRef, {
          readSparks: readSparks,
          lastUpdated: new Date()
        });
      }
    } else {
      // Create new notification tracking
      await setDoc(notificationRef, {
        readSparks: [sparkUserId],
        lastUpdated: new Date()
      });
    }

    console.log(`👁️ Marked spark ${sparkUserId} as viewed`);
    return true;
  } catch (error) {
    console.error('Error marking spark as viewed:', error);
    return false;
  }
};

/**
 * Mark all sparks as read for the current user
 * This will clear all red dot notifications
 */
export const markAllSparksAsRead = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user found');
      return false;
    }

    // Get all current connections to mark them all as read
    const { collection, getDocs } = await import('firebase/firestore');
    const connectionsSnap = await getDocs(collection(db, 'users', user.uid, 'connections'));
    const connectionIds = connectionsSnap.docs.map(doc => doc.id);

    // Create or update the notification tracking document
    const notificationRef = doc(db, 'users', user.uid, 'notifications', 'sparks');
    await setDoc(notificationRef, {
      readSparks: connectionIds,
      lastUpdated: new Date()
    }, { merge: true });

    console.log('✅ Marked all sparks as read');
    return true;
  } catch (error) {
    console.error('Error marking all sparks as read:', error);
    return false;
  }
};

/**
 * Check if a spark is new (has red dot notification)
 * Returns true if the spark should show a red dot
 */
export const isSparkNew = async (sparkUserId) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return false;
    }

    // First, check if this spark has been marked as read/viewed
    const notificationRef = doc(db, 'users', user.uid, 'notifications', 'sparks');
    const notificationDoc = await getDoc(notificationRef);
    
    if (notificationDoc.exists()) {
      const readSparks = notificationDoc.data().readSparks || [];
      if (readSparks.includes(sparkUserId)) {
        // User has already viewed/acknowledged this spark - no red dot
        return false;
      }
    }

    // If not marked as read, check if user has sent any messages to this spark
    const convoId = user.uid < sparkUserId ? `${user.uid}${sparkUserId}` : `${sparkUserId}${user.uid}`;
    const convoDoc = await getDoc(doc(db, "conversations", convoId));
    
    if (!convoDoc.exists()) {
      // No conversation exists - this is a new spark that hasn't been viewed
      return true;
    }

    const messages = convoDoc.data().messages || [];
    const hasMessaged = messages.some(msg => msg.senderId === user.uid);
    
    if (!hasMessaged) {
      // Conversation exists but user hasn't sent any messages - this is a new spark that hasn't been viewed
      return true;
    }

    // User has sent messages - automatically mark as read and return false
    await markSparkAsRead(sparkUserId);
    return false;
  } catch (error) {
    console.error('Error checking if spark is new:', error);
    return false;
  }
};

/**
 * Get all new sparks for the current user
 * Returns an array of user IDs that should show red dot notifications
 */
export const getNewSparks = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return [];
    }

    const { collection, getDocs } = await import('firebase/firestore');
    const connectionsSnap = await getDocs(collection(db, 'users', user.uid, 'connections'));
    const connections = connectionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const newSparks = [];
    
    for (const connection of connections) {
      if (connection.status === 'mutual') {
        const isNew = await isSparkNew(connection.id);
        if (isNew) {
          newSparks.push(connection.id);
        }
      }
    }

    return newSparks;
  } catch (error) {
    console.error('Error getting new sparks:', error);
    return [];
  }
};

/**
 * Check if user has any new sparks (for sidebar notification)
 * Returns true if there are any new sparks
 */
export const hasNewSparks = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('🔍 hasNewSparks: No authenticated user');
      return false;
    }

    console.log('🔍 hasNewSparks: Starting check...');
    const { collection, getDocs } = await import('firebase/firestore');
    const connectionsSnap = await getDocs(collection(db, 'users', user.uid, 'connections'));
    const connections = connectionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(`🔍 hasNewSparks: Found ${connections.length} total connections`);

    // Check if any mutual connections still have red dots
    for (const connection of connections) {
      if (connection.status === 'mutual') {
        console.log(`🔍 hasNewSparks: Checking mutual connection ${connection.id}...`);
        const isNew = await isSparkNew(connection.id);
        console.log(`🔍 hasNewSparks: Connection ${connection.id} isNew: ${isNew}`);
        if (isNew) {
          console.log(`🔍 hasNewSparks: Found new spark ${connection.id}, returning true`);
          return true; // Found at least one spark with red dot
        }
      }
    }

    console.log('🔍 hasNewSparks: No new sparks found, returning false');
    return false; // No sparks have red dots
  } catch (error) {
    console.error('Error checking for new sparks:', error);
    return false;
  }
}; 

/**
 * Force refresh the sidebar notification state
 * This ensures the sidebar red dot is properly updated
 */
export const refreshSidebarNotification = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('🔄 No authenticated user found for sidebar refresh');
      return false;
    }

    console.log('🔄 Starting sidebar notification refresh...');
    const hasNew = await hasNewSparks();
    console.log(`🔄 Sidebar refresh result: ${hasNew ? 'has new sparks' : 'no new sparks'}`);
    
    // Dispatch a custom event to notify sidebar
    const event = new CustomEvent('sparkNotificationUpdate', { 
      detail: { hasNewSparks: hasNew } 
    });
    window.dispatchEvent(event);
    console.log('🔄 Dispatched sparkNotificationUpdate event to sidebar');
    
    return hasNew;
  } catch (error) {
    console.error('Error refreshing sidebar notification:', error);
    return false;
  }
}; 