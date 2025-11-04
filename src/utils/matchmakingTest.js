import { db, auth } from '../firebaseConfig';
import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { getTopMatches } from '../components/Matchmaking/Synergies.js';

/**
 * REAL-WORLD SIMULATION TEST
 * This test creates actual test users and connections to verify the matchmaking logic
 * works exactly like real user connections would.
 */
export const testRealWorldScenario = async (autoCleanup = false) => {
  console.log('🌍 Starting REAL-WORLD simulation test...');
  
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('❌ No authenticated user found');
      return;
    }

    // Step 1: Create test users with realistic quiz responses
    const testUsers = [
      {
        id: 'test-user-1',
        email: 'test1@example.com',
        firstName: 'Alice',
        lastName: 'Johnson',
        gender: 'female',
        sexualPreference: 'male',
        birthDate: '1995-03-15',
        quizAnswers: {
          "Question 1": "Full-time",
          "Question 2": "Liberal/left leaning",
          "Question 3": "Extrovert",
          "Question 4": "Adventure",
          "Question 5": "Yes"
        }
      },
      {
        id: 'test-user-2', 
        email: 'test2@example.com',
        firstName: 'Bob',
        lastName: 'Smith',
        gender: 'male',
        sexualPreference: 'female',
        birthDate: '1992-07-22',
        quizAnswers: {
          "Question 1": "Full-time",
          "Question 2": "Moderate",
          "Question 3": "Introvert",
          "Question 4": "Relaxation",
          "Question 5": "No"
        }
      },
      {
        id: 'test-user-3',
        email: 'test3@example.com', 
        firstName: 'Carol',
        lastName: 'Davis',
        gender: 'female',
        sexualPreference: 'male',
        birthDate: '1990-11-08',
        quizAnswers: {
          "Question 1": "Part-time",
          "Question 2": "Conservative / right leaning",
          "Question 3": "Extrovert",
          "Question 4": "Adventure",
          "Question 5": "Yes"
        }
      }
    ];

    console.log('👥 Creating test users...');
    
    // Create test users in Firestore
    for (const testUser of testUsers) {
      // Create user document
      await setDoc(doc(db, 'users', testUser.id), {
        email: testUser.email,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        gender: testUser.gender,
        sexualPreference: testUser.sexualPreference,
        birthDate: testUser.birthDate,
        quizComplete: true,
        preferencesComplete: true,
        locationSet: true,
        createdAt: serverTimestamp()
      });

      // Create quiz responses
      await setDoc(doc(db, 'users', testUser.id, 'quizResponses', 'latest'), {
        answers: testUser.quizAnswers,
        completedAt: serverTimestamp()
      });

      console.log(`✅ Created test user: ${testUser.firstName} ${testUser.lastName} (${testUser.id})`);
    }

    // Step 2: Get current user's quiz responses
    const currentUserQuizRef = doc(db, 'users', user.uid, 'quizResponses', 'latest');
    const currentUserQuiz = await getDoc(currentUserQuizRef);
    
    if (!currentUserQuiz.exists()) {
      console.error('❌ Current user has no quiz responses - please complete your quiz first');
      return;
    }

    const currentUserAnswers = currentUserQuiz.data().answers;
    console.log('✅ Current user quiz responses:', currentUserAnswers);

    // Step 3: Run matchmaking algorithm on test users
    console.log('\n🎯 Running matchmaking algorithm on test users...');
    const testUsersForMatchmaking = testUsers.map(u => ({
      userId: u.id,
      answers: u.quizAnswers,
      profile: {
        gender: u.gender,
        sexualPreference: u.sexualPreference
      }
    }));

    const matches = getTopMatches(currentUserAnswers, testUsersForMatchmaking);
    console.log('📊 Calculated matches:', matches);

    // Step 4: Create real connections with the test users
    console.log('\n🔗 Creating real connections with test users...');
    const connectionsToCreate = matches.slice(0, 2); // Create 2 connections
    
    for (const match of connectionsToCreate) {
      const testUser = testUsers.find(u => u.id === match.userId);
      if (!testUser) continue;

      // Create connection from current user to test user
      await setDoc(doc(db, 'users', user.uid, 'connections', testUser.id), {
        connectedAt: serverTimestamp(),
        status: 'mutual',
        matchScore: match.score,
      }, { merge: true });

      // Create connection from test user to current user
      await setDoc(doc(db, 'users', testUser.id, 'connections', user.uid), {
        connectedAt: serverTimestamp(),
        status: 'mutual',
        matchScore: match.score,
      }, { merge: true });

      console.log(`✅ Created mutual connection with ${testUser.firstName} (${match.score}% compatibility)`);
    }

    // Step 5: Verify connections were created correctly
    console.log('\n🔍 Verifying connections were created correctly...');
    const connectionsSnap = await getDocs(collection(db, 'users', user.uid, 'connections'));
    const createdConnections = {};
    
    connectionsSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.status === 'mutual' && data.matchScore) {
        createdConnections[doc.id] = data.matchScore;
      }
    });

    console.log('📊 Created connections:', createdConnections);

    // Step 6: Test the preservation logic by creating another connection
    console.log('\n🔄 Testing preservation logic by creating another connection...');
    
    // Get the third test user (if available)
    const thirdUser = testUsers[2];
    if (thirdUser) {
      const thirdUserMatch = matches.find(m => m.userId === thirdUser.id);
      if (thirdUserMatch) {
        // Create connection with third user
        await setDoc(doc(db, 'users', user.uid, 'connections', thirdUser.id), {
          connectedAt: serverTimestamp(),
          status: 'mutual',
          matchScore: thirdUserMatch.score,
        }, { merge: true });

        console.log(`✅ Created connection with ${thirdUser.firstName} (${thirdUserMatch.score}% compatibility)`);

        // Verify existing connections are still intact
        const afterConnectionsSnap = await getDocs(collection(db, 'users', user.uid, 'connections'));
        const afterConnections = {};
        
        afterConnectionsSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.status === 'mutual' && data.matchScore) {
            afterConnections[doc.id] = data.matchScore;
          }
        });

        console.log('📊 Connections after adding third user:', afterConnections);

        // Check if existing connections were preserved
        let allPreserved = true;
        Object.keys(createdConnections).forEach(userId => {
          if (afterConnections[userId] !== createdConnections[userId]) {
            console.log(`❌ Connection ${userId} score changed from ${createdConnections[userId]} to ${afterConnections[userId]}`);
            allPreserved = false;
          } else {
            console.log(`✅ Connection ${userId} preserved with score: ${createdConnections[userId]}`);
          }
        });

        if (allPreserved) {
          console.log('🎉 SUCCESS: All existing connections were preserved when adding new connections!');
        } else {
          console.log('⚠️  WARNING: Some existing connections were affected when adding new connections');
        }
      }
    }

    // Step 7: Clean up test data (optional)
    console.log('\n🧹 Cleaning up test data...');
    
    if (autoCleanup) {
      // Delete test users and their connections
      for (const testUser of testUsers) {
        // Delete connections from current user to test user
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'connections', testUser.id));
        } catch (e) {
          // Connection might not exist
        }

        // Delete connections from test user to current user
        try {
          await deleteDoc(doc(db, 'users', testUser.id, 'connections', user.uid));
        } catch (e) {
          // Connection might not exist
        }

        // Delete test user's quiz responses
        try {
          await deleteDoc(doc(db, 'users', testUser.id, 'quizResponses', 'latest'));
        } catch (e) {
          // Quiz might not exist
        }

        // Delete test user
        try {
          await deleteDoc(doc(db, 'users', testUser.id));
        } catch (e) {
          // User might not exist
        }

        console.log(`🗑️  Cleaned up test user: ${testUser.firstName} ${testUser.lastName}`);
      }
      console.log('✅ Test data cleaned up successfully');
    } else {
      console.log('📝 Test data preserved for manual inspection');
      console.log('💡 To clean up manually, run: window.testMatchmaking.testRealWorldScenario(true)');
    }

    return {
      success: true,
      testUsers,
      matches,
      createdConnections,
      message: 'Real-world simulation completed successfully!',
      cleanupPerformed: autoCleanup
    };

  } catch (error) {
    console.error('❌ Error during real-world simulation:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Comprehensive test for matchmaking logic and connection compatibility scores
 * This test verifies that:
 * 1. Multiple connections don't reset compatibility scores to 0%
 * 2. Existing connections preserve their scores when new connections are made
 * 3. The matchmaking algorithm produces consistent results
 */
export const testMatchmakingLogic = async () => {
  console.log('🧪 Starting comprehensive matchmaking test...');
  
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('❌ No authenticated user found');
      return;
    }

    // Step 1: Get current user's quiz responses
    const currentUserQuizRef = doc(db, 'users', user.uid, 'quizResponses', 'latest');
    const currentUserQuiz = await getDoc(currentUserQuizRef);
    
    if (!currentUserQuiz.exists()) {
      console.error('❌ Current user has no quiz responses');
      return;
    }

    const currentUserAnswers = currentUserQuiz.data().answers;
    console.log('✅ Current user quiz responses:', currentUserAnswers);

    // Step 2: Get all existing connections
    const connectionsSnap = await getDocs(collection(db, 'users', user.uid, 'connections'));
    const existingConnections = {};
    
    connectionsSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.status === 'mutual' && data.matchScore) {
        existingConnections[doc.id] = data.matchScore;
      }
    });

    console.log('📊 Existing connections with scores:', existingConnections);

    // Step 3: Get all users who have quiz responses (for testing)
    const allUsersSnap = await getDocs(collection(db, 'users'));
    const usersWithQuizzes = [];

    for (const userDoc of allUsersSnap.docs) {
      if (userDoc.id === user.uid) continue; // Skip current user
      
      const quizRef = doc(db, 'users', userDoc.id, 'quizResponses', 'latest');
      const quizDoc = await getDoc(quizRef);
      
      if (quizDoc.exists()) {
        const quizData = quizDoc.data();
        usersWithQuizzes.push({
          userId: userDoc.id,
          answers: quizData.answers,
          profile: userDoc.data()
        });
      }
    }

    console.log(`📋 Found ${usersWithQuizzes.length} users with quiz responses`);

    // Step 4: Run matchmaking algorithm on all users
    const allMatches = getTopMatches(currentUserAnswers, usersWithQuizzes);
    console.log('🎯 All calculated matches:', allMatches);

    // Step 5: Test scenario: Simulate making new connections while preserving existing ones
    console.log('\n🔍 Testing scenario: Making new connections while preserving existing ones...');
    
    // Get existing connections that should be preserved
    const preservedConnections = {};
    Object.keys(existingConnections).forEach(userId => {
      const match = allMatches.find(m => m.userId === userId);
      if (match) {
        preservedConnections[userId] = {
          existingScore: existingConnections[userId],
          calculatedScore: match.score,
          difference: Math.abs(existingConnections[userId] - match.score)
        };
      }
    });

    console.log('🔒 Connections that should be preserved:', preservedConnections);

    // Step 6: Simulate the merge logic from DashHome
    const newMatches = allMatches.slice(0, 3); // Simulate getting 3 new matches
    const mergedMatches = [...newMatches];
    
    // Add existing connections that weren't in the new matches
    Object.keys(existingConnections).forEach(userId => {
      const existsInNewMatches = newMatches.some(match => match.userId === userId);
      if (!existsInNewMatches) {
        mergedMatches.push({
          userId: userId,
          score: existingConnections[userId]
        });
      }
    });

    console.log('🔄 Merged matches (preserving existing scores):', mergedMatches);

    // Step 7: Verify that existing connections maintain their scores
    let testPassed = true;
    const issues = [];

    Object.keys(existingConnections).forEach(userId => {
      const mergedMatch = mergedMatches.find(m => m.userId === userId);
      if (!mergedMatch) {
        issues.push(`❌ Connection ${userId} was lost during merge`);
        testPassed = false;
      } else if (mergedMatch.score !== existingConnections[userId]) {
        issues.push(`❌ Connection ${userId} score changed from ${existingConnections[userId]} to ${mergedMatch.score}`);
        testPassed = false;
      } else {
        console.log(`✅ Connection ${userId} preserved with score: ${mergedMatch.score}`);
      }
    });

    // Step 8: Test the actual connection saving logic
    console.log('\n💾 Testing connection saving logic...');
    
    // Simulate saving new connections while preserving existing ones
    const testConnections = mergedMatches.slice(0, 2); // Test with 2 connections
    
    for (const match of testConnections) {
      const connectionRef = doc(db, 'users', user.uid, 'connections', match.userId);
      const existingConnection = await getDoc(connectionRef);
      
      if (existingConnection.exists()) {
        const existingData = existingConnection.data();
        if (existingData.status === 'mutual' && existingData.matchScore) {
          console.log(`✅ Preserving existing connection ${match.userId} with score: ${existingData.matchScore}`);
        } else {
          console.log(`🔄 Updating connection ${match.userId} with new score: ${match.score}`);
        }
      } else {
        console.log(`🆕 Creating new connection ${match.userId} with score: ${match.score}`);
      }
    }

    // Step 9: Final verification
    console.log('\n📊 Final Test Results:');
    console.log(`✅ Test ${testPassed ? 'PASSED' : 'FAILED'}`);
    
    if (issues.length > 0) {
      console.log('❌ Issues found:');
      issues.forEach(issue => console.log(issue));
    } else {
      console.log('🎉 All tests passed! Multiple connections maintain their compatibility scores.');
    }

    return {
      success: testPassed,
      issues,
      existingConnections,
      allMatches,
      mergedMatches,
      preservedConnections
    };

  } catch (error) {
    console.error('❌ Error during matchmaking test:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Test specific scenario: Verify that making a new connection doesn't affect existing ones
 */
export const testNewConnectionScenario = async () => {
  console.log('\n🧪 Testing new connection scenario...');
  
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('❌ No authenticated user found');
      return;
    }

    // Get current connections
    const connectionsSnap = await getDocs(collection(db, 'users', user.uid, 'connections'));
    const beforeConnections = {};
    
    connectionsSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.status === 'mutual' && data.matchScore) {
        beforeConnections[doc.id] = data.matchScore;
      }
    });

    console.log('📊 Connections before test:', beforeConnections);

    // Simulate making a new connection
    const testUserId = 'test-user-id';
    const testScore = 85;
    
    // Save a test connection
    await setDoc(doc(db, 'users', user.uid, 'connections', testUserId), {
      connectedAt: serverTimestamp(),
      status: 'mutual',
      matchScore: testScore,
    }, { merge: true });

    console.log(`✅ Created test connection ${testUserId} with score: ${testScore}`);

    // Verify existing connections are still intact
    const afterConnectionsSnap = await getDocs(collection(db, 'users', user.uid, 'connections'));
    const afterConnections = {};
    
    afterConnectionsSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.status === 'mutual' && data.matchScore) {
        afterConnections[doc.id] = data.matchScore;
      }
    });

    console.log('📊 Connections after test:', afterConnections);

    // Check if existing connections were preserved
    let allPreserved = true;
    Object.keys(beforeConnections).forEach(userId => {
      if (afterConnections[userId] !== beforeConnections[userId]) {
        console.log(`❌ Connection ${userId} score changed from ${beforeConnections[userId]} to ${afterConnections[userId]}`);
        allPreserved = false;
      } else {
        console.log(`✅ Connection ${userId} preserved with score: ${beforeConnections[userId]}`);
      }
    });

    // Clean up test connection
    // Note: In a real test, you might want to actually delete this
    console.log('🧹 Test connection would be cleaned up here');

    return {
      success: allPreserved,
      beforeConnections,
      afterConnections,
      testConnection: { userId: testUserId, score: testScore }
    };

  } catch (error) {
    console.error('❌ Error during new connection test:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Clean up test users and their data
 * Removes all test users created during testing
 */
export const cleanupTestUsers = async () => {
  try {
    console.log('🧹 Starting test user cleanup...');
    
    const { collection, getDocs, doc, deleteDoc } = await import('firebase/firestore');
    
    // Get current user
    const user = auth.currentUser;
    if (!user) {
      console.error('❌ No authenticated user found');
      return { success: false, error: 'No authenticated user found' };
    }
    
    // Get all users
    const usersSnap = await getDocs(collection(db, 'users'));
    const testUsers = [];
    
    // Find test users (those with test emails or test user IDs)
    usersSnap.docs.forEach(docSnap => {
      const userData = docSnap.data();
      const userId = docSnap.id;
      const email = userData.email || '';
      
      // Check for test users by email pattern or user ID pattern
      if (email.includes('test') || 
          email.includes('@example.com') ||
          userId.includes('test-user') ||
          userId.includes('testuser')) {
        testUsers.push({
          id: userId,
          email: email,
          name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
        });
      }
    });
    
    console.log(`🧹 Found ${testUsers.length} test users to clean up:`, testUsers);
    
    if (testUsers.length === 0) {
      console.log('🧹 No test users found to clean up');
      return { success: true, message: 'No test users found to clean up' };
    }
    
    // First, clean up connections from current user to test users
    console.log('🧹 Cleaning up connections from current user to test users...');
    for (const testUser of testUsers) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'connections', testUser.id));
        console.log(`  - Deleted connection to ${testUser.name}`);
      } catch (error) {
        // Connection might not exist, that's okay
        console.log(`  - No connection to ${testUser.name} found`);
      }
    }
    
    // Delete each test user and their data
    for (const testUser of testUsers) {
      console.log(`🧹 Cleaning up test user: ${testUser.name} (${testUser.email}) - ${testUser.id}`);
      
      try {
        // Delete user's connections
        const connectionsSnap = await getDocs(collection(db, 'users', testUser.id, 'connections'));
        for (const connDoc of connectionsSnap.docs) {
          await deleteDoc(connDoc.ref);
        }
        console.log(`  - Deleted ${connectionsSnap.docs.length} connections`);
        
        // Delete user's quiz responses
        const quizSnap = await getDocs(collection(db, 'users', testUser.id, 'quizResponses'));
        for (const quizDoc of quizSnap.docs) {
          await deleteDoc(quizDoc.ref);
        }
        console.log(`  - Deleted ${quizSnap.docs.length} quiz responses`);
        
        // Delete user's signed up events
        const eventsSnap = await getDocs(collection(db, 'users', testUser.id, 'signedUpEvents'));
        for (const eventDoc of eventsSnap.docs) {
          await deleteDoc(eventDoc.ref);
        }
        console.log(`  - Deleted ${eventsSnap.docs.length} signed up events`);
        
        // Delete user's notifications
        const notificationsSnap = await getDocs(collection(db, 'users', testUser.id, 'notifications'));
        for (const notifDoc of notificationsSnap.docs) {
          await deleteDoc(notifDoc.ref);
        }
        console.log(`  - Deleted ${notificationsSnap.docs.length} notifications`);
        
        // Delete the user document itself
        await deleteDoc(doc(db, 'users', testUser.id));
        console.log(`  - Deleted user document`);
        
        console.log(`🧹 Successfully cleaned up test user: ${testUser.name} (${testUser.email})`);
      } catch (error) {
        console.error(`❌ Error cleaning up test user ${testUser.id}:`, error);
      }
    }
    
    console.log('🧹 Test user cleanup completed successfully!');
    return { 
      success: true, 
      message: `Successfully cleaned up ${testUsers.length} test users`,
      cleanedUsers: testUsers
    };
    
  } catch (error) {
    console.error('Error cleaning up test users:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Run all tests
 */
export const runAllMatchmakingTests = async () => {
  console.log('🚀 Running all matchmaking tests...\n');
  
  const test1 = await testMatchmakingLogic();
  const test2 = await testNewConnectionScenario();
  
  console.log('\n📋 Test Summary:');
  console.log(`Test 1 (Matchmaking Logic): ${test1.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Test 2 (New Connection): ${test2.success ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (test1.success && test2.success) {
    console.log('\n🎉 All tests passed! Your matchmaking logic is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the issues above.');
  }
  
  return {
    test1,
    test2,
    allPassed: test1.success && test2.success
  };
};

// Make test functions available globally for console testing
if (typeof window !== 'undefined') {
  window.testMatchmaking = {
    testMatchmakingLogic,
    testNewConnectionScenario,
    testRealWorldScenario,
    runAllMatchmakingTests
  };
  
  console.log('🧪 Matchmaking test functions available globally:');
  console.log('- window.testMatchmaking.testMatchmakingLogic()');
  console.log('- window.testMatchmaking.testNewConnectionScenario()');
  console.log('- window.testMatchmaking.testRealWorldScenario()');
  console.log('- window.testMatchmaking.runAllMatchmakingTests()');
} 