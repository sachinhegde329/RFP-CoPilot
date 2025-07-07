
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Using let for conditional initialization
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

const firebaseConfigString = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
let firebaseConfig = {};
let firebaseEnabled = false;

if (firebaseConfigString) {
  try {
    firebaseConfig = JSON.parse(firebaseConfigString);
    if (Object.keys(firebaseConfig).length > 0) {
        firebaseEnabled = true;
    }
  } catch (error) {
    console.error("Could not parse Firebase config:", error);
  }
}

if (firebaseEnabled) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    console.error("Firebase initialization failed:", e);
    firebaseEnabled = false;
  }
}

if (!firebaseEnabled) {
  console.warn("Firebase is not configured or failed to initialize. The application will run in a limited demo mode.");
}

export function isFirebaseEnabled(): boolean {
  return firebaseEnabled;
}

export { app, auth, db };
