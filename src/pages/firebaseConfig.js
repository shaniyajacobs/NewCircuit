// Import Firebase
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth"; 
import { getFirestore } from "firebase/firestore"; 
import { getStorage } from 'firebase/storage'; // Add storage import

// extra imports from the root file
import { getApp, getApps } from 'firebase/app';
import { getFunctions } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';

// Your Firebase configuration from Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyA8UBk7or93z6u1NeXV1jmuHOmyusJ-rwE",
    authDomain: "circuit-eb73c.firebaseapp.com",
    //databaseURL: "https://circuit-eb73c-default-rtdb.firebaseio.com",
    projectId: "circuit-eb73c",
    storageBucket: "circuit-eb73c.firebasestorage.app",
    messagingSenderId: "997074025294",
    appId: "1:997074025294:web:3a3faac9dab0155eeb7c1f",
    //measurementId: "G-Q9G5S9JKJG"
  };

  // initialise the app only once
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

  const auth = getAuth(app);
  const db = getFirestore(app); 
  const storage = getStorage(app); // Initialize storage
  
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log("Firebase Auth Persistence Set to Local");
    })
    .catch((error) => {
      console.error("Error setting Firebase persistence:", error);
    });
  
  // extra services that only existed in the root file
  const analytics = getAnalytics(app);
  const functions = getFunctions(app, 'us-central1');

  export { app, auth, db, storage, functions, analytics };
