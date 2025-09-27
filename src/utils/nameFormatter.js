/**
 * Formats a user's name to "full first name, last initial" format
 * @param {Object} userData - User data object containing firstName and lastName
 * @param {string} userData.firstName - User's first name
 * @param {string} userData.lastName - User's last name
 * @param {string} userData.displayName - Fallback display name
 * @returns {string} Formatted name in "FirstName L" format
 */
export const formatUserName = (userData) => {
  if (!userData) return 'Unknown';
  
  const { firstName, lastName, displayName } = userData;
  
  // If we have firstName, use the "full first name, last initial" format
  if (firstName) {
    if (lastName && lastName.trim()) {
      // Get the first character of the last name and capitalize it
      const lastInitial = lastName.trim().charAt(0).toUpperCase();
      return `${firstName} ${lastInitial}`;
    } else {
      // Only first name available
      return firstName;
    }
  }
  
  // Fallback to displayName if no firstName
  if (displayName) {
    return displayName;
  }
  
  return 'Unknown';
};

/**
 * Formats a user's full name (for admin/backoffice use)
 * @param {Object} userData - User data object containing firstName and lastName
 * @param {string} userData.firstName - User's first name
 * @param {string} userData.lastName - User's last name
 * @param {string} userData.displayName - Fallback display name
 * @returns {string} Full name or fallback
 */
export const formatFullName = (userData) => {
  if (!userData) return 'Unknown';
  
  const { firstName, lastName, displayName } = userData;
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`.trim();
  } else if (firstName) {
    return firstName;
  } else if (displayName) {
    return displayName;
  }
  
  return 'Unknown';
}; 