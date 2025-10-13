import { collection, getDocs, doc, getDoc, runTransaction, updateDoc } from 'firebase/firestore';
import { db } from '../pages/firebaseConfig';

// Debug utility for consistent logging
const debug = {
  log: (functionName, message, data = null) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 [${functionName}] ${message}`, data || '');
    }
  },
  warn: (functionName, message, data = null) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ [${functionName}] ${message}`, data || '');
    }
  },
  error: (functionName, message, data = null) => {
    console.error(`❌ [${functionName}] ${message}`, data || '');
  },
  success: (functionName, message, data = null) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ [${functionName}] ${message}`, data || '');
    }
  }
};

// Calculate actual counts from signedUpUsers subcollection
export const calculateActualCounts = async (eventId) => {
  debug.log('calculateActualCounts', `Starting calculation for eventId: ${eventId}`);
  
  try {
    const signedUpUsersRef = collection(db, 'events', eventId, 'signedUpUsers');
    debug.log('calculateActualCounts', 'Fetching signedUpUsers subcollection...');
    
    const snapshot = await getDocs(signedUpUsersRef);
    debug.log('calculateActualCounts', `Found ${snapshot.docs.length} signed up users`);
    
    const users = snapshot.docs.map(doc => doc.data());
    debug.log('calculateActualCounts', 'User data:', users.map(u => ({ 
      id: u.userID, 
      gender: u.userGender, 
      name: u.userName 
    })));
    
    const menCount = users.filter(user => user.userGender?.toLowerCase() === 'male').length;
    const womenCount = users.filter(user => user.userGender?.toLowerCase() === 'female').length;
    
    debug.log('calculateActualCounts', 'Calculated counts:', { menCount, womenCount });
    debug.success('calculateActualCounts', 'Successfully calculated actual counts');
    
    return { menCount, womenCount };
  } catch (error) {
    debug.error('calculateActualCounts', 'Error calculating actual counts:', error);
    return { menCount: 0, womenCount: 0 };
  }
};

// Reconcile stored counts with actual counts
export const reconcileCounts = async (eventId, actualCounts) => {
  debug.log('reconcileCounts', `Starting reconciliation for eventId: ${eventId}`);
  debug.log('reconcileCounts', 'Actual counts to apply:', actualCounts);
  
  try {
    const eventRef = doc(db, 'events', eventId);
    debug.log('reconcileCounts', 'Updating event document with new counts...');
    
    await updateDoc(eventRef, {
      menSignupCount: actualCounts.menCount,
      womenSignupCount: actualCounts.womenCount
    });
    
    debug.success('reconcileCounts', `Successfully reconciled counts for event: ${eventId}`);
    debug.success('reconcileCounts', 'Updated counts:', actualCounts);
  } catch (error) {
    debug.error('reconcileCounts', 'Failed to reconcile counts:', error);
    debug.error('reconcileCounts', `EventId: ${eventId}, ActualCounts:`, actualCounts);
  }
};

// Get event spots with validation (hybrid approach)
export const getEventSpots = async (eventId) => {
  debug.log('getEventSpots', `Starting spot calculation for eventId: ${eventId}`);
  
  try {
    const eventDoc = await getDoc(doc(db, 'events', eventId));
    if (!eventDoc.exists()) {
      debug.warn('getEventSpots', `Event document does not exist for eventId: ${eventId}`);
      return { menCount: 0, womenCount: 0, menSpots: 0, womenSpots: 0 };
    }
    
    const data = eventDoc.data();
    const menCount = data.menSignupCount || 0;
    const womenCount = data.womenSignupCount || 0;
    const menSpots = data.menSpots || 0;
    const womenSpots = data.womenSpots || 0;
    
    debug.log('getEventSpots', 'Stored counts from event document:', {
      menCount,
      womenCount,
      menSpots,
      womenSpots
    });
    
    // Always validate counts to ensure accuracy
    debug.log('getEventSpots', 'Running validation check...');
    const actualCounts = await calculateActualCounts(eventId);
    
    const hasMismatch = actualCounts.menCount !== menCount || actualCounts.womenCount !== womenCount;
    debug.log('getEventSpots', 'Count comparison:', {
      stored: { menCount, womenCount },
      actual: actualCounts,
      hasMismatch
    });
    
    if (hasMismatch) {
      debug.warn('getEventSpots', 'Count mismatch detected, reconciling...', {
        eventId,
        stored: { menCount, womenCount },
        actual: actualCounts
      });
      await reconcileCounts(eventId, actualCounts);
      debug.success('getEventSpots', 'Reconciliation complete, returning actual counts');
      return { ...actualCounts, menSpots, womenSpots };
    } else {
      debug.success('getEventSpots', 'Counts match, no reconciliation needed');
    }
    
    debug.success('getEventSpots', `Returning stored counts for eventId: ${eventId}`);
    return { menCount, womenCount, menSpots, womenSpots };
  } catch (error) {
    debug.error('getEventSpots', 'Error getting event spots:', error);
    debug.error('getEventSpots', `EventId: ${eventId}`);
    return { menCount: 0, womenCount: 0, menSpots: 0, womenSpots: 0 };
  }
};

// Transaction-based signup with validation
export const signUpForEvent = async (eventId, userId, userData) => {
  debug.log('signUpForEvent', 'Starting transaction-based signup');
  debug.log('signUpForEvent', `EventId: ${eventId}, UserId: ${userId}`);
  debug.log('signUpForEvent', 'User data:', {
    userName: userData.userName,
    userEmail: userData.userEmail,
    userGender: userData.userGender,
    userLocation: userData.userLocation
  });
  
  return await runTransaction(db, async (transaction) => {
    debug.log('signUpForEvent', 'Transaction started');
    
    const eventRef = doc(db, 'events', eventId);
    const eventDoc = await transaction.get(eventRef);
    
    if (!eventDoc.exists()) {
      debug.error('signUpForEvent', `Event not found for eventId: ${eventId}`);
      throw new Error('Event not found');
    }
    
    const data = eventDoc.data();
    const userGender = userData.userGender?.toLowerCase();
    const currentMenCount = data.menSignupCount || 0;
    const currentWomenCount = data.womenSignupCount || 0;
    const maxMenSpots = data.menSpots || 0;
    const maxWomenSpots = data.womenSpots || 0;
    
    debug.log('signUpForEvent', 'Current event data:', {
      currentMenCount,
      currentWomenCount,
      maxMenSpots,
      maxWomenSpots,
      userGender
    });
    
    // Check capacity
    if (userGender === 'male' && currentMenCount >= maxMenSpots) {
      debug.error('signUpForEvent', 'Event is full for men');
      throw new Error('Event is full for men');
    }
    if (userGender === 'female' && currentWomenCount >= maxWomenSpots) {
      debug.error('signUpForEvent', 'Event is full for women');
      throw new Error('Event is full for women');
    }
    
    // Update counts
    const updateData = {};
    if (userGender === 'male') {
      updateData.menSignupCount = currentMenCount + 1;
      debug.log('signUpForEvent', `Updating men count: ${currentMenCount} → ${updateData.menSignupCount}`);
    } else if (userGender === 'female') {
      updateData.womenSignupCount = currentWomenCount + 1;
      debug.log('signUpForEvent', `Updating women count: ${currentWomenCount} → ${updateData.womenSignupCount}`);
    } else {
      debug.warn('signUpForEvent', `Unknown gender: ${userGender}`);
    }
    
    debug.log('signUpForEvent', 'Updating event document with:', updateData);
    transaction.update(eventRef, updateData);
    
    // Add user to subcollection
    const userRef = doc(db, 'events', eventId, 'signedUpUsers', userId);
    const userDocData = {
      userID: userId,
      userName: userData.userName,
      userEmail: userData.userEmail,
      userPhoneNumber: userData.userPhoneNumber,
      userGender: userData.userGender,
      userLocation: userData.userLocation,
      signUpTime: new Date(),
    };
    
    debug.log('signUpForEvent', 'Adding user to subcollection:', userDocData);
    transaction.set(userRef, userDocData);
    
    debug.success('signUpForEvent', 'Transaction completed successfully');
    return { success: true, updatedCounts: updateData };
  });
};

// Transaction-based signout
export const signOutFromEvent = async (eventId, userId, userGender) => {
  debug.log('signOutFromEvent', 'Starting transaction-based signout');
  debug.log('signOutFromEvent', `EventId: ${eventId}, UserId: ${userId}, UserGender: ${userGender}`);
  
  return await runTransaction(db, async (transaction) => {
    debug.log('signOutFromEvent', 'Transaction started');
    
    const eventRef = doc(db, 'events', eventId);
    const eventDoc = await transaction.get(eventRef);
    
    if (!eventDoc.exists()) {
      debug.error('signOutFromEvent', `Event not found for eventId: ${eventId}`);
      throw new Error('Event not found');
    }
    
    const data = eventDoc.data();
    const currentMenCount = data.menSignupCount || 0;
    const currentWomenCount = data.womenSignupCount || 0;
    
    debug.log('signOutFromEvent', 'Current event data:', {
      currentMenCount,
      currentWomenCount,
      userGender
    });
    
    // Update counts
    const updateData = {};
    if (userGender === 'male') {
      updateData.menSignupCount = Math.max(currentMenCount - 1, 0);
      debug.log('signOutFromEvent', `Updating men count: ${currentMenCount} → ${updateData.menSignupCount}`);
    } else if (userGender === 'female') {
      updateData.womenSignupCount = Math.max(currentWomenCount - 1, 0);
      debug.log('signOutFromEvent', `Updating women count: ${currentWomenCount} → ${updateData.womenSignupCount}`);
    } else {
      debug.warn('signOutFromEvent', `Unknown gender: ${userGender}`);
    }
    
    debug.log('signOutFromEvent', 'Updating event document with:', updateData);
    transaction.update(eventRef, updateData);
    
    // Remove user from subcollection
    const userRef = doc(db, 'events', eventId, 'signedUpUsers', userId);
    debug.log('signOutFromEvent', 'Removing user from subcollection');
    transaction.delete(userRef);
    
    debug.success('signOutFromEvent', 'Transaction completed successfully');
    return { success: true, updatedCounts: updateData };
  });
};

// Transaction-based dates remaining update
export const updateDatesRemaining = async (userId, changeAmount, reason = '') => {
  debug.log('updateDatesRemaining', `Starting transaction-based dates update`);
  debug.log('updateDatesRemaining', `UserId: ${userId}, Change: ${changeAmount}, Reason: ${reason}`);
  
  return await runTransaction(db, async (transaction) => {
    debug.log('updateDatesRemaining', 'Transaction started');
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await transaction.get(userRef);
    
    if (!userDoc.exists()) {
      debug.error('updateDatesRemaining', `User not found for userId: ${userId}`);
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const currentDatesRemaining = userData.datesRemaining || 0;
    const newDatesRemaining = Math.max(currentDatesRemaining + changeAmount, 0);
    
    debug.log('updateDatesRemaining', 'Current user data:', {
      currentDatesRemaining,
      changeAmount,
      newDatesRemaining,
      reason
    });
    
    // Update dates remaining
    transaction.update(userRef, {
      datesRemaining: newDatesRemaining
    });
    
    debug.success('updateDatesRemaining', `Successfully updated dates remaining: ${currentDatesRemaining} → ${newDatesRemaining}`);
    return { 
      success: true, 
      previousDates: currentDatesRemaining,
      newDates: newDatesRemaining,
      changeAmount,
      reason
    };
  });
};

// Transaction-based date purchase with payment verification
export const processDatePurchase = async (userId, cartItems, paymentIntentId, totalAmount) => {
  debug.log('processDatePurchase', `Starting transaction-based date purchase`);
  debug.log('processDatePurchase', `UserId: ${userId}, CartItems: ${cartItems.length}, PaymentIntent: ${paymentIntentId}`);
  
  return await runTransaction(db, async (transaction) => {
    debug.log('processDatePurchase', 'Transaction started');
    
    // 1. READ: Get user document
    const userRef = doc(db, 'users', userId);
    const userDoc = await transaction.get(userRef);
    
    if (!userDoc.exists()) {
      debug.error('processDatePurchase', `User not found for userId: ${userId}`);
      throw new Error('User not found');
    }
    
    // 2. PROCESS: Calculate total dates purchased
    const totalDatesPurchased = cartItems.reduce((total, item) => {
      const itemDates = item.quantity * (item.numDates || 1);
      debug.log('processDatePurchase', `Item: ${item.title}, Quantity: ${item.quantity}, Dates: ${item.numDates || 1}, Total: ${itemDates}`);
      return total + itemDates;
    }, 0);
    
    debug.log('processDatePurchase', `Total dates to be added: ${totalDatesPurchased}`);
    
    // 3. READ: Get current dates remaining
    const userData = userDoc.data();
    const currentDatesRemaining = userData.datesRemaining || 0;
    const newDatesRemaining = currentDatesRemaining + totalDatesPurchased;
    
    debug.log('processDatePurchase', 'User dates data:', {
      currentDatesRemaining,
      totalDatesPurchased,
      newDatesRemaining
    });
    
    // 4. WRITE: Update user document with new dates remaining
    transaction.update(userRef, {
      datesRemaining: newDatesRemaining,
      lastPurchaseDate: new Date(),
      totalPurchases: (userData.totalPurchases || 0) + 1
    });
    
    // 5. WRITE: Create purchase record in user's purchases subcollection
    const purchaseRef = doc(collection(db, 'users', userId, 'purchases'));
    const purchaseData = {
      purchaseId: purchaseRef.id,
      paymentIntentId: paymentIntentId,
      totalAmount: totalAmount,
      totalDatesPurchased: totalDatesPurchased,
      cartItems: cartItems,
      purchaseDate: new Date(),
      status: 'completed'
    };
    
    transaction.set(purchaseRef, purchaseData);
    
    debug.success('processDatePurchase', `Successfully processed date purchase: ${currentDatesRemaining} → ${newDatesRemaining}`);
    return { 
      success: true, 
      previousDates: currentDatesRemaining,
      newDates: newDatesRemaining,
      totalDatesPurchased,
      purchaseId: purchaseRef.id,
      reason: 'Date purchase completed'
    };
  });
};

// Combined transaction for signup with dates update
export const signUpForEventWithDates = async (eventId, userId, userData, datesChange = -1) => {
  debug.log('signUpForEventWithDates', 'Starting combined transaction');
  debug.log('signUpForEventWithDates', `EventId: ${eventId}, UserId: ${userId}, DatesChange: ${datesChange}`);
  
  return await runTransaction(db, async (transaction) => {
    debug.log('signUpForEventWithDates', 'Combined transaction started');
    
    // 1. READ: Get event document
    const eventRef = doc(db, 'events', eventId);
    const eventDoc = await transaction.get(eventRef);
    
    if (!eventDoc.exists()) {
      debug.error('signUpForEventWithDates', `Event not found for eventId: ${eventId}`);
      throw new Error('Event not found');
    }
    
    // 2. READ: Get user document
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await transaction.get(userDocRef);
    
    if (!userDoc.exists()) {
      debug.error('signUpForEventWithDates', `User not found for userId: ${userId}`);
      throw new Error('User not found');
    }
    
    // 3. PROCESS: Calculate all updates
    const data = eventDoc.data();
    const userGender = userData.userGender?.toLowerCase();
    const currentMenCount = data.menSignupCount || 0;
    const currentWomenCount = data.womenSignupCount || 0;
    const maxMenSpots = data.menSpots || 0;
    const maxWomenSpots = data.womenSpots || 0;
    
    debug.log('signUpForEventWithDates', 'Event data:', {
      currentMenCount,
      currentWomenCount,
      maxMenSpots,
      maxWomenSpots,
      userGender
    });
    
    // Check capacity
    if (userGender === 'male' && currentMenCount >= maxMenSpots) {
      debug.error('signUpForEventWithDates', 'Event is full for men');
      throw new Error('Event is full for men');
    }
    if (userGender === 'female' && currentWomenCount >= maxWomenSpots) {
      debug.error('signUpForEventWithDates', 'Event is full for women');
      throw new Error('Event is full for women');
    }
    
    // Calculate event updates
    const eventUpdateData = {};
    if (userGender === 'male') {
      eventUpdateData.menSignupCount = currentMenCount + 1;
      debug.log('signUpForEventWithDates', `Updating men count: ${currentMenCount} → ${eventUpdateData.menSignupCount}`);
    } else if (userGender === 'female') {
      eventUpdateData.womenSignupCount = currentWomenCount + 1;
      debug.log('signUpForEventWithDates', `Updating women count: ${currentWomenCount} → ${eventUpdateData.womenSignupCount}`);
    }
    
    // Calculate user updates
    const userData2 = userDoc.data();
    const currentDatesRemaining = userData2.datesRemaining || 0;
    const newDatesRemaining = Math.max(currentDatesRemaining + datesChange, 0);
    
    debug.log('signUpForEventWithDates', 'User dates data:', {
      currentDatesRemaining,
      datesChange,
      newDatesRemaining
    });
    
    // 4. WRITE: All writes happen after all reads
    // Update event document
    transaction.update(eventRef, eventUpdateData);
    
    // Add user to event subcollection
    const userRef = doc(db, 'events', eventId, 'signedUpUsers', userId);
    const userDocData = {
      userID: userId,
      userName: userData.userName,
      userEmail: userData.userEmail,
      userPhoneNumber: userData.userPhoneNumber,
      userGender: userData.userGender,
      userLocation: userData.userLocation,
      signUpTime: new Date(),
    };
    
    transaction.set(userRef, userDocData);
    
    // Update user document
    transaction.update(userDocRef, {
      datesRemaining: newDatesRemaining,
      latestEventId: eventId
    });
    
    debug.success('signUpForEventWithDates', 'Combined transaction completed successfully');
    return { 
      success: true, 
      updatedCounts: eventUpdateData,
      previousDates: currentDatesRemaining,
      newDates: newDatesRemaining
    };
  });
};

// Clear latestEventId if the event being removed is the user's latest event
export const clearLatestEventIdIfNeeded = async (userId, eventId) => {
  debug.log('clearLatestEventIdIfNeeded', `Checking if event ${eventId} is latest for user ${userId}`);
  
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      debug.warn('clearLatestEventIdIfNeeded', `User document does not exist for userId: ${userId}`);
      return;
    }
    
    const userData = userDoc.data();
    const latestEventId = userData.latestEventId;
    
    // Check if the eventId matches the latestEventId directly (Firebase event ID)
    if (latestEventId === eventId) {
      debug.log('clearLatestEventIdIfNeeded', `Event ${eventId} is the latest event for user ${userId}, clearing latestEventId`);
      
      await updateDoc(userRef, {
        latestEventId: null
      });
      
      debug.success('clearLatestEventIdIfNeeded', `Successfully cleared latestEventId for user ${userId}`);
      return;
    }
    
    // If not a direct match, check if the eventId is a Firebase event ID that corresponds to a Remo event
    // We need to find the event document and check if its eventID field matches the latestEventId
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);
      
      if (eventDoc.exists()) {
        const eventData = eventDoc.data();
        const remoEventId = eventData.eventID;
        
        if (remoEventId && remoEventId === latestEventId) {
          debug.log('clearLatestEventIdIfNeeded', `Event ${eventId} (Remo ID: ${remoEventId}) is the latest event for user ${userId}, clearing latestEventId`);
          
          await updateDoc(userRef, {
            latestEventId: null
          });
          
          debug.success('clearLatestEventIdIfNeeded', `Successfully cleared latestEventId for user ${userId}`);
          return;
        }
      }
    } catch (error) {
      debug.warn('clearLatestEventIdIfNeeded', `Could not check event document for eventId ${eventId}:`, error.message);
    }
    
    debug.log('clearLatestEventIdIfNeeded', `Event ${eventId} is not the latest event for user ${userId} (latest is: ${latestEventId})`);
  } catch (error) {
    debug.error('clearLatestEventIdIfNeeded', `Error clearing latestEventId for user ${userId}:`, error);
  }
};
