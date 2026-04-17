import { db } from "./database";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function submitFeedback(feedback: string) {
  const docRef = await addDoc(collection(db, "feedback"), {
    feedback,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}
