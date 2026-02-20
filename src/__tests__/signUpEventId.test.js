/**
 * Tests for signUpForEventWithDates - latestEventId storage
 *
 * Verifies that the Sign Up flow stores the Remo event ID (not the Firebase doc ID)
 * as latestEventId, so that the connection selection logic can find the event.
 *
 * These tests should FAIL if eventSpotsUtils.js line 477 is reverted to:
 *   latestEventId: eventId
 * And should PASS with the fix:
 *   latestEventId: data.eventID || eventId
 */

// Constants
const FIREBASE_DOC_ID = 'xYz789FirebaseDocId';
const REMO_EVENT_ID = 'remo_abc123';

global.__testFirestore = {};
global.__transactionUpdates = [];

// Mock firebase/firestore - only declare jest.fn() stubs here.
// Implementations are set in beforeEach because CRA has resetMocks: true.
jest.mock('firebase/firestore', () => ({
  runTransaction: jest.fn(),
  doc: jest.fn(),
  collection: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(),
}));

jest.mock('../firebaseConfig', () => ({
  db: {},
}));

// Import after mocks
const { signUpForEventWithDates } = require('../utils/eventSpotsUtils');
const firestore = require('firebase/firestore');

describe('signUpForEventWithDates - latestEventId storage', () => {
  beforeEach(() => {
    global.__testFirestore = {};
    global.__transactionUpdates = [];

    // Re-set mock implementations (CRA's resetMocks: true wipes them before each test)
    const mockTransaction = {
      get: jest.fn(async (ref) => {
        const data = global.__testFirestore[ref._path];
        return {
          exists: () => !!data,
          data: () => data,
          id: ref._path.split('/').pop(),
        };
      }),
      set: jest.fn((ref, data) => {
        global.__testFirestore[ref._path] = { ...global.__testFirestore[ref._path], ...data };
      }),
      update: jest.fn((ref, data) => {
        global.__transactionUpdates.push({ path: ref._path, data });
        global.__testFirestore[ref._path] = { ...global.__testFirestore[ref._path], ...data };
      }),
    };

    firestore.runTransaction.mockImplementation(async (db, callback) => {
      return await callback(mockTransaction);
    });
    firestore.doc.mockImplementation((db, ...pathSegments) => ({ _path: pathSegments.join('/') }));
    firestore.collection.mockImplementation((db, ...pathSegments) => ({ _path: pathSegments.join('/') }));
    firestore.getDoc.mockImplementation(async (ref) => ({
      exists: () => !!global.__testFirestore[ref._path],
      data: () => global.__testFirestore[ref._path],
      id: ref._path.split('/').pop(),
    }));
    firestore.getDocs.mockImplementation(async (colRef) => {
      const prefix = colRef._path;
      const docs = Object.entries(global.__testFirestore)
        .filter(([path]) => path.startsWith(prefix + '/') && path.split('/').length === prefix.split('/').length + 1)
        .map(([path, data]) => ({
          id: path.split('/').pop(),
          data: () => data,
          exists: () => true,
        }));
      return { docs, forEach: (cb) => docs.forEach(cb), empty: docs.length === 0 };
    });
    firestore.setDoc.mockImplementation(async (ref, data, options) => {
      if (options?.merge) {
        global.__testFirestore[ref._path] = { ...global.__testFirestore[ref._path], ...data };
      } else {
        global.__testFirestore[ref._path] = data;
      }
    });
    firestore.updateDoc.mockImplementation(async (ref, data) => {
      global.__testFirestore[ref._path] = { ...global.__testFirestore[ref._path], ...data };
    });
    firestore.addDoc.mockImplementation(async (colRef, data) => {
      const id = 'auto_' + Math.random().toString(36).slice(2);
      global.__testFirestore[colRef._path + '/' + id] = data;
      return { id };
    });
    firestore.serverTimestamp.mockImplementation(() => 'SERVER_TIMESTAMP');
  });

  describe('when event document has an eventID field (Remo event)', () => {
    beforeEach(() => {
      global.__testFirestore[`events/${FIREBASE_DOC_ID}`] = {
        eventID: REMO_EVENT_ID,
        menSpots: 10,
        womenSpots: 10,
        menSignupCount: 0,
        womenSignupCount: 0,
      };

      global.__testFirestore['users/user1'] = {
        datesRemaining: 5,
        gender: 'Male',
      };
    });

    it('should store the Remo eventID as latestEventId, NOT the Firebase doc ID', async () => {
      const userData = {
        userName: 'Test User',
        userEmail: 'test@example.com',
        userPhoneNumber: '555-1234',
        userGender: 'male',
        userLocation: 'NYC',
      };

      await signUpForEventWithDates(FIREBASE_DOC_ID, 'user1', userData, -1);

      const userUpdate = global.__transactionUpdates.find((u) => u.path === 'users/user1');
      expect(userUpdate).toBeDefined();
      expect(userUpdate.data.latestEventId).toBe(REMO_EVENT_ID);
      expect(userUpdate.data.latestEventId).not.toBe(FIREBASE_DOC_ID);
    });

    it('should store latestEventId that matches the eventID field on the event document', async () => {
      const userData = {
        userName: 'Test User',
        userEmail: 'test@example.com',
        userPhoneNumber: '555-1234',
        userGender: 'female',
        userLocation: 'LA',
      };

      await signUpForEventWithDates(FIREBASE_DOC_ID, 'user1', userData, -1);

      const userUpdate = global.__transactionUpdates.find((u) => u.path === 'users/user1');
      const eventData = global.__testFirestore[`events/${FIREBASE_DOC_ID}`];

      expect(userUpdate).toBeDefined();
      expect(userUpdate.data.latestEventId).toBe(eventData.eventID);
    });
  });

  describe('when event document does NOT have an eventID field (fallback)', () => {
    beforeEach(() => {
      global.__testFirestore[`events/${FIREBASE_DOC_ID}`] = {
        menSpots: 10,
        womenSpots: 10,
        menSignupCount: 0,
        womenSignupCount: 0,
      };

      global.__testFirestore['users/user1'] = {
        datesRemaining: 5,
        gender: 'Male',
      };
    });

    it('should fall back to using the Firebase doc ID as latestEventId', async () => {
      const userData = {
        userName: 'Test User',
        userEmail: 'test@example.com',
        userPhoneNumber: '555-1234',
        userGender: 'male',
        userLocation: 'NYC',
      };

      await signUpForEventWithDates(FIREBASE_DOC_ID, 'user1', userData, -1);

      const userUpdate = global.__transactionUpdates.find((u) => u.path === 'users/user1');
      expect(userUpdate).toBeDefined();
      expect(userUpdate.data.latestEventId).toBe(FIREBASE_DOC_ID);
    });
  });

  describe('consistency with Join Now path', () => {
    beforeEach(() => {
      global.__testFirestore[`events/${FIREBASE_DOC_ID}`] = {
        eventID: REMO_EVENT_ID,
        menSpots: 10,
        womenSpots: 10,
        menSignupCount: 0,
        womenSignupCount: 0,
      };

      global.__testFirestore['users/user1'] = {
        datesRemaining: 5,
        gender: 'Male',
      };
    });

    it('should store the SAME latestEventId value that Join Now would store (event.eventID)', async () => {
      const userData = {
        userName: 'Test User',
        userEmail: 'test@example.com',
        userPhoneNumber: '555-1234',
        userGender: 'male',
        userLocation: 'NYC',
      };

      await signUpForEventWithDates(FIREBASE_DOC_ID, 'user1', userData, -1);

      const userUpdate = global.__transactionUpdates.find((u) => u.path === 'users/user1');
      expect(userUpdate).toBeDefined();

      const joinNowValue = REMO_EVENT_ID;
      expect(userUpdate.data.latestEventId).toBe(joinNowValue);
    });
  });

  describe('user is added to signedUpUsers subcollection', () => {
    beforeEach(() => {
      global.__testFirestore[`events/${FIREBASE_DOC_ID}`] = {
        eventID: REMO_EVENT_ID,
        menSpots: 10,
        womenSpots: 10,
        menSignupCount: 0,
        womenSignupCount: 0,
      };

      global.__testFirestore['users/user1'] = {
        datesRemaining: 5,
        gender: 'Male',
      };
    });

    it('should add the user to the signedUpUsers subcollection of the event', async () => {
      const userData = {
        userName: 'Test User',
        userEmail: 'test@example.com',
        userPhoneNumber: '555-1234',
        userGender: 'male',
        userLocation: 'NYC',
      };

      await signUpForEventWithDates(FIREBASE_DOC_ID, 'user1', userData, -1);

      const signedUpDoc = global.__testFirestore[`events/${FIREBASE_DOC_ID}/signedUpUsers/user1`];
      expect(signedUpDoc).toBeDefined();
      expect(signedUpDoc.userID).toBe('user1');
      expect(signedUpDoc.userName).toBe('Test User');
      expect(signedUpDoc.userEmail).toBe('test@example.com');
    });
  });
});
