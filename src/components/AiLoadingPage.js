import React, { useEffect, useState } from "react";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from '../pages/firebaseConfig';
import Synergies from './Matchmaking/Synergies';


const AiLoadingPage = () => {

  const auth = getAuth();
  const user = auth.currentUser;
  const [userData, setUserData] = useState();
  // const [connectionsData, setConnectionsData] = useState(); // Will be necessary once matches are dynamic
  const [loggedIn, setLoggedIn] = useState(false);

  const synergyData = Synergies()
  const placeholderUserIDs = synergyData.placeholderUserIDs;
  const weights = synergyData.weights;
  const synergyMatrices = synergyData.synergyMatrices;



  useEffect(() => {
    async function getUserData() {
      const userTable = collection(db, "users");
      const userQuery = query(userTable, where("email", "==", user.email));
      const loggedInUserQuery = await getDocs(userQuery);
      const loggedInUserData = loggedInUserQuery.docs.at(0);
      setUserData(loggedInUserData)

      /* // Will be necessary once matches are dynamic
      const connectionsQuery = query(userTable, where("userId", "in", placeholderUserIDs));
      const connectionsQueryDocs = await getDocs(connectionsQuery);

      const connectionsUserData = [];
      
      connectionsQueryDocs.forEach((doc) => {
        connectionsUserData.push({ id: doc.id, ...doc.data() });
      });

      setConnectionsData(connectionsUserData)
      */
    }

    if (user != null) {
        getUserData();
        setLoggedIn(true);
    } else {
        setLoggedIn(false);
    }
  }, [])

  // Replace the runAlgorithm function with an onAuthStateChanged-based approach
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        alert("Not signed in");
        return;
      }
      console.log('[AI MATCH] Current user:', user);
      console.log('[AI MATCH] Current user UID:', user.uid);

      // 1. Get latestEventId from current user's doc
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      const latestEventId = userDoc.data()?.latestEventId;
      console.log('[AI MATCH] latestEventId:', latestEventId);
      if (!latestEventId) {
        alert("No latest event found for user.");
        return;
      }

      // 2. Fetch user IDs who joined that event
      const signedUpUsersCol = collection(db, "events", latestEventId, "signedUpUsers");
      const signedUpUsersSnap = await getDocs(signedUpUsersCol);
      const userIds = signedUpUsersSnap.docs.map(d => d.id);
      console.log('[AI MATCH] User IDs in event:', userIds);

      // 3. For each user ID, fetch their quiz responses
      const quizResponses = [];
      for (const uid of userIds) {
        const quizDocRef = doc(db, "users", uid, "quizResponses", "latest");
        console.log(`[AI MATCH] Fetching quiz for user ${uid} at path:`, quizDocRef.path);
        const quizDoc = await getDoc(quizDocRef);
        console.log(`[AI MATCH] Checking quiz for user ${uid}: exists =`, quizDoc.exists());
        if (quizDoc.exists()) {
          quizResponses.push({ userId: uid, answers: quizDoc.data().answers });
        }
      }

      // 4. Filter out users without quiz responses (already done above)
      if (quizResponses.length === 0) {
        alert("No quiz responses found for this event.");
        return;
      }

      // 5. Pass those quiz responses into the matchmaking algorithm
      let currentUserAnswers = quizResponses.find(q => q.userId === user.uid)?.answers;

      if (!currentUserAnswers) {
        // Try fetching current user's quiz response directly
        const quizDocRef = doc(db, "users", user.uid, "quizResponses", "latest");
        console.log('[AI MATCH] Direct fetch for current user quiz at path:', quizDocRef.path);
        const quizDoc = await getDoc(quizDocRef);
        console.log(`[AI MATCH] Direct fetch for current user quiz: exists =`, quizDoc.exists());
        if (quizDoc.exists()) {
          currentUserAnswers = quizDoc.data().answers;
          // Optionally add to quizResponses for completeness
          quizResponses.push({ userId: user.uid, answers: currentUserAnswers });
        }
      }

      if (!currentUserAnswers) {
        alert("You must complete your quiz to get matches.");
        return;
      }

      // Example: run your matchmaking algorithm here
      // const matches = getTopMatches(currentUserAnswers, others);
      console.log('[AI MATCH] Current user answers:', currentUserAnswers);
      const others = quizResponses.filter(q => q.userId !== user.uid);
      console.log('[AI MATCH] Other users:', others);
    });
    return () => unsubscribe();
  }, []);

  async function getQuestionData(userID) {
    const userDocRef = doc(db, "users", userID);
    const quizResponses = collection(userDocRef, "quizResponses");
    const answerQuery = query(quizResponses, where("id", "==", "latest"));
    const latestDocs = await getDocs(answerQuery);
    const answersData = latestDocs.docs.at(0).data();
    return answersData;

    // GET COLLECTION FOR USER TOO
  }

  // For the user and a specific connection, create the synergies list
  function createSynergies(userAnswers, connectionAnswers) {

    // Function to convert a Set to a sorted string
    function setKey(set) {
      return Array.from(set).sort().join(',');
    }

    const synergies = new Map();
    const userAnswerData = userAnswers.answers;
    const connectionAnswerData = connectionAnswers.answers;

    Object.keys(userAnswerData).forEach(key => {
      const synergyKey = new Set([userAnswerData[key], connectionAnswerData[key]]);
      const sortedSynergyKey = setKey(synergyKey);

      // Create a new Map with the sorted string keys
      const sortedSynergyMatrices = new Map();
      for (const [set, value] of synergyMatrices.get(key)) {
        sortedSynergyMatrices.set(setKey(set), value);
      }

      const synergyVal = sortedSynergyMatrices.get(sortedSynergyKey);
      synergies.set(key, synergyVal);
    });

    return synergies;
  }

  // Synergies is an array of the synergies with the current user and one a specific connection with a synergy value for each question
  // Weights is an array of the weight for each question
  function matchmakingAlgorithm(synergies, weights) {
    var weightSum = 0;
      // Calculate the scores
        var score = 1;
        
        synergies.forEach((_,key) => {
          weightSum += weights.get(key);
          score *= Math.pow(synergies.get(key), weights.get(key));
        }
      )
      
      // Get the geometric mean and get the percentage
      const mean_score = Math.pow(score, (1 / weightSum) ) * 100
      return mean_score;
  }

  return (
    <div>
    { loggedIn ? 
    <button style={{width: 800, height: 800, backgroundColor: 'red'}} onClick={() => runAlgorithm()}/> :
    <div style={{width: 400, height: 400, backgroundColor: 'blue'}}>
        <p> NOT SIGNED IN</p>
    </div>
    }
    </div>
  );
};

export default AiLoadingPage;