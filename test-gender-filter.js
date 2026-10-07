// Test for gender preference filtering
const filterByGenderPreference = (currentUser, otherUsers) => {
  if (!currentUser || !otherUsers || otherUsers.length === 0) {
    console.log('[GENDER FILTER] No users to filter or missing current user');
    return [];
  }

  const currentUserGender = currentUser.gender;
  const currentUserPreference = currentUser.sexualPreference;

  console.log('[GENDER FILTER] Current user:', {
    gender: currentUserGender,
    preference: currentUserPreference
  });

  if (!currentUserGender || !currentUserPreference) {
    console.log('[GENDER FILTER] Current user missing gender or preference, showing all users');
    return otherUsers;
  }

  const filteredUsers = otherUsers.filter(otherUser => {
    const otherUserGender = otherUser.gender;
    const otherUserPreference = otherUser.sexualPreference;

    console.log(`[GENDER FILTER] Checking user ${otherUser.userId}:`, {
      gender: otherUserGender,
      preference: otherUserPreference
    });

    if (!otherUserGender || !otherUserPreference) {
      console.log(`[GENDER FILTER] User ${otherUser.userId} missing gender or preference, skipping`);
      return false;
    }

    const currentUserWantsOtherUser = checkPreferenceMatch(currentUserPreference, otherUserGender);
    const otherUserWantsCurrentUser = checkPreferenceMatch(otherUserPreference, currentUserGender);

    const isMatch = currentUserWantsOtherUser && otherUserWantsCurrentUser;

    console.log(`[GENDER FILTER] User ${otherUser.userId} match result:`, {
      currentUserWantsOtherUser,
      otherUserWantsCurrentUser,
      isMatch
    });

    return isMatch;
  });

  console.log(`[GENDER FILTER] Filtered ${otherUsers.length} users down to ${filteredUsers.length} based on gender preferences`);
  
  return filteredUsers;
};

const checkPreferenceMatch = (preference, gender) => {
  const normalizedPreference = preference.toLowerCase();
  const normalizedGender = gender.toLowerCase();

  switch (normalizedPreference) {
    case 'men':
      return normalizedGender === 'male' || normalizedGender === 'man';
    case 'women':
      return normalizedGender === 'female' || normalizedGender === 'woman';
    case 'both':
      // "Both" should include male, female, man, woman, and non-binary
      return ['male', 'female', 'man', 'woman', 'non-binary', 'other'].includes(normalizedGender);
    case 'other':
      return ['non-binary', 'other'].includes(normalizedGender);
    case 'prefer not to say':
      return true;
    default:
      console.log(`[GENDER FILTER] Unknown preference: ${preference}`);
      return false;
  }
};

// Test cases
console.log('=== Testing Gender Preference Filtering ===\n');

// Test Case 1: Woman looking for men, man looking for women
console.log('Test Case 1: Woman looking for men, man looking for women');
const currentUser1 = { gender: 'Female', sexualPreference: 'Men' };
const otherUsers1 = [
  { userId: 'user1', gender: 'Male', sexualPreference: 'Women' },
  { userId: 'user2', gender: 'Female', sexualPreference: 'Men' },
  { userId: 'user3', gender: 'Male', sexualPreference: 'Both' }
];

const result1 = filterByGenderPreference(currentUser1, otherUsers1);
console.log('Result:', result1.map(u => u.userId));
console.log('Expected: user1, user3\n');

// Test Case 2: Man looking for women, woman looking for men
console.log('Test Case 2: Man looking for women, woman looking for men');
const currentUser2 = { gender: 'Male', sexualPreference: 'Women' };
const otherUsers2 = [
  { userId: 'user1', gender: 'Female', sexualPreference: 'Men' },
  { userId: 'user2', gender: 'Male', sexualPreference: 'Women' },
  { userId: 'user3', gender: 'Female', sexualPreference: 'Both' }
];

const result2 = filterByGenderPreference(currentUser2, otherUsers2);
console.log('Result:', result2.map(u => u.userId));
console.log('Expected: user1, user3\n');

// Test Case 3: Person looking for both
console.log('Test Case 3: Person looking for both');
const currentUser3 = { gender: 'Non-binary', sexualPreference: 'Both' };
const otherUsers3 = [
  { userId: 'user1', gender: 'Male', sexualPreference: 'Both' },
  { userId: 'user2', gender: 'Female', sexualPreference: 'Both' },
  { userId: 'user3', gender: 'Non-binary', sexualPreference: 'Both' }
];

const result3 = filterByGenderPreference(currentUser3, otherUsers3);
console.log('Result:', result3.map(u => u.userId));
console.log('Expected: user1, user2, user3\n');

// Test Case 4: Missing gender/preference
console.log('Test Case 4: Missing gender/preference');
const currentUser4 = { gender: 'Female', sexualPreference: 'Men' };
const otherUsers4 = [
  { userId: 'user1', gender: 'Male', sexualPreference: 'Women' },
  { userId: 'user2', gender: null, sexualPreference: 'Men' },
  { userId: 'user3', gender: 'Male', sexualPreference: null }
];

const result4 = filterByGenderPreference(currentUser4, otherUsers4);
console.log('Result:', result4.map(u => u.userId));
console.log('Expected: user1\n');

console.log('=== Test Complete ==='); 