# Foundation & Lobby Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the connectivity spine of Ma Sói PWA — a deployed Next.js app where a
player signs in with Google, creates or joins a room by code, and sees the member list
update live (including who just went offline), with no game rules yet.

**Architecture:** Next.js (App Router, TypeScript) on Vercel. Firebase Realtime Database is
the only realtime channel — clients write room/member/presence data directly to it, gated
by Security Rules; there is no backend API in this plan (the phase-advance API belongs to
the Game Engine sub-project). Firebase Auth (Google provider) is the only sign-in method.

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, Firebase JS SDK v9 modular (`firebase/app`,
`firebase/auth`, `firebase/database`), Vitest, `@firebase/rules-unit-testing`, Firebase
Emulator Suite.

**Spec:** `docs/superpowers/specs/2026-09-05-werewolf-pwa-design.md`

## Global Constraints

- Stack is fixed: Next.js on Vercel + Firebase Realtime Database (not Firestore) + Firebase
  Auth, Google provider only. No other sign-in method.
- No host role. The room creator has no special privileges; any member can act on the room
  while it is in `LOBBY`.
- Room size is 4–16 players (spec §4.2).
- Firebase Spark (free) plan only — no API or SDK call in this plan may require Blaze.
- Vắng mặt (disconnect, backgrounding) must never be reported as anything stronger than
  "away" at this layer. This plan does not implement death — it only implements presence
  (`online: boolean`), which the Game Engine sub-project will later read.
- The app must be installable as a PWA (spec §9) — this plan ships the manifest and icons;
  the audio-keep-alive and push work belongs to the Resilience sub-project.
- The Firebase Realtime Database emulator is a Java process and needs a JVM on `PATH`. This
  machine has no system JVM and no root, but carries an unused Temurin JDK 21 at
  `/home/anhdh/.local/jdk/jdk-21.0.12.1+1`. Any task that starts the emulator must export
  `JAVA_HOME` to that directory and prepend `$JAVA_HOME/bin` to `PATH` in its own shell.
  Do not bake that absolute path into `package.json` or any committed config — it is
  specific to this machine and would break for anyone else.
- Infrastructure already exists and must be reused, not recreated:
  - Firebase project `werewolf-game-2026`, RTDB instance
    `werewolf-game-2026-default-rtdb` in `asia-southeast1`, Google sign-in already enabled.
  - Vercel project `werewolf-game`, linked to `github.com/anhdh-gh/werewolf-game`, domain
    `wolf.anhdh.net` attached, `NEXT_PUBLIC_FIREBASE_*` env vars already set for
    Production/Preview/Development.
  - `.firebaserc` and `firebase.json` (with a locked-down `database.rules.json`) already
    exist at the repo root.
- Every task ends with a commit. Push after each task so Vercel's GitHub integration
  deploys it — do not batch multiple tasks into one push.

---

## File Structure

```
src/
  types/
    room.ts               Room, RoomMember, RoomSettings, Presence types
  lib/
    firebase/
      config.ts            reads NEXT_PUBLIC_FIREBASE_* into a typed, validated object
      client.ts             initializeApp/getAuth/getDatabase singletons
    rooms/
      paths.ts               RTDB path builders
      roomCode.ts             room code generation
      createRoom.ts           create-room transaction + collision retry
      joinRoom.ts             join-room transaction
      useRoom.ts              hook: subscribe to a room, expose { room, loading, error }
    presence/
      presence.ts             attach/detach onDisconnect-based presence
    auth/
      AuthProvider.tsx        React context: { user, loading, signInWithGoogle, signOut }
      useAuth.ts              hook to consume the context
  app/
    layout.tsx                root layout, wraps AuthProvider, manifest link
    page.tsx                  sign-in gate + create/join room form
    room/[code]/page.tsx       lobby screen
  components/
    RoomLobby.tsx              member list, ready button, leave button, copy code
    InstallPrompt.tsx          PWA install banner
public/
  manifest.webmanifest
  icons/icon.svg
firebase.json                  (extend existing: add emulators block)
database.rules.json            (replace existing locked-down rules with v1 rules)
vitest.config.ts
.env.example
```

Files that change together stay together: everything about rooms (types, paths, code
generation, create/join, the subscription hook) lives under `src/lib/rooms/`. Presence is
split out because it is conceptually independent (it only needs a uid and a room code, not
room CRUD) and will be reused unchanged by every later sub-project.

---

### Task 1: Scaffold Next.js + TypeScript + Tailwind + shadcn/ui

**Files:**
- Create: `package.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`,
  `src/app/globals.css`, `postcss.config.mjs`, `.env.example`, `components.json`, `src/lib/utils.ts`,
  `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/label.tsx`,
  `src/components/ui/card.tsx` (the last five are generated by the `shadcn` CLI in Step 5 —
  do not hand-write them)
- Modify: `tsconfig.json` (auto-generated by Next.js in Step 4, then hand-edited in Step 4b)

**Interfaces:**
- Produces: a runnable Next.js app (`npm run dev`, `npm run build`) with the `@/*` import
  alias resolving to `./src/*`, and shadcn/ui's `Button`, `Input`, `Label`, `Card` components
  ready to import from `@/components/ui/*` — every later task's UI is built from these.

- [ ] **Step 1: Initialize package.json and install core dependencies**

```bash
cd /home/anhdh/work/invidiual/werewolf-game
npm init -y
npm pkg set name="werewolf-game" private=true
npm install next@latest react@latest react-dom@latest firebase@latest
npm install -D typescript@latest @types/node@latest @types/react@latest @types/react-dom@latest tailwindcss@latest @tailwindcss/postcss@latest
```

- [ ] **Step 2: Add npm scripts**

```bash
npm pkg set scripts.dev="next dev"
npm pkg set scripts.build="next build"
npm pkg set scripts.start="next start"
npm pkg set scripts.test="vitest run"
```

- [ ] **Step 3: Create a minimal app shell**

Keep this shell minimal — shadcn's `init` (Step 5) rewrites `globals.css` to add its own
theme tokens, and Task 1's Step 6 replaces the theme block with the game's palette. Do not
hand-author the dark theme here.

`src/app/globals.css`:

```css
@import "tailwindcss";
```

`postcss.config.mjs`:

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

`next.config.ts` — the app needs no custom Next.js configuration, but this file must exist on
disk: the `shadcn` CLI's framework detector (Step 5) looks for a `next.config.*` file and
refuses to run without one, a bare `"next"` dependency in `package.json` is not enough.

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

`src/app/layout.tsx`:

```tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ma Sói",
  description: "Ma sói chơi cùng bàn hoặc từ xa",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
```

`src/app/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-bold">Ma Sói</h1>
    </main>
  );
}
```

- [ ] **Step 4: Generate tsconfig.json, then add the `@/*` path alias**

Run: `npx next build`
Expected: build succeeds; `tsconfig.json` and `next-env.d.ts` are auto-generated. The build
output is discarded — this run exists only to produce `tsconfig.json`.

- [ ] **Step 4b: Add the import alias**

Next.js's auto-generated `tsconfig.json` has no `paths` mapping. Every later task imports
via `@/...` (e.g. `@/lib/firebase/client`, `@/components/RoomLobby`), and the shadcn CLI in
Step 5 also needs this alias to exist. Open `tsconfig.json` and add a `paths` key inside the
existing `compilerOptions` object:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

(Add this key alongside the existing auto-generated `compilerOptions` entries — do not
remove or reorder the others.)

- [ ] **Step 5: Initialize shadcn/ui and add the base components**

```bash
npx shadcn@latest init -d
npx shadcn@latest add button input label card
```

Expected: `components.json` is created; `src/lib/utils.ts` (the `cn()` helper) and
`src/components/ui/{button,input,label,card}.tsx` are generated; `globals.css` gains a
`@theme inline` block with shadcn's default zinc theme tokens.

- [ ] **Step 6: Apply the game's palette**

Replace the `@theme inline` block that Step 5 added to `src/app/globals.css` with the same
token names, dark-first (this app has no light mode — it is a single always-dark theme):

```css
@theme inline {
  --color-background: oklch(0.09 0 0);
  --color-foreground: oklch(0.95 0 0);
  --color-card: oklch(0.16 0.01 30);
  --color-card-foreground: oklch(0.95 0 0);
  --color-primary: oklch(0.45 0.19 25);
  --color-primary-foreground: oklch(0.98 0 0);
  --color-secondary: oklch(0.24 0 0);
  --color-secondary-foreground: oklch(0.95 0 0);
  --color-muted: oklch(0.22 0 0);
  --color-muted-foreground: oklch(0.65 0 0);
  --color-accent: oklch(0.24 0 0);
  --color-accent-foreground: oklch(0.95 0 0);
  --color-destructive: oklch(0.45 0.19 25);
  --color-border: oklch(0.28 0 0);
  --color-input: oklch(0.28 0 0);
  --color-ring: oklch(0.45 0.19 25);
  --radius: 0.625rem;
  --radius-sm: calc(var(--radius) * 0.75);
  --radius-md: calc(var(--radius) * 0.875);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.5);
}
```

Leave any `@layer base` rules Step 5 added below this block untouched. In `src/app/layout.tsx`,
add `className="dark"` to the `<html>` tag so shadcn's dark-mode tokens apply unconditionally:

```tsx
<html lang="vi" className="dark">
```

- [ ] **Step 7: Write `.env.example`**

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

- [ ] **Step 8: Verify the build**

Run: `npx next build`
Expected: build succeeds.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json next.config.ts src/app postcss.config.mjs .env.example tsconfig.json next-env.d.ts components.json src/lib/utils.ts src/components/ui
git commit -m "feat: scaffold Next.js app with Tailwind and shadcn/ui"
git push -u origin HEAD
```

---

### Task 2: Vitest + Firebase Emulator test harness

**Files:**
- Create: `vitest.config.ts`, `firebase.json` (add `emulators` block to the existing file),
  `src/lib/rooms/paths.test.ts` (trivial smoke test only — real content in Task 3)

**Interfaces:**
- Produces: `npm test` runs Vitest. `npm run emulators` starts the Firebase RTDB + Auth
  emulators that every later emulator-backed test connects to.

- [ ] **Step 1: Install test dependencies**

```bash
npm install -D vitest@latest @firebase/rules-unit-testing@latest firebase-tools@latest
```

- [ ] **Step 2: Add emulator config to firebase.json**

Read the existing `firebase.json`, then add the `emulators` key alongside the existing
`database` key (do not remove `database`):

```json
{
  "database": {
    "rules": "database.rules.json"
  },
  "emulators": {
    "database": { "port": 9000 },
    "auth": { "port": 9099 },
    "ui": { "enabled": true, "port": 4000 }
  }
}
```

- [ ] **Step 3: Add the emulator npm script**

```bash
npm pkg set scripts.emulators="firebase emulators:start --only database,auth --project werewolf-game-2026"
```

- [ ] **Step 4: Write vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    // Task 6's rules.test.ts calls clearDatabase() against the same emulator
    // namespace Tasks 8-10's tests write to. Running test files in parallel
    // would let that wipe collide with another file's in-flight assertions.
    fileParallelism: false,
  },
});
```

- [ ] **Step 5: Write a trivial smoke test**

`src/lib/rooms/paths.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("test harness", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Run the smoke test**

Run: `npx vitest run`
Expected: 1 passed.

- [ ] **Step 7: Commit**

```bash
git add vitest.config.ts firebase.json package.json package-lock.json src/lib/rooms/paths.test.ts
git commit -m "test: add Vitest and Firebase Emulator harness"
git push
```

---

### Task 3: Types and RTDB path helpers

**Files:**
- Create: `src/types/room.ts`, `src/lib/rooms/paths.ts`
- Modify: `src/lib/rooms/paths.test.ts` (replace the smoke test with real tests)

**Interfaces:**
- Produces:
  - `Room`, `RoomMember`, `RoomSettings`, `RoomStatus`, `Presence`, `OPTIONAL_ROLE_KEYS`,
    `OptionalRoleKey` (from `src/types/room.ts`)
  - `roomPath(code)`, `roomMembersPath(code)`, `roomMemberPath(code, uid)`,
    `roomSettingsPath(code)`, `roomStatusPath(code)`, `presencePath(uid)` (from
    `src/lib/rooms/paths.ts`), each returning a `string` with no leading or trailing slash.

- [ ] **Step 1: Write the failing tests**

`src/lib/rooms/paths.test.ts` (replaces the Task 2 smoke test):

```ts
import { describe, it, expect } from "vitest";
import {
  roomPath,
  roomMembersPath,
  roomMemberPath,
  roomSettingsPath,
  roomStatusPath,
  presencePath,
} from "./paths";

describe("rtdb paths", () => {
  it("builds room paths", () => {
    expect(roomPath("ABC123")).toBe("rooms/ABC123");
    expect(roomMembersPath("ABC123")).toBe("rooms/ABC123/members");
    expect(roomMemberPath("ABC123", "uid-1")).toBe("rooms/ABC123/members/uid-1");
    expect(roomSettingsPath("ABC123")).toBe("rooms/ABC123/settings");
    expect(roomStatusPath("ABC123")).toBe("rooms/ABC123/status");
  });

  it("builds presence paths", () => {
    expect(presencePath("uid-1")).toBe("presence/uid-1");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/rooms/paths.test.ts`
Expected: FAIL — `Cannot find module './paths'`

- [ ] **Step 3: Write the types**

`src/types/room.ts`:

```ts
export type RoomStatus = "LOBBY" | "PLAYING" | "ENDED";

export const OPTIONAL_ROLE_KEYS = ["BODYGUARD", "CURSED", "MUTER", "TANNER"] as const;
export type OptionalRoleKey = (typeof OPTIONAL_ROLE_KEYS)[number];

export interface RoomSettings {
  maxPlayers: number;
  rolesEnabled: Record<OptionalRoleKey, boolean>;
}

export interface RoomMember {
  name: string;
  photoURL: string | null;
  joinedAt: number;
  ready: boolean;
  online: boolean;
}

export interface Room {
  createdAt: number;
  status: RoomStatus;
  settings: RoomSettings;
  members: Record<string, RoomMember>;
  currentGameId?: string;
}

export interface Presence {
  online: boolean;
  lastSeen: number | object;
  roomCode: string | null;
}
```

- [ ] **Step 4: Write the path helpers**

`src/lib/rooms/paths.ts`:

```ts
export const roomPath = (code: string): string => `rooms/${code}`;
export const roomMembersPath = (code: string): string => `rooms/${code}/members`;
export const roomMemberPath = (code: string, uid: string): string =>
  `rooms/${code}/members/${uid}`;
export const roomSettingsPath = (code: string): string => `rooms/${code}/settings`;
export const roomStatusPath = (code: string): string => `rooms/${code}/status`;
export const presencePath = (uid: string): string => `presence/${uid}`;
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/lib/rooms/paths.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 6: Commit**

```bash
git add src/types/room.ts src/lib/rooms/paths.ts src/lib/rooms/paths.test.ts
git commit -m "feat: add room types and RTDB path helpers"
git push
```

---

### Task 4: Room code generator

**Files:**
- Create: `src/lib/rooms/roomCode.ts`, `src/lib/rooms/roomCode.test.ts`

**Interfaces:**
- Produces: `generateRoomCode(length = 6): string` — uppercase alphanumeric, excludes
  `0`, `O`, `1`, `I` to avoid misreads when a code is read aloud.

- [ ] **Step 1: Write the failing test**

`src/lib/rooms/roomCode.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { generateRoomCode, ROOM_CODE_ALPHABET } from "./roomCode";

describe("generateRoomCode", () => {
  it("generates a 6-character code by default", () => {
    expect(generateRoomCode()).toHaveLength(6);
  });

  it("generates a code of the requested length", () => {
    expect(generateRoomCode(8)).toHaveLength(8);
  });

  it("only uses characters from the safe alphabet", () => {
    const code = generateRoomCode(50);
    for (const char of code) {
      expect(ROOM_CODE_ALPHABET).toContain(char);
    }
  });

  it("excludes ambiguous characters", () => {
    for (const ambiguous of ["0", "O", "1", "I"]) {
      expect(ROOM_CODE_ALPHABET).not.toContain(ambiguous);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/rooms/roomCode.test.ts`
Expected: FAIL — `Cannot find module './roomCode'`

- [ ] **Step 3: Write the implementation**

`src/lib/rooms/roomCode.ts`:

```ts
export const ROOM_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateRoomCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * ROOM_CODE_ALPHABET.length);
    code += ROOM_CODE_ALPHABET[index];
  }
  return code;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/rooms/roomCode.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/rooms/roomCode.ts src/lib/rooms/roomCode.test.ts
git commit -m "feat: add room code generator"
git push
```

---

### Task 5: Firebase client config and SDK init

**Files:**
- Create: `src/lib/firebase/config.ts`, `src/lib/firebase/config.test.ts`,
  `src/lib/firebase/client.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `getFirebaseConfig(env: Record<string, string | undefined>): FirebaseConfig` — throws
    `Error` listing every missing key if any `NEXT_PUBLIC_FIREBASE_*` var is absent.
  - `firebaseApp`, `auth`, `db` — singletons exported from `src/lib/firebase/client.ts`,
    used by every later task that talks to Firebase.

- [ ] **Step 1: Write the failing test**

`src/lib/firebase/config.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/firebase/config.test.ts`
Expected: FAIL — `Cannot find module './config'`

- [ ] **Step 3: Write the implementation**

`src/lib/firebase/config.ts`:

```ts
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const REQUIRED_KEYS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_DATABASE_URL",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

export function getFirebaseConfig(
  env: Record<string, string | undefined>,
): FirebaseConfig {
  const missing = REQUIRED_KEYS.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Thiếu biến môi trường Firebase: ${missing.join(", ")}`);
  }

  return {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    databaseURL: env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/firebase/config.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Write the client SDK init (not unit tested — thin wiring)**

`src/lib/firebase/client.ts`:

```ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirebaseConfig } from "./config";

const config = getFirebaseConfig(process.env);

export const firebaseApp = getApps().length ? getApp() : initializeApp(config);
export const auth = getAuth(firebaseApp);
export const db = getDatabase(firebaseApp);
```

- [ ] **Step 6: Verify the build still succeeds**

Run: `npx next build`
Expected: build succeeds (env vars are already set in Vercel; for local builds, copy
`.env.example` to `.env.local` and fill in the values from `firebase apps:sdkconfig WEB
<appId> --project werewolf-game-2026`).

- [ ] **Step 7: Commit**

```bash
git add src/lib/firebase/config.ts src/lib/firebase/config.test.ts src/lib/firebase/client.ts
git commit -m "feat: add Firebase client config and SDK init"
git push
```

---

### Task 6: Security Rules v1

**Files:**
- Modify: `database.rules.json` (replace the locked-down placeholder)
- Create: `src/test/rules.test.ts`

**Interfaces:**
- Produces: the deployed rule shape every later task's emulator tests run against. No code
  interface — this task's contract is the rules file itself.

This task requires the emulator running in the background for its own test run.

- [ ] **Step 1: Write the failing rules tests**

`src/test/rules.test.ts`:

```ts
import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { ref, set, get, update } from "firebase/database";

let testEnv: RulesTestEnvironment;

const EXISTING_ROOM = {
  createdAt: 1000,
  status: "LOBBY",
  settings: { maxPlayers: 8, rolesEnabled: { BODYGUARD: true, CURSED: true, MUTER: true, TANNER: true } },
  members: {
    "uid-owner": { name: "Owner", photoURL: null, joinedAt: 1000, ready: false, online: true },
  },
};

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "werewolf-rules-test",
    database: {
      rules: readFileSync("database.rules.json", "utf8"),
      host: "127.0.0.1",
      port: 9000,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearDatabase();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await set(ref(context.database(), "rooms/EXIST1"), EXISTING_ROOM);
  });
});

describe("rooms/$code", () => {
  it("denies read to an unauthenticated client", async () => {
    const db = testEnv.unauthenticatedContext().database();
    await assertFails(get(ref(db, "rooms/EXIST1")));
  });

  it("allows read to any authenticated client", async () => {
    const db = testEnv.authenticatedContext("uid-other").database();
    await assertSucceeds(get(ref(db, "rooms/EXIST1")));
  });

  it("allows creating a brand new room's status/createdAt/member together", async () => {
    const db = testEnv.authenticatedContext("uid-new").database();
    await assertSucceeds(
      Promise.all([
        set(ref(db, "rooms/NEWROOM/status"), "LOBBY"),
        set(ref(db, "rooms/NEWROOM/createdAt"), 2000),
        set(ref(db, "rooms/NEWROOM/members/uid-new"), {
          name: "New",
          photoURL: null,
          joinedAt: 2000,
          ready: false,
          online: true,
        }),
      ]),
    );
  });

  it("denies overwriting an existing room's status", async () => {
    const db = testEnv.authenticatedContext("uid-owner").database();
    await assertFails(set(ref(db, "rooms/EXIST1/status"), "PLAYING"));
  });

  it("allows a member to write their own member node", async () => {
    const db = testEnv.authenticatedContext("uid-owner").database();
    await assertSucceeds(
      set(ref(db, "rooms/EXIST1/members/uid-owner/ready"), true),
    );
  });

  it("denies writing someone else's member node", async () => {
    const db = testEnv.authenticatedContext("uid-owner").database();
    await assertFails(
      set(ref(db, "rooms/EXIST1/members/uid-someone-else"), {
        name: "Intruder",
        photoURL: null,
        joinedAt: 3000,
        ready: false,
        online: true,
      }),
    );
  });

  it("allows an existing member to update settings while in LOBBY", async () => {
    const db = testEnv.authenticatedContext("uid-owner").database();
    await assertSucceeds(set(ref(db, "rooms/EXIST1/settings/maxPlayers"), 10));
  });

  it("denies a non-member from updating settings", async () => {
    const db = testEnv.authenticatedContext("uid-outsider").database();
    await assertFails(set(ref(db, "rooms/EXIST1/settings/maxPlayers"), 10));
  });

  it("denies any client from writing currentGameId", async () => {
    const db = testEnv.authenticatedContext("uid-owner").database();
    await assertFails(set(ref(db, "rooms/EXIST1/currentGameId"), "game-1"));
  });

  // RTDB evaluates a set()/transaction's write permission by walking from its
  // exact target path up to root only — it never separately consults a
  // descendant leaf's own .write rule for a single nested write. A room can
  // therefore never be created with one set()/transaction at rooms/$code,
  // no matter what the leaf rules below it allow. This test documents that
  // constraint so it isn't mistaken for a bug later.
  it("denies a single nested set() at the room root, even with fully valid data", async () => {
    const db = testEnv.authenticatedContext("uid-solo2").database();
    await assertFails(
      set(ref(db, "rooms/SOLO02"), {
        createdAt: 5000,
        status: "LOBBY",
        settings: {
          maxPlayers: 8,
          rolesEnabled: { BODYGUARD: true, CURSED: true, MUTER: true, TANNER: true },
        },
        members: {
          "uid-solo2": {
            name: "Solo2",
            photoURL: null,
            joinedAt: 5000,
            ready: false,
            online: true,
          },
        },
      }),
    );
  });

  // This is the pattern createRoom (Task 8) actually uses: claim the code by
  // transacting on the status leaf alone (it already carries its own
  // "!data.exists()" rule), then fill in the rest with a multi-path
  // update() — each key of an update() is evaluated independently against
  // its own leaf rule, unlike a single set(). The settings rule's
  // newData.parent() sees the room's state as it resolves at the end of
  // this update(), including the members key written in the same call.
  it("allows the two-step creation pattern: claim the status leaf, then multi-path update", async () => {
    const db = testEnv.authenticatedContext("uid-solo").database();

    await assertSucceeds(set(ref(db, "rooms/SOLO01/status"), "LOBBY"));

    await assertSucceeds(
      update(ref(db), {
        "rooms/SOLO01/createdAt": 5000,
        "rooms/SOLO01/settings": {
          maxPlayers: 8,
          rolesEnabled: { BODYGUARD: true, CURSED: true, MUTER: true, TANNER: true },
        },
        "rooms/SOLO01/members/uid-solo": {
          name: "Solo",
          photoURL: null,
          joinedAt: 5000,
          ready: false,
          online: true,
        },
      }),
    );
  });

  it("denies writing settings into a room the writer is not a member of", async () => {
    const db = testEnv.authenticatedContext("uid-ghost").database();
    await assertFails(
      set(ref(db, "rooms/GHOST1/settings"), { maxPlayers: 8, rolesEnabled: {} }),
    );
  });

  // Writing null is a delete in RTDB, and .validate never runs on deletes —
  // only .write governs whether a deletion is permitted. This is denied by
  // the settings rule's newData.exists() guard, not by .validate: settings
  // must never disappear from a room, matching Room.settings being a
  // required (non-optional) field in src/types/room.ts.
  it("denies deleting settings entirely", async () => {
    const db = testEnv.authenticatedContext("uid-owner").database();
    await assertFails(set(ref(db, "rooms/EXIST1/settings"), null));
  });

  // This one exercises .validate directly: a non-deleting payload (has
  // children) that is still the wrong shape.
  it("denies a settings write missing rolesEnabled", async () => {
    const db = testEnv.authenticatedContext("uid-owner").database();
    await assertFails(set(ref(db, "rooms/EXIST1/settings"), { maxPlayers: 8 }));
  });

  it("denies a settings write with maxPlayers out of range", async () => {
    const db = testEnv.authenticatedContext("uid-owner").database();
    await assertFails(set(ref(db, "rooms/EXIST1/settings/maxPlayers"), 99));
  });
});

describe("presence/$uid", () => {
  it("allows a user to write their own presence", async () => {
    const db = testEnv.authenticatedContext("uid-owner").database();
    await assertSucceeds(
      set(ref(db, "presence/uid-owner"), { online: true, lastSeen: 1000, roomCode: "EXIST1" }),
    );
  });

  it("denies writing someone else's presence", async () => {
    const db = testEnv.authenticatedContext("uid-owner").database();
    await assertFails(
      set(ref(db, "presence/uid-someone-else"), { online: true, lastSeen: 1000, roomCode: null }),
    );
  });
});
```

- [ ] **Step 2: Start the emulator in the background**

Run: `npm run emulators` (leave running in a separate terminal/background process for the
rest of this task)

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run src/test/rules.test.ts`
Expected: FAIL — the current locked-down rules (`.read: false, .write: false`) reject every
`assertSucceeds` case.

- [ ] **Step 4: Write the rules**

`database.rules.json`:

```json
{
  "rules": {
    "rooms": {
      "$code": {
        ".read": "auth != null",
        "members": {
          "$uid": {
            ".write": "auth != null && auth.uid === $uid"
          }
        },
        "settings": {
          ".write": "auth != null && newData.exists() && newData.parent().child('members').child(auth.uid).exists() && newData.parent().child('status').val() === 'LOBBY'",
          ".validate": "newData.hasChildren(['maxPlayers', 'rolesEnabled']) && newData.child('maxPlayers').isNumber() && newData.child('maxPlayers').val() >= 4 && newData.child('maxPlayers').val() <= 16 && newData.child('rolesEnabled').hasChildren(['BODYGUARD', 'CURSED', 'MUTER', 'TANNER'])"
        },
        "status": {
          ".write": "auth != null && !data.exists()",
          ".validate": "newData.val() === 'LOBBY'"
        },
        "createdAt": {
          ".write": "auth != null && !data.exists()"
        },
        "currentGameId": {
          ".write": false
        }
      }
    },
    "presence": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid === $uid"
      }
    }
  }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/test/rules.test.ts`
Expected: PASS, 17 tests.

- [ ] **Step 6: Deploy the rules to the real project**

Run: `firebase deploy --only database --project werewolf-game-2026`
Expected: `Deploy complete!`

- [ ] **Step 7: Commit**

```bash
git add database.rules.json src/test/rules.test.ts
git commit -m "feat: add v1 Security Rules for rooms and presence"
git push
```

---

### Task 7: Google sign-in

**Files:**
- Create: `src/lib/auth/AuthProvider.tsx`, `src/lib/auth/useAuth.ts`,
  `src/lib/auth/useAuth.test.ts`
- Modify: `src/app/layout.tsx` (wrap children in `AuthProvider`), `src/app/page.tsx`
  (sign-in gate)

**Interfaces:**
- Consumes: `auth` from `src/lib/firebase/client.ts` (Task 5).
- Produces: `useAuth(): { user: User | null; loading: boolean; signInWithGoogle: () =>
  Promise<void>; signOut: () => Promise<void> }`, consumed by every later page that needs
  the current user's `uid`/`displayName`/`photoURL`.

- [ ] **Step 1: Write the failing test**

`src/lib/auth/useAuth.test.ts` mocks `firebase/auth` so the state machine is tested without
a real popup:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const mockOnAuthStateChanged = vi.fn();
const mockSignInWithPopup = vi.fn();
const mockSignOut = vi.fn();

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
  signInWithPopup: (...args: unknown[]) => mockSignInWithPopup(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
  GoogleAuthProvider: vi.fn(() => ({})),
}));

vi.mock("../firebase/client", () => ({ auth: {} }));

import { AuthProvider } from "./AuthProvider";
import { useAuth } from "./useAuth";
import type { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("useAuth", () => {
  beforeEach(() => {
    mockOnAuthStateChanged.mockReset();
    mockSignInWithPopup.mockReset();
    mockSignOut.mockReset();
  });

  it("starts in loading state", () => {
    mockOnAuthStateChanged.mockReturnValue(() => {});
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it("reflects the signed-in user once auth state resolves", async () => {
    const fakeUser = { uid: "u1", displayName: "Anh", photoURL: null };
    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(fakeUser);
      return () => {};
    });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual(fakeUser);
  });

  it("calls signInWithPopup for signInWithGoogle", async () => {
    mockOnAuthStateChanged.mockReturnValue(() => {});
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.signInWithGoogle();
    });
    expect(mockSignInWithPopup).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Install React Testing Library and switch the Vitest environment**

```bash
npm install -D @testing-library/react@latest jsdom@latest
```

Edit `vitest.config.ts` to use `environment: "jsdom"` (change from `"node"` — all future
tests, including the pure-logic ones from Tasks 3–5, still pass under jsdom).

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/lib/auth/useAuth.test.ts`
Expected: FAIL — `Cannot find module './AuthProvider'`

- [ ] **Step 4: Write AuthProvider and useAuth**

`src/lib/auth/AuthProvider.tsx`:

```tsx
"use client";

import { createContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  type User,
} from "firebase/auth";
import { auth } from "../firebase/client";

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, new GoogleAuthProvider());
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
```

`src/lib/auth/useAuth.ts`:

```ts
import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "./AuthProvider";

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được gọi bên trong AuthProvider");
  }
  return context;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/lib/auth/useAuth.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 6: Wire AuthProvider into the app and gate the home page**

`src/app/layout.tsx` — wrap `{children}` in `<AuthProvider>`:

```tsx
import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ma Sói",
  description: "Ma sói chơi cùng bàn hoặc từ xa",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

`src/app/page.tsx`:

```tsx
"use client";

import { useAuth } from "@/lib/auth/useAuth";

export default function HomePage() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Đang tải...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Ma Sói</h1>
        <button
          onClick={signInWithGoogle}
          className="rounded bg-red-700 px-4 py-2 font-semibold"
        >
          Đăng nhập với Google
        </button>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p>Xin chào {user.displayName}</p>
      <button onClick={signOut} className="rounded bg-neutral-700 px-4 py-2">
        Đăng xuất
      </button>
    </main>
  );
}
```

- [ ] **Step 7: Verify the build**

Run: `npx next build`
Expected: build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/lib/auth src/app/layout.tsx src/app/page.tsx vitest.config.ts package.json package-lock.json
git commit -m "feat: add Google sign-in"
git push
```

---

### Task 8: Create and join room

**Files:**
- Create: `src/lib/rooms/createRoom.ts`, `src/lib/rooms/createRoom.test.ts`,
  `src/lib/rooms/joinRoom.ts`, `src/lib/rooms/joinRoom.test.ts`

**Interfaces:**
- Consumes: `Room` (Task 3, used by `joinRoom` to type the read room snapshot); `roomPath`,
  `roomStatusPath`, `roomMemberPath` (Task 3); `generateRoomCode` (Task 4).
- Produces:
  - `createRoom(db: Database, input: CreateRoomInput): Promise<string>` — returns the new
    room code.
  - `joinRoom(db: Database, roomCode: string, input: JoinRoomInput): Promise<void>`.
  - `JoinRoomError` with `.code: "NOT_FOUND" | "FULL" | "ALREADY_PLAYING"`.

**Why these aren't a single transaction on the whole room:** RTDB evaluates a `set()` or
`runTransaction()` issued at one path by walking from that exact path up to root for a
passing `.write` rule — it does not separately consult a descendant leaf's own `.write` rule.
`rooms/$code` itself has no `.write` (only `.read`), so a transaction that reads and rewrites
the whole room object at `rooms/$code` is denied outright regardless of what `status`,
`settings`, or `members/$uid` individually allow. `createRoom` therefore claims the room code
with a transaction scoped to the `status` leaf alone (which has its own `!data.exists()`
rule), then fills in the rest with a multi-path `update()`, since `update()` evaluates each
key independently against its own leaf rule. `joinRoom` reads the room once to decide which
error (if any) applies, then writes only its own `members/$uid` leaf — accepting a small,
documented race window on the last open slot as a fair trade for a friend-group party game
that has no adversarial concurrency to defend against. See Task 6's rules tests for the
empirical proof of this constraint.

These tests run against the emulator (real transactions, real rules) — start it first.

- [ ] **Step 1: Start the emulator**

Run: `npm run emulators` (background)

- [ ] **Step 2: Write the failing tests for createRoom**

`src/lib/rooms/createRoom.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { connectDatabaseEmulator, getDatabase, ref, get } from "firebase/database";
import { initializeApp, deleteApp, type FirebaseApp } from "firebase/app";
import { createRoom } from "./createRoom";
import { roomPath } from "./paths";

let app: FirebaseApp;

beforeAll(() => {
  app = initializeApp({ databaseURL: "http://127.0.0.1:9000/?ns=werewolf-rules-test" });
  connectDatabaseEmulator(getDatabase(app), "127.0.0.1", 9000);
});

afterAll(async () => {
  await deleteApp(app);
});

describe("createRoom", () => {
  it("creates a room with the given owner as its first member", async () => {
    const db = getDatabase(app);
    const code = await createRoom(db, {
      uid: "uid-1",
      name: "Anh",
      photoURL: null,
      maxPlayers: 8,
    });

    expect(code).toHaveLength(6);
    const snapshot = await get(ref(db, roomPath(code)));
    const room = snapshot.val();
    expect(room.status).toBe("LOBBY");
    expect(room.settings.maxPlayers).toBe(8);
    expect(room.members["uid-1"].name).toBe("Anh");
  });

  it("rejects maxPlayers below 4", async () => {
    const db = getDatabase(app);
    await expect(
      createRoom(db, { uid: "uid-2", name: "B", photoURL: null, maxPlayers: 2 }),
    ).rejects.toThrow(/4 đến 16/);
  });

  it("rejects maxPlayers above 16", async () => {
    const db = getDatabase(app);
    await expect(
      createRoom(db, { uid: "uid-3", name: "C", photoURL: null, maxPlayers: 20 }),
    ).rejects.toThrow(/4 đến 16/);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run src/lib/rooms/createRoom.test.ts`
Expected: FAIL — `Cannot find module './createRoom'`

- [ ] **Step 4: Write createRoom**

`src/lib/rooms/createRoom.ts`:

```ts
import { type Database, ref, runTransaction, update } from "firebase/database";
import { generateRoomCode } from "./roomCode";
import { roomPath, roomStatusPath, roomMemberPath } from "./paths";

const MAX_ATTEMPTS = 5;

export interface CreateRoomInput {
  uid: string;
  name: string;
  photoURL: string | null;
  maxPlayers: number;
}

export async function createRoom(db: Database, input: CreateRoomInput): Promise<string> {
  if (input.maxPlayers < 4 || input.maxPlayers > 16) {
    throw new Error("Số người chơi phải từ 4 đến 16");
  }

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = generateRoomCode();
    const created = await tryCreateAt(db, code, input);
    if (created) return code;
  }
  throw new Error("Không tạo được mã phòng, thử lại");
}

async function tryCreateAt(
  db: Database,
  code: string,
  input: CreateRoomInput,
): Promise<boolean> {
  // RTDB checks a set()/transaction's write permission by walking from its
  // exact target path up to root only — it never separately consults a
  // descendant leaf's own .write rule for a single nested write (see
  // database.rules.json and Task 6's rules tests). So the collision claim
  // must transact on ONE leaf that already carries its own
  // "!data.exists()" rule — status — not on the whole room object.
  const claim = await runTransaction(ref(db, roomStatusPath(code)), (current) => {
    if (current !== null) return undefined;
    return "LOBBY";
  });
  if (!claim.committed) return false;

  const now = Date.now();

  // A multi-path update() evaluates each key independently against its own
  // leaf rule, unlike set() — this is what lets the rest of the room get
  // written once the code is claimed.
  await update(ref(db), {
    [`${roomPath(code)}/createdAt`]: now,
    [`${roomPath(code)}/settings`]: {
      maxPlayers: input.maxPlayers,
      rolesEnabled: { BODYGUARD: true, CURSED: true, MUTER: true, TANNER: true },
    },
    [roomMemberPath(code, input.uid)]: {
      name: input.name,
      photoURL: input.photoURL,
      joinedAt: now,
      ready: false,
      online: true,
    },
  });

  return true;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/lib/rooms/createRoom.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 6: Write the failing tests for joinRoom**

`src/lib/rooms/joinRoom.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDatabase, connectDatabaseEmulator, ref, get } from "firebase/database";
import { initializeApp, deleteApp, type FirebaseApp } from "firebase/app";
import { createRoom } from "./createRoom";
import { joinRoom, JoinRoomError } from "./joinRoom";
import { roomPath } from "./paths";

let app: FirebaseApp;

beforeAll(() => {
  app = initializeApp(
    { databaseURL: "http://127.0.0.1:9000/?ns=werewolf-rules-test" },
    "join-room-tests",
  );
  connectDatabaseEmulator(getDatabase(app), "127.0.0.1", 9000);
});

afterAll(async () => {
  await deleteApp(app);
});

describe("joinRoom", () => {
  it("adds the joiner as a member", async () => {
    const db = getDatabase(app);
    const code = await createRoom(db, {
      uid: "owner-1",
      name: "Owner",
      photoURL: null,
      maxPlayers: 4,
    });

    await joinRoom(db, code, { uid: "joiner-1", name: "Joiner", photoURL: null });

    const snapshot = await get(ref(db, roomPath(code)));
    expect(snapshot.val().members["joiner-1"].name).toBe("Joiner");
  });

  it("throws NOT_FOUND for a code that does not exist", async () => {
    const db = getDatabase(app);
    await expect(
      joinRoom(db, "NOPE00", { uid: "joiner-2", name: "X", photoURL: null }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("throws FULL when the room is at maxPlayers", async () => {
    const db = getDatabase(app);
    const code = await createRoom(db, {
      uid: "owner-2",
      name: "Owner",
      photoURL: null,
      maxPlayers: 1,
    });

    let caught: unknown;
    try {
      await joinRoom(db, code, { uid: "joiner-3", name: "X", photoURL: null });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(JoinRoomError);
    expect((caught as JoinRoomError).code).toBe("FULL");
  });

  it("is idempotent for a member re-joining their own room", async () => {
    const db = getDatabase(app);
    const code = await createRoom(db, {
      uid: "owner-3",
      name: "Owner",
      photoURL: null,
      maxPlayers: 4,
    });

    await expect(
      joinRoom(db, code, { uid: "owner-3", name: "Owner", photoURL: null }),
    ).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 7: Run the tests to verify they fail**

Run: `npx vitest run src/lib/rooms/joinRoom.test.ts`
Expected: FAIL — `Cannot find module './joinRoom'`

- [ ] **Step 8: Write joinRoom**

`src/lib/rooms/joinRoom.ts`:

```ts
import { type Database, ref, get, set } from "firebase/database";
import type { Room } from "@/types/room";
import { roomPath, roomMemberPath } from "./paths";

export class JoinRoomError extends Error {
  code: "NOT_FOUND" | "FULL" | "ALREADY_PLAYING";

  constructor(code: "NOT_FOUND" | "FULL" | "ALREADY_PLAYING", message: string) {
    super(message);
    this.code = code;
  }
}

export interface JoinRoomInput {
  uid: string;
  name: string;
  photoURL: string | null;
}

export async function joinRoom(
  db: Database,
  roomCode: string,
  input: JoinRoomInput,
): Promise<void> {
  const snapshot = await get(ref(db, roomPath(roomCode)));
  const room = snapshot.val() as Room | null;

  if (room === null) {
    throw new JoinRoomError("NOT_FOUND", `Phòng ${roomCode} không tồn tại`);
  }
  if (room.status === "PLAYING") {
    throw new JoinRoomError("ALREADY_PLAYING", "Phòng đang chơi, không vào được");
  }

  const alreadyMember = Boolean(room.members?.[input.uid]);
  if (alreadyMember) return;

  const memberCount = Object.keys(room.members ?? {}).length;
  if (memberCount >= room.settings.maxPlayers) {
    throw new JoinRoomError("FULL", "Phòng đã đầy");
  }

  // A single set() at the member's own leaf matches that leaf's own
  // .write rule directly (auth.uid === $uid) — the same reason createRoom
  // writes leaf-by-leaf instead of the whole room at once (see Task 6).
  // This leaves a small race window: two people joining the last open
  // slot at the same instant could both pass the FULL check above before
  // either write lands, so the room could briefly hold one more member
  // than maxPlayers. Accepted for v1 — this is a friend-group party game
  // with no adversarial concurrency, not a security boundary, and the
  // room self-corrects on the next read.
  await set(ref(db, roomMemberPath(roomCode, input.uid)), {
    name: input.name,
    photoURL: input.photoURL,
    joinedAt: Date.now(),
    ready: false,
    online: true,
  });
}
```

- [ ] **Step 9: Run the tests to verify they pass**

Run: `npx vitest run src/lib/rooms/joinRoom.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 10: Commit**

```bash
git add src/lib/rooms/createRoom.ts src/lib/rooms/createRoom.test.ts src/lib/rooms/joinRoom.ts src/lib/rooms/joinRoom.test.ts
git commit -m "feat: add createRoom and joinRoom"
git push
```

---

### Task 9: Presence

**Files:**
- Create: `src/lib/presence/presence.ts`, `src/lib/presence/presence.test.ts`

**Interfaces:**
- Consumes: `presencePath`, `roomMemberPath` (Task 3).
- Produces: `attachPresence(db: Database, uid: string, roomCode: string): () => void` (call
  the returned function to detach the listener — does not clear presence, since presence
  should persist as "last known state" once the tab closes);
  `detachPresence(db: Database, uid: string, roomCode: string): Promise<void>` (explicit
  leave — call this from the "Rời phòng" button in Task 10).

- [ ] **Step 1: Start the emulator**

Run: `npm run emulators` (background, if not already running)

- [ ] **Step 2: Write the failing test**

`src/lib/presence/presence.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import {
  getDatabase,
  connectDatabaseEmulator,
  ref,
  get,
  set,
  goOffline,
  goOnline,
} from "firebase/database";
import { initializeApp, deleteApp, type FirebaseApp } from "firebase/app";
import { attachPresence, detachPresence } from "./presence";
import { presencePath, roomMemberPath } from "../rooms/paths";

let app: FirebaseApp;

beforeAll(() => {
  app = initializeApp(
    { databaseURL: "http://127.0.0.1:9000/?ns=werewolf-rules-test" },
    "presence-tests",
  );
  connectDatabaseEmulator(getDatabase(app), "127.0.0.1", 9000);
});

afterAll(async () => {
  await deleteApp(app);
});

describe("attachPresence", () => {
  it("marks the user online and sets up an onDisconnect handler that flips it offline", async () => {
    const db = getDatabase(app);
    await set(ref(db, roomMemberPath("ROOM01", "uid-1")), {
      name: "Anh",
      photoURL: null,
      joinedAt: 1,
      ready: false,
      online: false,
    });

    const detach = attachPresence(db, "uid-1", "ROOM01");
    await vi.waitFor(async () => {
      const snap = await get(ref(db, presencePath("uid-1")));
      expect(snap.val()?.online).toBe(true);
    });

    goOffline(db);
    await vi.waitFor(
      async () => {
        goOnline(db);
        const snap = await get(ref(db, presencePath("uid-1")));
        expect(snap.val()?.online).toBe(false);
        goOffline(db);
      },
      { timeout: 3000 },
    );
    goOnline(db);
    detach();
  });
});

describe("detachPresence", () => {
  it("explicitly marks the user offline", async () => {
    const db = getDatabase(app);
    await detachPresence(db, "uid-2", "ROOM02");
    const snap = await get(ref(db, presencePath("uid-2")));
    expect(snap.val()?.online).toBe(false);
    expect(snap.val()?.roomCode).toBeNull();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/lib/presence/presence.test.ts`
Expected: FAIL — `Cannot find module './presence'`

- [ ] **Step 4: Write the implementation**

`src/lib/presence/presence.ts`:

```ts
import {
  type Database,
  ref,
  onValue,
  onDisconnect,
  set,
  update,
  serverTimestamp,
} from "firebase/database";
import { presencePath, roomMemberPath } from "../rooms/paths";

export function attachPresence(db: Database, uid: string, roomCode: string): () => void {
  const connectedRef = ref(db, ".info/connected");
  const presenceRef = ref(db, presencePath(uid));
  const memberOnlineRef = ref(db, `${roomMemberPath(roomCode, uid)}/online`);

  const unsubscribe = onValue(connectedRef, (snapshot) => {
    if (snapshot.val() !== true) return;

    onDisconnect(presenceRef).set({
      online: false,
      lastSeen: serverTimestamp(),
      roomCode,
    });
    onDisconnect(memberOnlineRef).set(false);

    set(presenceRef, { online: true, lastSeen: serverTimestamp(), roomCode });
    set(memberOnlineRef, true);
  });

  return unsubscribe;
}

export async function detachPresence(
  db: Database,
  uid: string,
  roomCode: string,
): Promise<void> {
  await update(ref(db), {
    [presencePath(uid)]: { online: false, lastSeen: serverTimestamp(), roomCode: null },
    [`${roomMemberPath(roomCode, uid)}/online`]: false,
  });
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/lib/presence/presence.test.ts`
Expected: PASS, 2 tests. (The `onDisconnect`-via-`goOffline` round trip is the one genuinely
flaky part of this plan — if it is flaky in CI, keep the test but increase `timeout`, do not
delete it: it is the only automated check for the mechanism the whole spec's presence model
depends on.)

- [ ] **Step 6: Commit**

```bash
git add src/lib/presence/presence.ts src/lib/presence/presence.test.ts
git commit -m "feat: add presence with onDisconnect"
git push
```

---

### Task 10: Room subscription hook and Lobby screen

**Files:**
- Create: `src/lib/rooms/useRoom.ts`, `src/lib/rooms/useRoom.test.ts`,
  `src/components/RoomLobby.tsx`, `src/app/room/[code]/page.tsx`
- Modify: `src/app/page.tsx` (add create/join form)

**Interfaces:**
- Consumes: `Room` (Task 3), `roomPath` (Task 3), `createRoom`/`joinRoom` (Task 8),
  `attachPresence`/`detachPresence` (Task 9), `useAuth` (Task 7).
- Produces: `useRoom(db: Database, code: string): { room: Room | null; loading: boolean }`.

- [ ] **Step 1: Start the emulator**

Run: `npm run emulators` (background, if not already running)

- [ ] **Step 2: Write the failing test for useRoom**

`src/lib/rooms/useRoom.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";
import { initializeApp, deleteApp, type FirebaseApp } from "firebase/app";
import { createRoom } from "./createRoom";
import { useRoom } from "./useRoom";

let app: FirebaseApp;

beforeAll(() => {
  app = initializeApp(
    { databaseURL: "http://127.0.0.1:9000/?ns=werewolf-rules-test" },
    "use-room-tests",
  );
  connectDatabaseEmulator(getDatabase(app), "127.0.0.1", 9000);
});

afterAll(async () => {
  await deleteApp(app);
});

describe("useRoom", () => {
  it("loads the room and reflects live updates", async () => {
    const db = getDatabase(app);
    const code = await createRoom(db, {
      uid: "uid-1",
      name: "Anh",
      photoURL: null,
      maxPlayers: 8,
    });

    const { result } = renderHook(() => useRoom(db, code));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.room?.members["uid-1"].name).toBe("Anh");
  });

  it("returns a null room for a code that does not exist", async () => {
    const db = getDatabase(app);
    const { result } = renderHook(() => useRoom(db, "NOPE99"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.room).toBeNull();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/lib/rooms/useRoom.test.ts`
Expected: FAIL — `Cannot find module './useRoom'`

- [ ] **Step 4: Write useRoom**

`src/lib/rooms/useRoom.ts`:

```ts
"use client";

import { useEffect, useState } from "react";
import { type Database, ref, onValue } from "firebase/database";
import type { Room } from "@/types/room";
import { roomPath } from "./paths";

export function useRoom(db: Database, code: string): { room: Room | null; loading: boolean } {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onValue(ref(db, roomPath(code)), (snapshot) => {
      setRoom(snapshot.val());
      setLoading(false);
    });
    return unsubscribe;
  }, [db, code]);

  return { room, loading };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/lib/rooms/useRoom.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 6: Build the Lobby component**

`src/components/RoomLobby.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import type { Room } from "@/types/room";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/useAuth";
import { useRoom } from "@/lib/rooms/useRoom";
import { attachPresence, detachPresence } from "@/lib/presence/presence";
import { ref, update } from "firebase/database";
import { roomMemberPath } from "@/lib/rooms/paths";
import { useRouter } from "next/navigation";

export function RoomLobby({ code }: { code: string }) {
  const { user } = useAuth();
  const { room, loading } = useRoom(db, code);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    const detach = attachPresence(db, user.uid, code);
    return () => detach();
  }, [user, code]);

  if (loading) return <p>Đang tải phòng...</p>;
  if (!room) return <p>Không tìm thấy phòng {code}</p>;
  if (!user) return null;

  const toggleReady = () => {
    const currentlyReady = room.members[user.uid]?.ready ?? false;
    update(ref(db, roomMemberPath(code, user.uid)), { ready: !currentlyReady });
  };

  const leave = async () => {
    await detachPresence(db, user.uid, code);
    router.push("/");
  };

  const members = Object.entries(room.members);

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 p-6">
      <h1 className="text-3xl font-bold tracking-widest">{code}</h1>
      <p>
        {members.length} / {room.settings.maxPlayers} người
      </p>
      <ul className="w-full max-w-sm space-y-2">
        {members.map(([uid, member]) => (
          <li
            key={uid}
            className={`flex justify-between rounded px-3 py-2 ${
              member.online ? "bg-neutral-800" : "bg-neutral-900 text-neutral-500"
            }`}
          >
            <span>{member.name}</span>
            <span>{!member.online ? "đang vắng" : member.ready ? "sẵn sàng" : "chờ"}</span>
          </li>
        ))}
      </ul>
      <div className="flex gap-3">
        <button onClick={toggleReady} className="rounded bg-red-700 px-4 py-2">
          {room.members[user.uid]?.ready ? "Huỷ sẵn sàng" : "Sẵn sàng"}
        </button>
        <button onClick={leave} className="rounded bg-neutral-700 px-4 py-2">
          Rời phòng
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Add the room route**

`src/app/room/[code]/page.tsx`:

```tsx
import { RoomLobby } from "@/components/RoomLobby";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <RoomLobby code={code} />;
}
```

- [ ] **Step 8: Add create/join to the home page**

Replace the signed-in branch of `src/app/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { db } from "@/lib/firebase/client";
import { createRoom } from "@/lib/rooms/createRoom";
import { joinRoom, JoinRoomError } from "@/lib/rooms/joinRoom";

export default function HomePage() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const router = useRouter();
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Đang tải...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Ma Sói</h1>
        <button
          onClick={signInWithGoogle}
          className="rounded bg-red-700 px-4 py-2 font-semibold"
        >
          Đăng nhập với Google
        </button>
      </main>
    );
  }

  const handleCreate = async () => {
    setError(null);
    try {
      const code = await createRoom(db, {
        uid: user.uid,
        name: user.displayName ?? "Ẩn danh",
        photoURL: user.photoURL,
        maxPlayers,
      });
      router.push(`/room/${code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được phòng");
    }
  };

  const handleJoin = async () => {
    setError(null);
    try {
      await joinRoom(db, joinCode.toUpperCase(), {
        uid: user.uid,
        name: user.displayName ?? "Ẩn danh",
        photoURL: user.photoURL,
      });
      router.push(`/room/${joinCode.toUpperCase()}`);
    } catch (err) {
      if (err instanceof JoinRoomError) {
        setError(err.message);
      } else {
        setError("Không vào được phòng");
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <p>Xin chào {user.displayName}</p>

      <div className="flex flex-col items-center gap-2">
        <label htmlFor="maxPlayers">Số người chơi</label>
        <input
          id="maxPlayers"
          type="number"
          min={4}
          max={16}
          value={maxPlayers}
          onChange={(e) => setMaxPlayers(Number(e.target.value))}
          className="w-20 rounded bg-neutral-800 px-2 py-1 text-center"
        />
        <button onClick={handleCreate} className="rounded bg-red-700 px-4 py-2">
          Tạo phòng
        </button>
      </div>

      <div className="flex flex-col items-center gap-2">
        <input
          placeholder="Mã phòng"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          className="rounded bg-neutral-800 px-2 py-1 text-center uppercase"
        />
        <button onClick={handleJoin} className="rounded bg-neutral-700 px-4 py-2">
          Vào phòng
        </button>
      </div>

      {error && <p className="text-red-400">{error}</p>}

      <button onClick={signOut} className="text-sm text-neutral-500 underline">
        Đăng xuất
      </button>
    </main>
  );
}
```

- [ ] **Step 9: Verify the build**

Run: `npx next build`
Expected: build succeeds.

- [ ] **Step 10: Commit**

```bash
git add src/lib/rooms/useRoom.ts src/lib/rooms/useRoom.test.ts src/components/RoomLobby.tsx src/app/room src/app/page.tsx
git commit -m "feat: add room subscription hook and Lobby screen"
git push
```

---

### Task 11: PWA manifest and install prompt

**Files:**
- Create: `public/manifest.webmanifest`, `public/icons/icon.svg`,
  `src/components/InstallPrompt.tsx`
- Modify: `src/app/layout.tsx` (render `InstallPrompt`)

**Interfaces:**
- Produces: an installable app (Chrome/Android shows the install affordance; iOS Safari
  users get the `InstallPrompt` banner with manual instructions, since iOS ignores
  `beforeinstallprompt`).

- [ ] **Step 1: Write the icon**

`public/icons/icon.svg` — a simple maskable moon-and-claw mark on a solid background so it
reads at any size:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0a0a0a"/>
  <circle cx="256" cy="256" r="160" fill="#ce2029"/>
  <circle cx="310" cy="220" r="150" fill="#0a0a0a"/>
</svg>
```

- [ ] **Step 2: Write the manifest**

`public/manifest.webmanifest`:

```json
{
  "name": "Ma Sói",
  "short_name": "Ma Sói",
  "description": "Ma sói chơi cùng bàn hoặc từ xa",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0a0a0a",
  "theme_color": "#0a0a0a",
  "icons": [
    {
      "src": "/icons/icon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
```

- [ ] **Step 3: Write the install prompt component**

`src/components/InstallPrompt.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    if (isIos()) {
      setShowIosHint(true);
      return;
    }

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (deferredPrompt) {
    return (
      <button
        onClick={async () => {
          await deferredPrompt.prompt();
          setDeferredPrompt(null);
        }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded bg-red-700 px-4 py-2 text-sm"
      >
        Cài đặt Ma Sói
      </button>
    );
  }

  if (showIosHint) {
    return (
      <p className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded bg-neutral-800 px-4 py-2 text-center text-xs">
        Để nhận thông báo, bấm Chia sẻ → Thêm vào MH chính
      </p>
    );
  }

  return null;
}
```

- [ ] **Step 4: Render it in the root layout**

Add `<InstallPrompt />` inside `<AuthProvider>` in `src/app/layout.tsx`, after `{children}`.

- [ ] **Step 5: Verify the build**

Run: `npx next build`
Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add public/manifest.webmanifest public/icons/icon.svg src/components/InstallPrompt.tsx src/app/layout.tsx
git commit -m "feat: add PWA manifest and install prompt"
git push
```

---

### Task 12: Confirm the live deployment

**Files:** none — verification only.

- [ ] **Step 1: Wait for the Vercel deployment triggered by the Task 11 push**

Run: `vercel ls werewolf-game --prod` (or check the Vercel dashboard) until the latest
deployment for the `main` branch shows `Ready`.

- [ ] **Step 2: Open the live site**

Visit `https://wolf.anhdh.net`. Confirm:
- The sign-in screen renders.
- "Đăng nhập với Google" completes a real Google sign-in.
- "Tạo phòng" produces a 6-character room code and navigates to `/room/<code>`.
- Opening the same room URL in a second browser (or incognito, signed in as a different
  Google account) shows both members in the list.
- Closing the second browser tab flips that member to "đang vắng" within a few seconds in
  the first browser.

- [ ] **Step 3: Record the result**

If any check fails, fix it as a follow-up commit on `main` (small, targeted fix — not a new
plan) before starting the Game Engine sub-project. Do not proceed to Game Engine with a
known-broken Foundation.
