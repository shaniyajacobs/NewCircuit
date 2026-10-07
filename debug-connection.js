// Debug script to identify why One Spark connection shows 0% compatibility
// Run this in your browser console while logged into the app

const debugConnection = async () => {
  console.log('🔍 Starting connection debug...');
  
  const user = auth.currentUser;
  if (!user) {
    console.error('❌ No authenticated user found');
    return;
  }
  
  console.log('👤 Current user:', user.uid);
  
  try {
    // 1. Check user's connections
    const connectionsSnap = await getDocs(collection(db, 'users', user.uid, 'connections'));
    console.log('📋 Total connections found:', connectionsSnap.docs.length);
    
    for (const connDoc of connectionsSnap.docs) {
      const connectionId = connDoc.id;
      const connectionData = connDoc.data();
      
      console.log(`\n🔗 Connection ${connectionId}:`, connectionData);
      
      // 2. Check if it's a mutual connection
      if (connectionData.status !== 'mutual') {
        console.log(`⚠️  Connection ${connectionId} is not mutual (status: ${connectionData.status})`);
        continue;
      }
      
      // 3. Check match score
      console.log(`📊 Match score for ${connectionId}:`, connectionData.matchScore);
      
      if (!connectionData.matchScore || connectionData.matchScore === 0) {
        console.log(`❌ Connection ${connectionId} has no match score or score is 0`);
        
        // 4. Check if both users have quiz responses
        const [currentUserQuiz, otherUserQuiz] = await Promise.all([
          getDoc(doc(db, 'users', user.uid, 'quizResponses', 'latest')),
          getDoc(doc(db, 'users', connectionId, 'quizResponses', 'latest'))
        ]);
        
        console.log(`📝 Current user quiz exists:`, currentUserQuiz.exists());
        console.log(`📝 Other user quiz exists:`, otherUserQuiz.exists());
        
        if (!currentUserQuiz.exists()) {
          console.log(`❌ Current user (${user.uid}) has no quiz responses`);
        }
        
        if (!otherUserQuiz.exists()) {
          console.log(`❌ Other user (${connectionId}) has no quiz responses`);
        }
        
        // 5. If both have quiz responses, try to calculate the score
        if (currentUserQuiz.exists() && otherUserQuiz.exists()) {
          console.log('🔄 Attempting to recalculate match score...');
          
          const currentUserAnswers = currentUserQuiz.data().answers;
          const otherUserAnswers = otherUserQuiz.data().answers;
          
          console.log('📋 Current user answers:', currentUserAnswers);
          console.log('📋 Other user answers:', otherUserAnswers);
          
          // Import and run the matchmaking algorithm
          const { getTopMatches } = await import('./src/components/Matchmaking/Synergies.js');
          const matches = getTopMatches(currentUserAnswers, [{
            userId: connectionId,
            answers: otherUserAnswers
          }]);
          
          console.log('🎯 Calculated matches:', matches);
          
          if (matches.length > 0) {
            const newScore = matches[0].score;
            console.log(`✅ New calculated score: ${newScore}%`);
            
            // Update the connection with the new score
            await setDoc(doc(db, 'users', user.uid, 'connections', connectionId), {
              matchScore: newScore
            }, { merge: true });
            
            console.log(`✅ Updated connection ${connectionId} with new score: ${newScore}%`);
          }
        }
      }
    }
    
    console.log('\n✅ Debug complete! Check the console for details.');
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
};

// Run the debug function
debugConnection(); 