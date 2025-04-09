import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from '../pages/firebaseConfig';


const AiLoadingPage = () => {

  const auth = getAuth();
  const user = auth.currentUser;
  const [userData, setUserData] = useState();
  const [connectionsData, setConnectionsData] = useState();
  const [loggedIn, setLoggedIn] = useState(false);

  const placeholderUserIDs = ["l3MifQh9HickO9gy29jEHOBrlGL2", "ZBRAWmzJFxZDyBY4o2Ya050Yyg43"] // Sod, Kaavya

  useEffect(() => {
    async function getUserData() {
      const userTable = collection(db, "users");
      const userQuery = query(userTable, where("email", "==", user.email));
      const loggedInUserQuery = await getDocs(userQuery);
      const loggedInUserData = loggedInUserQuery.docs.at(0);
      setUserData(loggedInUserData)

      const connectionsQuery = query(userTable, where("userId", "in", placeholderUserIDs));
      const connectionsQueryDocs = await getDocs(connectionsQuery);
      const connectionsUserData = [];
      connectionsQueryDocs.forEach((doc) => {
        connectionsUserData.push({ id: doc.id, ...doc.data() });
      });
      setConnectionsData(connectionsUserData)
      console.log(connectionsUserData)
    }

    if (user != null) {
        console.log(user);
        getUserData();
        setLoggedIn(true);
    } else {
        setLoggedIn(false);
    }
  }, [])

  function getQuestionData(user) {

  }

  function createSynergies(user, connections) {

  }

  // Synergies is an array of arrays where each sub array is the synergies with the current user and one potential connection, 
  // with a synergy value for each question
  // Weights is an array of the weight for each question

  function matchmakingAlgorithm(synergies, weights) {
    var scores = [];
    const numConnections = synergies.length  
      // Calculate the scores
      for (let j = 0; j < numConnections; j++) {
          var curr_score = 1;
          for (let i = 0; i < numConnections; i++) {
              curr_score *= Math.pow(synergies[j][i], weights[i]);
          }
          scores.push(curr_score);
      }
      
      // Normalize the scores
      const max_val = Math.max(...scores);
      scores = scores.map(score => score / max_val);
      
      return scores;
  }

  return (
    <div>
    { loggedIn ? 
    <button style={{width: 800, height: 800, backgroundColor: 'red'}} onClick={() => {console.log("CLICKED")}}/> :
    <div style={{width: 400, height: 400, backgroundColor: 'blue'}}>
        <p> NOT SIGNED IN</p>
    </div>
    }
    </div>
  );
};

export default AiLoadingPage;