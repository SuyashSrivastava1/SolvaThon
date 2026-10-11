import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyA0B1C2D3E4F5G6H7I8J9K0L1M2N3O4P5Q",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "solvathon-8d5e3.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "solvathon-8d5e3",
  // We use the exact domains you provided
  storageBucket: "solvathon-8d5e3.firebasestorage.app",
  messagingSenderId: "689796429843",
  appId: "1:689796429843:web:1f8de6f245404aa0f7a7e6",
};

// Initialize Firebase securely (avoiding double initialization in Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let auth: any;
try {
  auth = getAuth(app);
} catch (error) {
  console.warn("Firebase Auth could not initialize with current API key:", error);
  auth = { app } as any;
}

export { app, auth };
