import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  limit,
  type Timestamp,
} from "firebase/firestore";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { db, firebaseConfig } from "@/api/database";

export interface ManagedUser {
  uid: string;
  email: string;
  role: "admin" | "user";
  createdAt: Timestamp | null;
}

export async function getUserRecord(uid: string): Promise<ManagedUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() } as ManagedUser;
}

export async function anyUsersExist(): Promise<boolean> {
  const snap = await getDocs(query(collection(db, "users"), limit(1)));
  return !snap.empty;
}

export async function seedAdmin(uid: string, email: string): Promise<void> {
  await setDoc(doc(db, "users", uid), {
    email,
    role: "admin",
    createdAt: serverTimestamp(),
  });
}

export async function getUsers(): Promise<ManagedUser[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as ManagedUser));
}

export async function createManagedUser(
  email: string,
  password: string
): Promise<void> {
  const secondaryApp = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      email,
      password
    );
    await setDoc(doc(db, "users", credential.user.uid), {
      email,
      role: "user",
      createdAt: serverTimestamp(),
    });
  } finally {
    await deleteApp(secondaryApp);
  }
}

export async function removeManagedUser(uid: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid));
}

export async function setUserRole(uid: string, role: "admin" | "user"): Promise<void> {
  await setDoc(doc(db, "users", uid), { role }, { merge: true });
}
