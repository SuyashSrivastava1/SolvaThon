import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // We use the exact domains you provided
  storageBucket: "solvathon-8d5e3.firebasestorage.app",
  messagingSenderId: "689796429843",
  appId: "1:689796429843:web:1f8de6f245404aa0f7a7e6",
};

// Initialize Firebase securely (avoiding double initialization in Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
