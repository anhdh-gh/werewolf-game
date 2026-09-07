import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getDatabase, type Database } from "firebase-admin/database";
import { getMessaging, type Messaging } from "firebase-admin/messaging";

let app: App | undefined;

/**
 * Lazily initializes the Admin SDK from FIREBASE_SERVICE_ACCOUNT_KEY (a raw
 * service account JSON string) — set only in Vercel, never exposed to the
 * client. Every server-authoritative route (spec §6.2) calls adminDb()
 * instead of importing src/lib/firebase/client.ts, since the Admin SDK
 * bypasses Security Rules entirely and must never be reachable from code
 * that also runs in the browser.
 */
function getAdminApp(): App {
  if (app) return app;
  if (getApps().length > 0) {
    app = getApps()[0];
    return app;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  if (!serviceAccountKey || !databaseURL) {
    throw new Error(
      "Thiếu FIREBASE_SERVICE_ACCOUNT_KEY hoặc NEXT_PUBLIC_FIREBASE_DATABASE_URL — " +
        "route này chạy bằng Admin SDK, không có thì không gọi được RTDB.",
    );
  }

  app = initializeApp({
    credential: cert(JSON.parse(serviceAccountKey)),
    databaseURL,
  });
  return app;
}

export function adminDb(): Database {
  return getDatabase(getAdminApp());
}

/** Spec §8.2's safety net: FCM, for whenever the audio-keepalive trick
 * doesn't hold (OS killed the tab anyway). Same credential source as
 * adminDb() — no separate setup. */
export function adminMessaging(): Messaging {
  return getMessaging(getAdminApp());
}
