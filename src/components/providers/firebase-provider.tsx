'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

type FirebaseContextType = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
} | null;

const FirebaseContext = createContext<FirebaseContextType>(null);

export function FirebaseProvider({
  children,
  firebaseConfig,
}: {
  children: React.ReactNode;
  firebaseConfig?: FirebaseOptions;
}) {
  const firebase = useMemo(() => {
    if (!firebaseConfig || Object.keys(firebaseConfig).length === 0) {
      return null;
    }
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);
    const db = getFirestore(app);
    return { app, auth, db };
  }, [firebaseConfig]);

  return (
    <FirebaseContext.Provider value={firebase}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}
