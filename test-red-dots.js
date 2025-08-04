// Test script to verify red dot functionality
// Run this in your browser console while on the dashboard

const testRedDots = async () => {
  console.log('🔍 Testing red dot functionality...');
  
  const user = auth.currentUser;
  if (!user) {
    console.error('❌ Please log in first');
    return;
  }
  
  try {
    // Get all connections
    const connectionsSnap = await getDocs(collection(db, 'users', user.uid, 'connections'));
    console.log('📋 Total connections found:', connectionsSnap.docs.length);
    
    let mutualConnections = 0;
    let newSparks = 0;
    
    for (const connDoc of connectionsSnap.docs) {
      const connectionId = connDoc.id;
      const connectionData = connDoc.data();
      
      if (connectionData.status === 'mutual') {
        mutualConnections++;
        console.log(`✅ Mutual connection: ${connectionId}`);
        
        // Check if it's a new spark
        const convoId = user.uid < connectionId ? `${user.uid}${connectionId}` : `${connectionId}${user.uid}`;
        const convoDoc = await getDoc(doc(db, "conversations", convoId));
        
        if (!convoDoc.exists()) {
          newSparks++;
          console.log(`🔴 NEW SPARK: ${connectionId} (no conversation exists)`);
        } else {
          const messages = convoDoc.data().messages || [];
          const hasMessaged = messages.some(msg => msg.senderId === user.uid);
          
          if (!hasMessaged) {
            newSparks++;
            console.log(`🔴 NEW SPARK: ${connectionId} (no messages sent by user)`);
          } else {
            console.log(`⚪ Existing spark: ${connectionId} (user has sent messages)`);
          }
        }
      } else {
        console.log(`⚠️  Non-mutual connection: ${connectionId} (status: ${connectionData.status})`);
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`Total connections: ${connectionsSnap.docs.length}`);
    console.log(`Mutual connections: ${mutualConnections}`);
    console.log(`New sparks (should show red dots): ${newSparks}`);
    
    if (newSparks > 0) {
      console.log('✅ You should see red dots on the sidebar and next to profile pictures for new sparks!');
    } else {
      console.log('ℹ️  No new sparks found - all sparks have been messaged or are not mutual');
    }
    
  } catch (error) {
    console.error('❌ Error testing red dots:', error);
  }
};

// Run the test
testRedDots(); 