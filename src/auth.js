import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
  } from 'firebase/auth';
  import { doc, setDoc } from 'firebase/firestore';
  import { auth, db } from './firebaseConfig';
  
  export const registerUser = async (email, password, userData) => {
    try {
      // Create authentication account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Create user profile document
      await setDoc(doc(db, 'users', user.uid), {
        email: email,
        name: userData.name,
        dateOfBirth: userData.dateOfBirth,
        location: userData.location,
        profileImageUrl: userData.profileImageUrl || null,
        createdAt: new Date().toISOString(),
      });
  
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  export const loginUser = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  export const logoutUser = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };