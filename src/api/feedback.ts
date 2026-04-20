import { db } from "./database";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  query,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";

export interface FeedbackEntry {
  id: string;
  feedback: string;
  tags: string[];
  archived: boolean;
  createdAt: Timestamp;
}

export async function submitFeedback(feedback: string) {
  const docRef = await addDoc(collection(db, "feedback"), {
    feedback,
    tags: [],
    archived: false,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getFeedback(): Promise<FeedbackEntry[]> {
  const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    feedback: d.data().feedback ?? "",
    tags: d.data().tags ?? [],
    archived: d.data().archived ?? false,
    createdAt: d.data().createdAt as Timestamp,
  }));
}

export async function updateFeedbackTags(id: string, tags: string[]): Promise<void> {
  await updateDoc(doc(db, "feedback", id), { tags });
}

export async function setFeedbackArchived(id: string, archived: boolean): Promise<void> {
  await updateDoc(doc(db, "feedback", id), { archived });
}
