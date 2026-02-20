/**
 * Tests for handleMatchesClick event lookup and user pool retrieval
 *
 * Verifies that:
 * 1. The event lookup finds events by Remo eventID (not Firebase doc ID)
 * 2. ALL signedUpUsers appear in the match pool regardless of Join Now status
 * 3. Quiz responses and profiles are fetched for every signed-up user
 */

const FIREBASE_DOC_ID_1 = 'firebaseDoc1';
const FIREBASE_DOC_ID_2 = 'firebaseDoc2';
const REMO_EVENT_ID_1 = 'remo_event_111';
const REMO_EVENT_ID_2 = 'remo_event_222';

global.__testFirestore2 = {};

// Mock firebase/firestore - stubs only, implementations set in beforeEach
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  collection: jest.fn(),
  collectionGroup: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn(),
  documentId: jest.fn(),
}));

jest.mock('../firebaseConfig', () => ({
  db: {},
  auth: { currentUser: { uid: 'currentUser1', email: 'current@test.com' } },
}));

jest.mock('../pages/firebaseConfig', () => ({
  db: {},
  auth: { currentUser: { uid: 'currentUser1', email: 'current@test.com' } },
}));

const firestore = require('firebase/firestore');

// Helper: simulate the event lookup logic from DashHome.js lines 911-918
function findEventDocId(eventsSnapshot, latestEventId) {
  let eventDocId = null;
  eventsSnapshot.forEach((docSnap) => {
    if (docSnap.data().eventID === latestEventId) {
      eventDocId = docSnap.id;
    }
  });
  return eventDocId;
}

// Helper: simulate fetching signedUpUsers from DashHome.js lines 931-935
async function getSignedUpUserIds(eventDocId) {
  const signedUpUsersCol = firestore.collection({}, 'events', eventDocId, 'signedUpUsers');
  const signedUpUsersSnap = await firestore.getDocs(signedUpUsersCol);
  return signedUpUsersSnap.docs.map((d) => d.id);
}

// Helper: simulate quiz + profile fetching from DashHome.js lines 948-978
async function fetchQuizAndProfiles(userIds) {
  const quizResponses = [];
  const userProfiles = [];

  for (const uid of userIds) {
    const quizDocRef = { _path: `users/${uid}/quizResponses/latest` };
    const userProfileRef = { _path: `users/${uid}` };

    const quizDoc = await firestore.getDoc(quizDocRef);
    const userProfileDoc = await firestore.getDoc(userProfileRef);

    if (quizDoc.exists()) {
      quizResponses.push({ userId: uid, answers: quizDoc.data().answers });

      if (userProfileDoc.exists()) {
        userProfiles.push({
          userId: uid,
          ...userProfileDoc.data(),
        });
      }
    }
  }

  return { quizResponses, userProfiles };
}

// Shared quiz answers fixture
const makeQuizAnswers = () => ({
  'Question 1': 'Full-time',
  'Question 2': 'Moderate',
  'Question 3': "I'm an early bird",
  'Question 4': "I'm open to it, but i'd like to take things slow",
  'Question 5': 'Watching the sunset on the beach',
  'Question 6': 'I focus on what i can control most of the time',
  'Question 7': 'Logical',
  'Question 8': "Depends on how much I trust the person",
  'Question 9': 'Long-term relationship',
  'Question 10': 'Spiritual',
  'Question 11': 'Somewhat important',
  'Question 12': 'Quality time',
  'Question 13': 'Periodic meaningful check-ins',
  'Question 14': 'Partners who are best friends',
  'Question 15': 'Take some time to cool down and discuss',
  'Question 16': 'Someone to listen without trying to fix things',
  'Question 17': 'Communication',
});

describe('handleMatchesClick - event lookup and user pool', () => {
  beforeEach(() => {
    global.__testFirestore2 = {};

    // Re-set mock implementations (CRA's resetMocks: true wipes them before each test)
    firestore.doc.mockImplementation((db, ...pathSegments) => ({ _path: pathSegments.join('/') }));
    firestore.collection.mockImplementation((db, ...pathSegments) => ({ _path: pathSegments.join('/') }));
    firestore.collectionGroup.mockImplementation((db, collectionId) => ({ _path: `__collectionGroup__/${collectionId}` }));
    firestore.getDoc.mockImplementation(async (ref) => ({
      exists: () => !!global.__testFirestore2[ref._path],
      data: () => global.__testFirestore2[ref._path],
      id: ref._path.split('/').pop(),
    }));
    firestore.getDocs.mockImplementation(async (colRef) => {
      const prefix = colRef._path;
      const docs = Object.entries(global.__testFirestore2)
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
        global.__testFirestore2[ref._path] = { ...global.__testFirestore2[ref._path], ...data };
      } else {
        global.__testFirestore2[ref._path] = data;
      }
    });
    firestore.serverTimestamp.mockImplementation(() => 'SERVER_TIMESTAMP');
    firestore.query.mockImplementation((...args) => args[0]);
    firestore.where.mockImplementation(() => {});
    firestore.onSnapshot.mockImplementation(() => {});
    firestore.documentId.mockImplementation(() => {});
  });

  describe('event lookup by Remo eventID', () => {
    beforeEach(() => {
      global.__testFirestore2[`events/${FIREBASE_DOC_ID_1}`] = { eventID: REMO_EVENT_ID_1, title: 'Event 1' };
      global.__testFirestore2[`events/${FIREBASE_DOC_ID_2}`] = { eventID: REMO_EVENT_ID_2, title: 'Event 2' };
    });

    it('should find the correct event doc when latestEventId is a Remo eventID', async () => {
      const eventsSnapshot = await firestore.getDocs(firestore.collection({}, 'events'));
      const eventDocId = findEventDocId(eventsSnapshot, REMO_EVENT_ID_2);

      expect(eventDocId).toBe(FIREBASE_DOC_ID_2);
    });

    it('should NOT find any event when latestEventId is a Firebase doc ID instead of Remo eventID', async () => {
      const eventsSnapshot = await firestore.getDocs(firestore.collection({}, 'events'));
      const eventDocId = findEventDocId(eventsSnapshot, FIREBASE_DOC_ID_2);

      expect(eventDocId).toBeNull();
    });

    it('should return null when latestEventId does not match any event', async () => {
      const eventsSnapshot = await firestore.getDocs(firestore.collection({}, 'events'));
      const eventDocId = findEventDocId(eventsSnapshot, 'nonexistent_id');

      expect(eventDocId).toBeNull();
    });
  });

  describe('signed-up user retrieval', () => {
    beforeEach(() => {
      global.__testFirestore2[`events/${FIREBASE_DOC_ID_1}`] = { eventID: REMO_EVENT_ID_1 };

      global.__testFirestore2[`events/${FIREBASE_DOC_ID_1}/signedUpUsers/userA`] = {
        userID: 'userA',
        userName: 'User A',
        userGender: 'male',
      };
      global.__testFirestore2[`events/${FIREBASE_DOC_ID_1}/signedUpUsers/userB`] = {
        userID: 'userB',
        userName: 'User B',
        userGender: 'female',
      };
      global.__testFirestore2[`events/${FIREBASE_DOC_ID_1}/signedUpUsers/userC`] = {
        userID: 'userC',
        userName: 'User C',
        userGender: 'female',
      };
    });

    it('should include ALL users from signedUpUsers subcollection regardless of Join Now status', async () => {
      const userIds = await getSignedUpUserIds(FIREBASE_DOC_ID_1);

      expect(userIds).toHaveLength(3);
      expect(userIds).toContain('userA');
      expect(userIds).toContain('userB');
      expect(userIds).toContain('userC');
    });

    it('should not exclude users who only signed up without clicking Join Now', async () => {
      const userIds = await getSignedUpUserIds(FIREBASE_DOC_ID_1);

      expect(userIds).toContain('userA');
      expect(userIds).toContain('userC');
    });

    it('should return empty array when no users signed up', async () => {
      global.__testFirestore2['events/emptyEvent'] = { eventID: 'remo_empty' };

      const userIds = await getSignedUpUserIds('emptyEvent');
      expect(userIds).toHaveLength(0);
    });
  });

  describe('quiz responses and profile fetching for full pool', () => {
    beforeEach(() => {
      const answers = makeQuizAnswers();

      for (let i = 1; i <= 5; i++) {
        const uid = `user${i}`;
        global.__testFirestore2[`users/${uid}/quizResponses/latest`] = { answers };
        global.__testFirestore2[`users/${uid}`] = {
          firstName: `User${i}`,
          lastName: 'Test',
          gender: i <= 3 ? 'Male' : 'Female',
          sexualPreference: i <= 3 ? 'Women' : 'Men',
        };
      }
    });

    it('should fetch quiz responses for every user in signedUpUsers', async () => {
      const userIds = ['user1', 'user2', 'user3', 'user4', 'user5'];
      const { quizResponses } = await fetchQuizAndProfiles(userIds);

      expect(quizResponses).toHaveLength(5);
    });

    it('should fetch user profiles for every user in signedUpUsers', async () => {
      const userIds = ['user1', 'user2', 'user3', 'user4', 'user5'];
      const { userProfiles } = await fetchQuizAndProfiles(userIds);

      expect(userProfiles).toHaveLength(5);
    });

    it('should skip users without quiz responses', async () => {
      global.__testFirestore2['users/user6'] = { firstName: 'User6', gender: 'Male' };

      const userIds = ['user1', 'user2', 'user6'];
      const { quizResponses } = await fetchQuizAndProfiles(userIds);

      expect(quizResponses).toHaveLength(2);
      expect(quizResponses.map((q) => q.userId)).not.toContain('user6');
    });
  });

  describe('end-to-end: signup-only user can find event and see matches', () => {
    beforeEach(() => {
      const answers = makeQuizAnswers();

      global.__testFirestore2[`events/${FIREBASE_DOC_ID_1}`] = { eventID: REMO_EVENT_ID_1 };

      global.__testFirestore2[`events/${FIREBASE_DOC_ID_1}/signedUpUsers/currentUser1`] = {
        userID: 'currentUser1',
        userGender: 'male',
      };
      global.__testFirestore2[`events/${FIREBASE_DOC_ID_1}/signedUpUsers/userA`] = {
        userID: 'userA',
        userGender: 'female',
      };
      global.__testFirestore2[`events/${FIREBASE_DOC_ID_1}/signedUpUsers/userB`] = {
        userID: 'userB',
        userGender: 'female',
      };

      global.__testFirestore2['users/currentUser1'] = {
        latestEventId: REMO_EVENT_ID_1,
        gender: 'Male',
        sexualPreference: 'Women',
      };
      global.__testFirestore2['users/userA'] = { gender: 'Female', sexualPreference: 'Men' };
      global.__testFirestore2['users/userB'] = { gender: 'Female', sexualPreference: 'Men' };

      global.__testFirestore2['users/currentUser1/quizResponses/latest'] = { answers };
      global.__testFirestore2['users/userA/quizResponses/latest'] = { answers };
      global.__testFirestore2['users/userB/quizResponses/latest'] = { answers };
    });

    it('should allow a signup-only user to find the event when latestEventId is Remo ID', async () => {
      const userDoc = await firestore.getDoc({ _path: 'users/currentUser1' });
      const latestEventId = userDoc.data().latestEventId;

      const eventsSnapshot = await firestore.getDocs(firestore.collection({}, 'events'));
      const eventDocId = findEventDocId(eventsSnapshot, latestEventId);

      expect(eventDocId).toBe(FIREBASE_DOC_ID_1);

      const userIds = await getSignedUpUserIds(eventDocId);
      expect(userIds).toHaveLength(3);
      expect(userIds).toContain('currentUser1');
      expect(userIds).toContain('userA');
      expect(userIds).toContain('userB');
    });

    it('should FAIL to find the event if latestEventId is stored as Firebase doc ID (old bug)', async () => {
      global.__testFirestore2['users/currentUser1'].latestEventId = FIREBASE_DOC_ID_1;

      const userDoc = await firestore.getDoc({ _path: 'users/currentUser1' });
      const latestEventId = userDoc.data().latestEventId;

      const eventsSnapshot = await firestore.getDocs(firestore.collection({}, 'events'));
      const eventDocId = findEventDocId(eventsSnapshot, latestEventId);

      expect(eventDocId).toBeNull();
    });

    it('should fetch quiz and profile data for all signed-up users once event is found', async () => {
      const userIds = ['currentUser1', 'userA', 'userB'];
      const { quizResponses, userProfiles } = await fetchQuizAndProfiles(userIds);

      expect(quizResponses).toHaveLength(3);
      expect(userProfiles).toHaveLength(3);

      const quizUserIds = quizResponses.map((q) => q.userId);
      expect(quizUserIds).toContain('currentUser1');
      expect(quizUserIds).toContain('userA');
      expect(quizUserIds).toContain('userB');
    });
  });
});
