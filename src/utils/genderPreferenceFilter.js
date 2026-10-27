/**
 * Filter users based on mutual gender preferences
 */
export const filterByGenderPreference = (currentUser, otherUsers) => {
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