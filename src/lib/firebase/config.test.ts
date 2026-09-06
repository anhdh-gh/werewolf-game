import { describe, it, expect } from "vitest";
import { getFirebaseConfig } from "./config";

const FULL_ENV = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "key",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "auth-domain",
  NEXT_PUBLIC_FIREBASE_DATABASE_URL: "db-url",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "project-id",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "bucket",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "sender-id",
  NEXT_PUBLIC_FIREBASE_APP_ID: "app-id",
};

describe("getFirebaseConfig", () => {
  it("maps env vars to a Firebase config object", () => {
    expect(getFirebaseConfig(FULL_ENV)).toEqual({
      apiKey: "key",
      authDomain: "auth-domain",
      databaseURL: "db-url",
      projectId: "project-id",
      storageBucket: "bucket",
      messagingSenderId: "sender-id",
      appId: "app-id",
    });
  });

  it("throws listing every missing key", () => {
    const { NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_APP_ID, ...rest } = FULL_ENV;
    expect(() => getFirebaseConfig(rest)).toThrow(
      /NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_APP_ID/,
    );
  });
});
