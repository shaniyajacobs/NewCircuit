import { auth } from '../firebaseConfig';

export const getAttendeeId = () => {
  // 1. Check URL query parameter '?phone='
  const urlParams = new URLSearchParams(window.location.search);
  const phoneFromQuery = urlParams.get('phone');
  if (phoneFromQuery) {
    sessionStorage.setItem('attendeePhone', phoneFromQuery); // cache it
    return phoneFromQuery;
  }

  // 2. Check sessionStorage (set by previous page or manual)
  const phoneFromSession = sessionStorage.getItem('attendeePhone');
  if (phoneFromSession) {
    return phoneFromSession;
  }

  // 3. Check authenticated user's phone
  const user = auth.currentUser;
  if (user && user.phoneNumber) {
    return user.phoneNumber;
  }

  // 4. Fallback: check URL path parameter (if any) – not used now
  return null;
};

export const setAttendeeId = (phone) => {
  sessionStorage.setItem('attendeePhone', phone);
};