
import { type FirebaseApp } from "firebase/app";
import { type Auth } from "firebase/auth";
import { type Firestore } from "firebase/firestore";

// Firebase has been removed from this project.
// This file is kept to prevent import errors in other files that may not have been updated.

export const app: FirebaseApp | undefined = undefined;
export const auth: Auth | undefined = undefined;
export const db: Firestore | undefined = undefined;

export function isFirebaseEnabled(): boolean {
  return false;
}
