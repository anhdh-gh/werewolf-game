"use client";

import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { type Database, ref, set } from "firebase/database";
import { firebaseApp } from "@/lib/firebase/client";
import { fcmTokenPath } from "@/lib/rooms/paths";

/**
 * Spec §8.2's safety net: "Thông báo đẩy là lưới an toàn. Nếu hệ điều hành
 * vẫn giết trang... FCM đánh thức." Registers this uid's push token so the
 * server can wake a killed tab when it's their turn.
 *
 * Uses getToken() rather than the newer register()/onRegistered() (FID-
 * based) API this SDK version now prefers getToken deprecated in favor
 * of — deliberately: this sandbox has no live Firebase project to test
 * either against, and firebase-admin's send-side support for targeting an
 * FID (vs. the long-established registration-token target) isn't
 * something that could be confirmed here either. getToken()'s token is
 * still fully functional, just no longer the recommended entry point;
 * revisit this once someone with a real project can verify the FID path
 * end to end.
 *
 * Reuses the app's own /sw.js registration (see ServiceWorkerRegister.tsx)
 * rather than letting the SDK auto-register a separate
 * firebase-messaging-sw.js — one service worker, not two competing ones.
 */
export async function requestPushPermission(db: Database, uid: string): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (!(await isSupported().catch(() => false))) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const messaging = getMessaging(firebaseApp);
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    if (!token) return false;
    await set(ref(db, fcmTokenPath(uid)), token);
    return true;
  } catch {
    return false;
  }
}
