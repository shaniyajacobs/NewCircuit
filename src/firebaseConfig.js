// Import Firebase modules
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; 

// Firebase configuration
const firebaseConfig = {
  //  storageBucket: "circuit-eb73c.appspot.com", // FIXED: storageBucket domain
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
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);


// Set authentication persistence
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Firebase Auth Persistence Set to Local");
  })
  .catch((error) => {
    console.error("Error setting Firebase persistence:", error);
  });

// Export Firebase services
export { app, auth, db };
