import { isAdminEmail } from "@/config/admin";

export const SESSION_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour in milliseconds
export const SESSION_MAX_AGE_SECONDS = 3600; // 1 hour in seconds
export const SESSION_STORAGE_KEY = "solvathon_auth_token";
export const SESSION_COOKIE_NAME = "auth_token";

export interface ParticipantSession {
  token: string;
  uid: string;
  email: string | null;
  issuedAt: number;
  expiresAt: number;
}

/**
 * Saves a 1-hour tokenized session for a regular participant.
 * Admins are permanent and do not use expiring participant sessions.
 */
export function saveParticipantSession(
  user: { uid: string; email?: string | null },
  token: string
): ParticipantSession | null {
  if (typeof window === "undefined") return null;

  // Admin sessions are permanent - no expiring participant token
  if (isAdminEmail(user.email)) {
    clearParticipantSession();
    return null;
  }

  const now = Date.now();
  const session: ParticipantSession = {
    token,
    uid: user.uid,
    email: user.email || null,
    issuedAt: now,
    expiresAt: now + SESSION_MAX_AGE_MS,
  };

  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    // Also store token in browser cookies for 1 hour
    document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(
      token
    )}; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; SameSite=Lax`;
  } catch (err) {
    console.warn("Failed to persist participant session:", err);
  }

  return session;
}

/**
 * Retrieves the stored participant session from localStorage.
 */
export function getParticipantSession(): ParticipantSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed: ParticipantSession = JSON.parse(raw);
    if (!parsed || !parsed.token || !parsed.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Validates whether the participant session is still within its 1-hour validity window.
 */
export function isParticipantSessionValid(userEmail?: string | null): boolean {
  // Admin is permanent - always valid, no token required
  if (isAdminEmail(userEmail)) {
    return true;
  }

  const session = getParticipantSession();
  if (!session) return false;
  return Date.now() < session.expiresAt;
}

/**
 * Calculates remaining session duration in milliseconds.
 * Returns Infinity for permanent admin users.
 */
export function getRemainingSessionMs(userEmail?: string | null): number {
  if (isAdminEmail(userEmail)) {
    return Infinity;
  }

  const session = getParticipantSession();
  if (!session) return 0;
  return Math.max(0, session.expiresAt - Date.now());
}

/**
 * Clears the participant session token from localStorage and cookies.
 */
export function clearParticipantSession(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  } catch (err) {
    console.warn("Failed to clear participant session:", err);
  }
}
