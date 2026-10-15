"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { checkIsAdmin } from "@/actions/admin";
import {
  getParticipantSession,
  clearParticipantSession,
  saveAdminSession,
  getRemainingSessionMs,
  ParticipantSession,
} from "@/lib/authSession";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  sessionToken: string | null;
  remainingMs: number;
  logout: (reason?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  sessionToken: null,
  remainingMs: Infinity,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState<number>(Infinity);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const logout = useCallback(async (reason?: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    clearParticipantSession();
    try {
      if (auth) {
        await auth.signOut();
      }
    } catch (e) {
      console.warn("Logout error:", e);
    }
    setUser(null);
    setIsAdmin(false);
    setSessionToken(null);
    setRemainingMs(0);

    if (reason === "session_expired" && typeof window !== "undefined") {
      window.location.href = "/login?reason=session_expired";
    }
  }, []);

  useEffect(() => {
    try {
      if (!auth || !auth.config) {
        setLoading(false);
        return;
      }

      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }

        if (!firebaseUser) {
          clearParticipantSession();
          setUser(null);
          setIsAdmin(false);
          setSessionToken(null);
          setRemainingMs(0);
          setLoading(false);
          return;
        }

        // Server-Side Verification of Admin Role (CRIT-02: No client-side admin email exposure)
        let isUserAdmin = false;
        let idToken = "";
        try {
          idToken = await firebaseUser.getIdToken();
          isUserAdmin = await checkIsAdmin(idToken);
        } catch (err) {
          console.warn("Admin verification check failed:", err);
        }

        setIsAdmin(isUserAdmin);

        // ════════════════════════════════════════════════════════════════
        // ADMIN: Permanent Session. Set admin cookie for middleware.
        // ════════════════════════════════════════════════════════════════
        if (isUserAdmin) {
          saveAdminSession(idToken);
          setUser(firebaseUser);
          setSessionToken(null);
          setRemainingMs(Infinity);
          setLoading(false);
          return;
        }

        // ════════════════════════════════════════════════════════════════
        // PARTICIPANT: Tokenized Session. Must log out after 1 hour.
        // ════════════════════════════════════════════════════════════════
        const session: ParticipantSession | null = getParticipantSession();

        // If session is expired or belongs to a different uid:
        if (session && (session.uid !== firebaseUser.uid || Date.now() >= session.expiresAt)) {
          console.warn("Participant session expired (> 1 hour). Auto-logging out.");
          await logout("session_expired");
          setLoading(false);
          return;
        }

        // If no session exists yet:
        if (!session) {
          const isAuthPage =
            typeof window !== "undefined" &&
            (window.location.pathname.startsWith("/login") ||
              window.location.pathname.startsWith("/register"));

          if (isAuthPage) {
            // Hand off to the login/register page handler to create & save token
            setUser(firebaseUser);
            setLoading(false);
            return;
          }

          // Outside auth pages with no token -> session was cleared or expired
          console.warn("No tokenized session found for participant. Logging out.");
          await logout("session_expired");
          setLoading(false);
          return;
        }

        // Active valid participant session
        setUser(firebaseUser);
        setSessionToken(session.token);

        const timeLeft = Math.max(0, session.expiresAt - Date.now());
        setRemainingMs(timeLeft);
        setLoading(false);

        // Set timeout to automatically log out after remaining session duration
        timerRef.current = setTimeout(() => {
          console.warn("Participant 1-hour session limit reached. Auto-logging out.");
          logout("session_expired");
        }, timeLeft);
      });

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        unsubscribe();
      };
    } catch (e) {
      console.warn("Auth state subscription error:", e);
      setLoading(false);
    }
  }, [logout]);

  // Periodic heartbeat every 15 seconds to catch tab sleep / system clock changes
  useEffect(() => {
    if (!user || isAdmin) return;

    const interval = setInterval(() => {
      const remaining = getRemainingSessionMs(isAdmin);
      setRemainingMs(remaining);

      if (remaining <= 0) {
        logout("session_expired");
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [user, isAdmin, logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        sessionToken,
        remainingMs,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
