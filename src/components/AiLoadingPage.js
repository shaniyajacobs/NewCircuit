import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { collection, query, where, getDocs, doc } from "firebase/firestore";
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

  async function runAlgorithm() {
    const loggedInUserID = userData.data().userId;
    const userAnswers = await getQuestionData(loggedInUserID);
    
    placeholderUserIDs.forEach(async (userID) => {
      try {
        const connectionAnswers = await getQuestionData(userID);
        const synergies = createSynergies(userAnswers, connectionAnswers);
        const matchScore = matchmakingAlgorithm(synergies, weights);
        console.log("User: " + loggedInUserID + " and connection: " + userID + " have score: " + matchScore);
      } catch (e) {
        console.log(e)
        console.log("PROMISE CANCELLED");
      }
    });
  }

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