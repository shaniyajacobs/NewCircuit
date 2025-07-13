import { db } from "./firebaseConfig"; 
import { collection, addDoc, Timestamp } from "firebase/firestore";

async function saveQuizAnswers(userId, answers) {
  try {
    const docRef = await addDoc(collection(db, "quizAnswers"), {
      userId,
      answers,
      timestamp: Timestamp.now(),
    });
    console.log("Quiz answers saved with ID: ", docRef.id);
  } catch (error) {
    console.error("Error saving quiz answers: ", error);
  }
}

export { saveQuizAnswers };
