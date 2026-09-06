import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirebaseConfig } from "./config";

// Next.js only statically inlines the literal pattern `process.env.NEXT_PUBLIC_X`
// wherever it appears directly in source — it does not trace `process.env` being
// passed through a function argument. getFirebaseConfig(process.env) therefore
// silently received an empty object in the client bundle (process.env, remaining
// unresolved, gets stripped rather than kept as a real reference in
// client-side code), so every required key was reported missing at runtime.
// Each key must be referenced as its own literal `process.env.NEXT_PUBLIC_*`
// expression here for the build to replace it with the real value.
const config = getFirebaseConfig({
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_DATABASE_URL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

export const firebaseApp = getApps().length ? getApp() : initializeApp(config);
export const auth = getAuth(firebaseApp);
export const db = getDatabase(firebaseApp);
