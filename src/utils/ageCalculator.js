/**
 * Calculate age from birth date
 * @param {any} birthDate - Birth date from Firebase (could be Timestamp, Date, or string)
 * @returns {number|string} - Calculated age or 'N/A' if invalid
 */
export const calculateAge = (birthDate) => {
  if (!birthDate) {
    return 'N/A';
  }

  let date;
  
  // Handle different birth date formats from Firebase
  if (typeof birthDate === 'object' && birthDate.toDate) {
    // Firestore Timestamp
    date = birthDate.toDate();
  } else if (birthDate instanceof Date) {
    // JavaScript Date object
    date = birthDate;
  } else if (typeof birthDate === 'string') {
    // String date
    date = new Date(birthDate);
  } else if (typeof birthDate === 'number') {
    // Timestamp number
    date = new Date(birthDate);
  } else {
    return 'N/A';
  }

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'N/A';
  }

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  
  // Adjust age if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }

  return age;
}; 