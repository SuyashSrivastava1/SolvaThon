import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getAuth, DecodedIdToken } from "firebase-admin/auth";
import { cookies, headers } from "next/headers";

function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccountKey =
    process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    try {
      const parsed =
        typeof serviceAccountKey === "string" ? JSON.parse(serviceAccountKey) : serviceAccountKey;
      return initializeApp({ credential: cert(parsed) });
    } catch (err) {
      console.warn("Failed to parse FIREBASE_ADMIN_SERVICE_ACCOUNT, falling back to projectId:", err);
    }
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "solvathon-8d5e3";

  return initializeApp({ projectId });
}

export function getAdminAuth() {
  const app = getFirebaseAdminApp();
  return getAuth(app);
}

export interface AuthenticatedUser {
  uid: string;
  email: string | null;
}

/**
 * Verifies a Firebase ID token and returns decoded payload.
 */
export async function verifyFirebaseIdToken(token: string): Promise<DecodedIdToken | null> {
  if (!token || typeof token !== "string") return null;
  try {
    const auth = getAdminAuth();
    return await auth.verifyIdToken(token);
  } catch (error: any) {
    console.warn("Firebase ID token verification failed:", error?.message || error);
    return null;
  }
}

/**
 * Resolves the authenticated user from the current Next.js request context (cookies, headers, or passed token).
 * Mitigates CRIT-01 IDOR by validating the caller's server-side identity cryptographically.
 */
export async function getAuthenticatedUser(
  tokenOrUid?: string | null
): Promise<{ user: AuthenticatedUser | null; error: string | null }> {
  let token: string | null = null;

  // 1. Check if tokenOrUid is a JWT token (header.payload.signature)
  if (tokenOrUid && tokenOrUid.includes(".") && tokenOrUid.split(".").length === 3) {
    token = tokenOrUid.trim();
  }

  // 2. Check Authorization header
  if (!token) {
    try {
      const headerList = await headers();
      const authHeader = headerList.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7).trim();
      }
    } catch {
      // headers() may not be available outside request context
    }
  }

  // 3. Check auth_token cookie
  if (!token) {
    try {
      const cookieStore = await cookies();
      const cookie = cookieStore.get("auth_token");
      if (cookie?.value) {
        token = decodeURIComponent(cookie.value);
      }
    } catch {
      // cookies() may not be available outside request context
    }
  }

  if (!token) {
    return {
      user: null,
      error: "Authentication required. Please log in.",
    };
  }

  const decoded = await verifyFirebaseIdToken(token);
  if (!decoded) {
    return {
      user: null,
      error: "Invalid or expired session. Please log in again.",
    };
  }

  // If a specific UID was claimed by the caller, verify it matches the cryptographically verified token
  if (tokenOrUid && !tokenOrUid.includes(".") && tokenOrUid !== decoded.uid) {
    return {
      user: null,
      error: "Unauthorized: Request identity does not match authenticated user.",
    };
  }

  return {
    user: {
      uid: decoded.uid,
      email: decoded.email || null,
    },
    error: null,
  };
}
