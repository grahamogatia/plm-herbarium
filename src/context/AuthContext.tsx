import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/api/database";
import {
  getUserRecord,
  anyUsersExist,
  seedAdmin,
} from "@/api/users";
import { writeLog } from "@/api/logs";

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const record = await getUserRecord(user.uid);

        if (!record) {
          // No Firestore record — check if this is the very first login ever
          const hasUsers = await anyUsersExist();
          if (!hasUsers) {
            // First user ever → seed as admin
            await seedAdmin(user.uid, user.email ?? "");
            setCurrentUser(user);
            setIsAdmin(true);
            await writeLog("login", user.email ?? user.uid, "Logged in (admin)");
          } else {
            // Unknown user — revoke access
            await signOut(auth);
            setCurrentUser(null);
            setIsAdmin(false);
          }
        } else {
          setCurrentUser(user);
          setIsAdmin(record.role === "admin");
          await writeLog("login", user.email ?? user.uid, `Logged in (${record.role})`);
        }
      } catch {
        // If Firestore is unreachable, allow the session to continue
        setCurrentUser(user);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    if (currentUser) {
      await writeLog("logout", currentUser.email ?? currentUser.uid, "Logged out");
    }
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ currentUser, isAdmin, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
