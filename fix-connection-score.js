// Quick fix for 0% connection score
// Copy and paste this into your browser console while on the dashboard

const fixConnectionScore = async () => {
  console.log('🔧 Fixing connection scores...');
  
  const user = auth.currentUser;
  if (!user) {
    console.error('❌ Please log in first');
    return;
  }
  
  try {
    // Get all connections
    const connectionsSnap = await getDocs(collection(db, 'users', user.uid, 'connections'));
    
    for (const connDoc of connectionsSnap.docs) {
      const connectionId = connDoc.id;
      const connectionData = connDoc.data();
      
      // Only fix mutual connections with 0 or missing score
      if (connectionData.status === 'mutual' && (!connectionData.matchScore || connectionData.matchScore === 0)) {
        console.log(`🔧 Fixing connection ${connectionId}...`);
        
        // Get both users' quiz responses
        const [currentUserQuiz, otherUserQuiz] = await Promise.all([
          getDoc(doc(db, 'users', user.uid, 'quizResponses', 'latest')),
          getDoc(doc(db, 'users', connectionId, 'quizResponses', 'latest'))
        ]);
        
        if (currentUserQuiz.exists() && otherUserQuiz.exists()) {
          const currentUserAnswers = currentUserQuiz.data().answers;
          const otherUserAnswers = otherUserQuiz.data().answers;
          
          // Calculate new score using the matchmaking algorithm
          const { getTopMatches } = await import('./src/components/Matchmaking/Synergies.js');
          const matches = getTopMatches(currentUserAnswers, [{
            userId: connectionId,
            answers: otherUserAnswers
          }]);
          
          if (matches.length > 0) {
            const newScore = matches[0].score;
            console.log(`✅ Calculated new score: ${newScore}%`);
            
            // Update both users' connection documents
            await Promise.all([
              setDoc(doc(db, 'users', user.uid, 'connections', connectionId), {
                matchScore: newScore
              }, { merge: true }),
              setDoc(doc(db, 'users', connectionId, 'connections', user.uid), {
                matchScore: newScore
              }, { merge: true })
            ]);
            
            console.log(`✅ Updated connection ${connectionId} with score: ${newScore}%`);
          }
        } else {
          console.log(`⚠️  Missing quiz responses for connection ${connectionId}`);
        }
      }
    }
    
    console.log('✅ Fix complete! Refresh the page to see updated scores.');
    
  } catch (error) {
    console.error('❌ Error fixing connections:', error);
  }
};

// Run the fix
fixConnectionScore(); 