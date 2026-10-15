import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

if (process.env.NODE_ENV === "development" && (!firebaseConfig.apiKey || !firebaseConfig.projectId)) {
  console.warn("Missing required Firebase client environment variables in .env");
}

// Initialize Firebase securely (avoiding double initialization in Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let auth: any;
try {
  auth = getAuth(app);
} catch (error) {
  console.warn("Firebase Auth initialization error:", error);
  auth = { app } as any;
}

export { app, auth };
