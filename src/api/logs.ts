import {
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/api/database";

export type LogAction =
  | "login"
  | "logout"
  | "specimen_create"
  | "specimen_update"
  | "specimen_delete"
  | "user_add"
  | "user_remove"
  | "user_role_change";

export interface LogEntry {
  id: string;
  action: LogAction;
  performedBy: string; // user email
  detail: string;      // human-readable description
  timestamp: Timestamp;
}

export async function writeLog(
  action: LogAction,
  performedBy: string,
  detail: string,
): Promise<void> {
  await addDoc(collection(db, "logs"), {
    action,
    performedBy,
    detail,
    timestamp: serverTimestamp(),
  });
}

export async function getLogs(): Promise<LogEntry[]> {
  const snap = await getDocs(
    query(collection(db, "logs"), orderBy("timestamp", "desc")),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as LogEntry));
}
