// Import Firebase modules
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; 

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA8UBk7or93z6u1NeXV1jmuHOmyusJ-rwE",
  authDomain: "circuit-eb73c.firebaseapp.com",
  projectId: "circuit-eb73c",
  storageBucket: "circuit-eb73c.appspot.com", // FIXED: storageBucket domain
  messagingSenderId: "997074025294",
  appId: "1:997074025294:web:3a3faac9dab0155eeb7c1f",
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

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
