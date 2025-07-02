
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// This file is now intended for SERVER-SIDE USE ONLY.
// Client-side components should use the `useFirebase` hook from the FirebaseProvider.

const firebaseConfig: FirebaseOptions = process.env.FIREBASE_CONFIG
  ? JSON.parse(process.env.FIREBASE_CONFIG)
  : {};

// Initialize Firebase for server-side environments (e.g., Server Actions, API routes)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
