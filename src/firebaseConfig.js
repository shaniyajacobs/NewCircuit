// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps} from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getRemoteConfig } from "firebase/remote-config";

import { getFunctions } from "firebase/functions";

import { getStorage } from 'firebase/storage';
import { testMatchmakingLogic, testRealWorldScenario, cleanupTestUsers } from './utils/matchmakingTest';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA8UBk7or93z6u1NeXV1jmuHOmyusJ-rwE",
  authDomain: "circuit-eb73c.firebaseapp.com",
  databaseURL: "https://circuit-eb73c-default-rtdb.firebaseio.com",
  projectId: "circuit-eb73c",
  storageBucket: "circuit-eb73c.firebasestorage.app",
  messagingSenderId: "997074025294",
  appId: "1:997074025294:web:3a3faac9dab0155eeb7c1f",
  measurementId: "G-Q9G5S9JKJG"
};
// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, "us-central1");
const storage = getStorage(app);
const remoteConfig = getRemoteConfig(app);

export { app, auth, db, functions, storage, remoteConfig };

// Expose test functions globally for debugging
if (typeof window !== 'undefined') {
  window.testMatchmaking = {
    testMatchmakingLogic,
    testRealWorldScenario,
    cleanupTestUsers
  };
}

