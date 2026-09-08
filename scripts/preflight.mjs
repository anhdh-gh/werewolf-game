#!/usr/bin/env node
/**
 * Live-infrastructure preflight: says, in one command, exactly what is still
 * missing before this app can actually run a real game.
 *
 *   npm run preflight              # human-readable report, exit 1 if anything FAILs
 *   npm run preflight -- --json    # machine-readable, same exit code
 *   npm run preflight -- --offline # only the checks that need no network/CLI
 *
 * WHY THIS EXISTS: every plan in docs/superpowers/plans/ ends with the same
 * closing list — "needs the owner's own access, not more code". That list is
 * prose, so the only way to know which half of it is done is to go read six
 * dashboards. This turns it into a check run: each item is either OK, FAIL
 * with the exact command that fixes it, or SKIP with the reason it could not
 * be determined from here. Nothing is ever reported as OK on the strength of
 * "the code for it exists".
 *
 * STRICTLY READ-ONLY. It runs `vercel ls`, `vercel env ls`, `firebase
 * database:instances:list`, `firebase database:get /.settings/rules`,
 * unauthenticated HTTPS GETs, and one POST per deployed API route. Those
 * POSTs are non-mutating by construction, not by convention: each names a
 * game/room id that cannot exist (or omits the auth header), so the handler
 * returns at its first guard, before any write — see SMOKE_ROUTES, which
 * records the guard each one lands on. It never deploys, never writes to the
 * database, never creates an auth user, and never prints an environment
 * variable's value — only whether the name is set. (`vercel env ls` shows
 * values encrypted anyway; this script parses the name column and drops the
 * rest.)
 *
 * Every check except the route probes reads CONFIGURATION — what is set, what
 * is Ready, which ruleset is live. That is not the same as the app working:
 * this script reported 9 PASS for two hours while every deployed route
 * returned a bare 500. The route probes are the answer to that, and are the
 * only checks here that ask deployed code to actually run.
 *
 * Exit code: 0 when no check FAILed (SKIPs alone do not fail the run — a skip
 * means "could not determine from here", and reporting that as a failure would
 * train the owner to ignore the output). Non-zero when at least one did.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { REPO_ROOT, loadNarrationCatalog } from "./narration-catalog.mjs";

const RULES_FILE = path.join(REPO_ROOT, "database.rules.json");
const FIREBASERC_FILE = path.join(REPO_ROOT, ".firebaserc");
const ENV_LOCAL_FILE = path.join(REPO_ROOT, ".env.local");
const LAYOUT_FILE = path.join(REPO_ROOT, "src/app/layout.tsx");

/**
 * Every environment variable the running app reads, with the feature that
 * breaks without it. `readBy` is a real path in this repo on purpose:
 * src/test/preflight.test.ts greps the source for each name and fails if this
 * table drifts from what the code actually reads, so a new `process.env.X`
 * cannot be added without also being preflighted.
 *
 * `scope: "build"` means Next.js inlines it at build time, so setting it in
 * Vercel is not enough on its own — the project has to be redeployed after.
 */
export const REQUIRED_ENV = [
  {
    name: "NEXT_PUBLIC_FIREBASE_API_KEY",
    feature: "Firebase client",
    scope: "build",
    readBy: "src/lib/firebase/client.ts",
    why: "the web SDK cannot initialize at all; every page throws at module scope",
    howToSet:
      "Firebase Console -> Project Settings -> General -> Your apps -> Web app -> " +
      "SDK setup and configuration. All seven land at once with `vercel env pull`, " +
      "or one at a time: vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production",
  },
  {
    name: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    feature: "Firebase client",
    scope: "build",
    readBy: "src/lib/firebase/client.ts",
    why: "anonymous sign-in has no auth endpoint to talk to",
    howToSet:
      "Firebase Console -> Project Settings -> General -> Your apps -> Web app -> " +
      "SDK setup and configuration. All seven land at once with `vercel env pull`, " +
      "or one at a time: vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production",
  },
  {
    name: "NEXT_PUBLIC_FIREBASE_DATABASE_URL",
    feature: "Firebase client",
    scope: "build",
    readBy: "src/lib/firebase/client.ts",
    why: "the client and the Admin SDK both point at the RTDB instance through this",
    howToSet:
      "Firebase Console -> Project Settings -> General -> Your apps -> Web app -> " +
      "SDK setup and configuration. All seven land at once with `vercel env pull`, " +
      "or one at a time: vercel env add NEXT_PUBLIC_FIREBASE_DATABASE_URL production",
  },
  {
    name: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    feature: "Firebase client",
    scope: "build",
    readBy: "src/lib/firebase/client.ts",
    why: "required by initializeApp()",
    howToSet:
      "Firebase Console -> Project Settings -> General -> Your apps -> Web app -> " +
      "SDK setup and configuration. All seven land at once with `vercel env pull`, " +
      "or one at a time: vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production",
  },
  {
    name: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    feature: "Firebase client",
    scope: "build",
    readBy: "src/lib/firebase/client.ts",
    why: "required by initializeApp()",
    howToSet:
      "Firebase Console -> Project Settings -> General -> Your apps -> Web app -> " +
      "SDK setup and configuration. All seven land at once with `vercel env pull`, " +
      "or one at a time: vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production",
  },
  {
    name: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    feature: "Firebase client",
    scope: "build",
    readBy: "src/lib/firebase/client.ts",
    why: "FCM registration needs the sender id",
    howToSet:
      "Firebase Console -> Project Settings -> General -> Your apps -> Web app -> " +
      "SDK setup and configuration. All seven land at once with `vercel env pull`, " +
      "or one at a time: vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production",
  },
  {
    name: "NEXT_PUBLIC_FIREBASE_APP_ID",
    feature: "Firebase client",
    scope: "build",
    readBy: "src/lib/firebase/client.ts",
    why: "required by initializeApp()",
    howToSet:
      "Firebase Console -> Project Settings -> General -> Your apps -> Web app -> " +
      "SDK setup and configuration. All seven land at once with `vercel env pull`, " +
      "or one at a time: vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production",
  },
  {
    name: "FIREBASE_SERVICE_ACCOUNT_KEY",
    feature: "Game engine API routes",
    scope: "runtime",
    readBy: "src/lib/firebase/admin.ts",
    why:
      "POST /api/games/[gameId]/start and /advance are the only writers of roles, " +
      "phases and deaths — without this every game stalls at the lobby",
    howToSet:
      "Firebase Console -> Project Settings -> Service accounts -> Generate new private key, " +
      "then paste the whole JSON as one value: vercel env add FIREBASE_SERVICE_ACCOUNT_KEY production",
  },
  {
    name: "NEXT_PUBLIC_FIREBASE_VAPID_KEY",
    feature: "Push notifications (Resilience Task 6)",
    scope: "build",
    readBy: "src/lib/notifications/push.ts",
    why: "getToken() cannot mint an FCM token, so nobody is ever woken for their turn",
    howToSet:
      "Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates -> Key pair, " +
      "then: vercel env add NEXT_PUBLIC_FIREBASE_VAPID_KEY production",
  },
  {
    name: "LIVEKIT_API_KEY",
    feature: 'Voice/video call rooms ("Chơi xa", Resilience Task 7)',
    scope: "runtime",
    readBy: "src/app/api/livekit/token/route.ts",
    why: "POST /api/livekit/token cannot sign a grant, so no call room ever connects",
    howToSet:
      "LiveKit Cloud -> Settings -> Keys -> Create key, then: vercel env add LIVEKIT_API_KEY production",
  },
  {
    name: "LIVEKIT_API_SECRET",
    feature: 'Voice/video call rooms ("Chơi xa", Resilience Task 7)',
    scope: "runtime",
    readBy: "src/app/api/livekit/token/route.ts",
    why: "the other half of the signing key pair",
    howToSet: "Same key pair as LIVEKIT_API_KEY: vercel env add LIVEKIT_API_SECRET production",
  },
  {
    name: "NEXT_PUBLIC_LIVEKIT_URL",
    feature: 'Voice/video call rooms ("Chơi xa", Resilience Task 7)',
    scope: "build",
    readBy: "src/app/api/livekit/token/route.ts",
    why: "the browser has no server to open the WebRTC session against",
    howToSet:
      "The wss:// URL on the LiveKit Cloud project page, then: " +
      "vercel env add NEXT_PUBLIC_LIVEKIT_URL production",
  },
];

/** Parses the name column out of `vercel env ls <target>`. The table is
 * whitespace-aligned and the value column is always encrypted ciphertext, so
 * only the first token of each row is taken — no value can leak into the
 * report even if Vercel changes how it renders them. Rows before the header
 * and the "Next steps" footer are ignored. */
export function parseVercelEnvRows(stdout) {
  const rows = [];
  let seenHeader = false;
  for (const raw of stdout.split("\n")) {
    const line = raw.trim();
    if (!seenHeader) {
      if (/^name\s+value\s+/.test(line)) seenHeader = true;
      continue;
    }
    // The table is contiguous and ends at the first blank line. Stopping there
    // matters: the CLI's own "Next steps" footer contains lines like
    // "  vercel env add", whose first token is a valid identifier and would
    // otherwise be read as an environment variable that is set.
    if (line === "") break;
    const name = line.split(/\s+/)[0];
    if (!/^[A-Za-z_][A-Za-z_0-9]*$/.test(name)) continue;
    // The `created` column is last and always reads "<age> ago". Anchoring on
    // the end of the row is the only safe way to reach it: the `environments`
    // column before it holds a comma-and-space list ("Production, Preview,
    // Development") whose width varies per row, so counting columns from the
    // left lands on a different field depending on the variable.
    const age = /(\S+)\s+ago$/.exec(line);
    rows.push({ name, age: age ? age[1] : null });
  }
  return rows;
}

/** The names only, for the "is it set at all" check. */
export function parseVercelEnvList(stdout) {
  return parseVercelEnvRows(stdout).map((row) => row.name);
}

/** Both Vercel tables report time as a rounded relative age ("5m", "2d") and
 * never an absolute timestamp, so a comparison between two of them is only as
 * sharp as the coarser unit. Returns the age in seconds together with the
 * width of the rounding bucket, so a caller can tell "definitely older" from
 * "too close to call" instead of guessing. */
export function parseRelativeAge(token) {
  const match = /^(\d+)(mo|ms|[smhdwy])$/.exec(String(token ?? "").trim());
  if (!match) return null;
  const unit = {
    ms: 0.001,
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
    w: 604800,
    mo: 2592000,
    y: 31536000,
  }[match[2]];
  // Vercel truncates rather than rounds, so a row reading "5m" is somewhere in
  // [5m, 6m). `granularity` is the width of that interval.
  return { seconds: Number(match[1]) * unit, granularity: unit };
}

/** Next.js inlines every NEXT_PUBLIC_* value into the bundle at build time, so
 * "the variable is set in Vercel" and "the running site has it" are different
 * facts: a value set after the last build is not in the deployed bundle, and
 * the site behaves exactly as if it had never been set. This decides which of
 * the two it is by age, per variable.
 *
 * `age` is how long ago a thing happened, so a LARGER age is EARLIER. A
 * variable is safely in the build when it is older than the build. Both ages
 * are bucketed (see parseRelativeAge), so a verdict is only given when the
 * buckets do not overlap; anything else is reported as unknown rather than
 * guessed, because both a false alarm and a false all-clear are worse here
 * than an honest "redeploy if you are not sure". */
export function classifyBuildEnvFreshness(envRows, deploymentAge, buildScopedNames) {
  const build = parseRelativeAge(deploymentAge);
  const verdict = { inBuild: [], setAfterBuild: [], unknown: [] };
  for (const row of envRows) {
    if (!buildScopedNames.has(row.name)) continue;
    const variable = parseRelativeAge(row.age);
    if (!variable || !build) {
      verdict.unknown.push(row.name);
    } else if (variable.seconds >= build.seconds + build.granularity) {
      verdict.inBuild.push(row.name);
    } else if (variable.seconds + variable.granularity <= build.seconds) {
      verdict.setAfterBuild.push(row.name);
    } else {
      verdict.unknown.push(row.name);
    }
  }
  return verdict;
}

/** Parses `vercel ls` into {url, status, environment} rows, newest first.
 * Vercel prefixes the status with a bullet ("● Ready"), which is dropped. */
export function parseVercelDeployments(stdout) {
  const rows = [];
  for (const raw of stdout.split("\n")) {
    const line = raw.trim();
    const match = /^(\S+)\s+(\S+)\s+(https:\/\/\S+)\s+[●•]?\s*(\S+)\s+(\S+)/.exec(line);
    if (!match) continue;
    rows.push({ age: match[1], url: match[3], status: match[4], environment: match[5] });
  }
  return rows;
}

/** Reads only the *names* set in .env.local. The values are never returned —
 * this file holds real credentials on a developer machine. */
export function parseEnvFileNames(contents) {
  return contents
    .split("\n")
    .map((line) => /^\s*(?:export\s+)?([A-Za-z_][A-Za-z_0-9]*)\s*=/.exec(line))
    .filter(Boolean)
    .map((match) => match[1]);
}

/** Canonical form for comparing a deployed ruleset against the committed one.
 * The RTDB API returns rules as a source string that may differ from the file
 * in whitespace and key order but not in meaning, so both sides are parsed and
 * re-serialized with sorted keys. Firebase also accepts JSON-with-comments in
 * a ruleset source; those are stripped before parsing. */
export function stripJsonComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

export function normalizeRules(source) {
  return stableStringify(JSON.parse(stripJsonComments(source)));
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
}

/** An RTDB REST call to the wrong regional host answers 404 with the canonical
 * URL in the body rather than redirecting, so this is how the real host is
 * discovered from a project id alone. */
export function parseDatabaseRegionRedirect(body) {
  try {
    const parsed = JSON.parse(body);
    return typeof parsed.correctUrl === "string" ? parsed.correctUrl : null;
  } catch {
    return null;
  }
}

// The three check verdicts. Pure data, and used by the pure classifiers below
// as well as by every network check, so they live above the divider.
const OK = "ok";
const FAIL = "fail";
const SKIP = "skip";

/** The production origin the app is actually served from. Read out of
 * src/app/layout.tsx rather than hardcoded here for the same reason the env
 * table names a `readBy` file: a preflight that probes a URL the app no
 * longer uses reports PASS about nothing. `metadataBase` is the single place
 * in the running app that states its own public origin. */
export function parseProductionOrigin(layoutSource) {
  const match = /metadataBase:\s*new URL\(\s*["'`]([^"'`]+)["'`]/.exec(layoutSource);
  return match ? match[1].replace(/\/$/, "") : null;
}

/**
 * One probe per deployed API route, chosen so that the request cannot change
 * anything: each targets a resource that does not exist (or omits the auth
 * header), so the handler returns at its first guard — before any db.update(),
 * push() or token mint. `expect` is the status that guard produces.
 *
 * WHY THIS EXISTS: on 2026-09-08 every one of these routes returned a bare 500
 * on wolf.anhdh.net for over two hours (jwks-rsa require()ing an ESM-only
 * jose — see docs/superpowers/plans/2026-09-07-resilience.md's postmortem)
 * while CI was green and this very script reported 9 PASS. Every other check
 * here reads configuration: which variables are set, which deployment is
 * Ready, which ruleset is live. None of them asked a deployed route to
 * actually run, which is why a route that could not even load its own modules
 * was invisible. These do.
 *
 * A 404/401 from these is the SUCCESS case: reaching a handler's guard proves
 * the route module loaded, and for the two Admin-SDK routes it further proves
 * the Admin SDK initialized from FIREBASE_SERVICE_ACCOUNT_KEY and completed a
 * live RTDB read, since both guards sit behind a `.get()`.
 */
export const SMOKE_ROUTES = [
  {
    id: "route-advance",
    method: "POST",
    path: "/api/games/__preflight_no_such_game__/advance",
    route: "src/app/api/games/[gameId]/advance/route.ts",
    expect: 404,
    proves:
      "Admin SDK loaded, credentials accepted, and a live RTDB read completed " +
      "(the 404 comes from games/{id} not existing).",
  },
  {
    id: "route-start",
    method: "POST",
    path: "/api/rooms/__PREFLIGHT_NO_SUCH_ROOM__/start",
    route: "src/app/api/rooms/[code]/start/route.ts",
    expect: 404,
    proves: "Same, for the deal-roles route (the 404 comes from rooms/{code} not existing).",
  },
  {
    id: "route-livekit",
    method: "POST",
    path: "/api/livekit/token",
    route: "src/app/api/livekit/token/route.ts",
    expect: 401,
    // Deliberately sends no Authorization header: that guard returns before
    // adminAuth() is ever called, so this probe cannot mint a token or touch
    // LiveKit. It still proves the module graph loaded, which is the whole
    // point — the 500 this check exists for happened at module load.
    proves: "The route's module graph loaded (the 401 is its missing-token guard).",
  },
];

/** Turns one probe response into a check. Pure so the test can pin the policy
 * without a network round trip.
 *
 * The distinction that matters: a 5xx means the deployed function is broken
 * and that is a FAIL, full stop. An unexpected non-5xx (typically a 401 from
 * Vercel Deployment Protection sitting in front of the whole site) means the
 * probe never reached the app, which is "could not determine from here" — a
 * SKIP, because reporting infrastructure we cannot see through as a broken
 * route would train the owner to ignore this check. */
export function classifyRouteProbe(probe, response, origin) {
  const where = `${probe.method} ${origin}${probe.path}`;
  if (response.status === probe.expect) {
    return {
      id: probe.id,
      title: `Deployed route ${probe.path.replace(/__[A-Za-z_]+__/, ":id")}: responds (${response.status})`,
      status: OK,
      detail: `  ${probe.proves}`,
    };
  }
  if (response.status === 0) {
    return {
      id: probe.id,
      title: `Deployed route ${probe.path}: no response`,
      status: SKIP,
      detail: `  ${where}\n  ${response.error ?? "request failed"}`,
    };
  }
  if (response.status >= 500) {
    return {
      id: probe.id,
      title: `Deployed route ${probe.path}: HTTP ${response.status}`,
      status: FAIL,
      detail:
        `  ${where}\n` +
        `  Expected ${probe.expect} (its own guard); got a server error, so the handler\n` +
        "  never ran. The suite cannot see this: it mocks the Admin SDK, so a module that\n" +
        "  fails to load only in the deployed runtime is green everywhere but here.\n" +
        (response.vercelError ? `  x-vercel-error: ${response.vercelError}\n` : "") +
        (response.body.trim() ? `  Body: ${response.body.trim().slice(0, 300)}\n` : "  Body: empty\n") +
        "  Read the real stack: vercel logs " +
        origin,
    };
  }
  return {
    id: probe.id,
    title: `Deployed route ${probe.path}: HTTP ${response.status}, expected ${probe.expect}`,
    status: SKIP,
    detail:
      `  ${where}\n` +
      "  Not a server error, but not this route's own guard either — most likely Vercel\n" +
      "  Deployment Protection answering before the app does, in which case the probe\n" +
      "  never reached the route and proves nothing either way.\n" +
      (response.body.trim() ? `  Body: ${response.body.trim().slice(0, 300)}` : "  Body: empty"),
  };
}

/** Exit code and headline counts. Kept pure so the test can pin the policy:
 * FAIL fails the run, SKIP never does. */
export function summarize(checks) {
  const counts = { ok: 0, fail: 0, skip: 0 };
  for (const check of checks) counts[check.status] += 1;
  return { ...counts, exitCode: counts.fail > 0 ? 1 : 0 };
}

// ---------------------------------------------------------------------------
// Everything below here touches the network / the CLIs.
// ---------------------------------------------------------------------------

function run(command, args, timeoutMs = 120_000) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    timeout: timeoutMs,
    cwd: REPO_ROOT,
  });
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  return {
    ok: result.status === 0,
    stdout,
    stderr,
    // The Vercel CLI writes its progress lines AND its result table to stderr,
    // keeping stdout to bare machine-readable values, and firebase-tools puts
    // an unknown-command error on stdout. Neither can be parsed from one
    // stream alone, so callers get both joined.
    combined: `${stdout}\n${stderr}`,
    // spawnSync sets .error for ENOENT (CLI not installed) and for a timeout.
    error: result.error ? result.error.message : null,
  };
}

async function httpRequest(url, { method = "GET", headers, body } = {}, timeoutMs = 30_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { method, headers, body, signal: controller.signal });
    return {
      status: response.status,
      body: await response.text(),
      // Vercel names the platform-level failure here when a function cannot
      // even start (FUNCTION_INVOCATION_FAILED for the module-load crash this
      // check exists for), which is the only clue a 500 with an empty body has.
      vercelError: response.headers.get("x-vercel-error"),
    };
  } catch (error) {
    return { status: 0, body: "", vercelError: null, error: String(error) };
  } finally {
    clearTimeout(timer);
  }
}

async function httpStatus(url, timeoutMs = 30_000) {
  return httpRequest(url, {}, timeoutMs);
}

function projectId() {
  const rc = JSON.parse(readFileSync(FIREBASERC_FILE, "utf8"));
  return rc.projects?.default;
}

function localEnvNames() {
  const names = new Set(Object.keys(process.env));
  if (existsSync(ENV_LOCAL_FILE)) {
    for (const name of parseEnvFileNames(readFileSync(ENV_LOCAL_FILE, "utf8"))) names.add(name);
  }
  return names;
}

function checkNarration() {
  const catalog = loadNarrationCatalog();
  const missing = catalog.filter((clip) => !existsSync(clip.file));
  if (missing.length === 0) {
    return {
      id: "narration-audio",
      title: `Narration audio: all ${catalog.length} clips rendered`,
      status: OK,
    };
  }
  return {
    id: "narration-audio",
    title: `Narration audio: ${missing.length} of ${catalog.length} clips not rendered`,
    status: FAIL,
    detail:
      "The narrator is silent for these phases. Render them with a real Vietnamese neural " +
      "voice (there is deliberately no offline fallback — spec §8.3):\n" +
      "    GOOGLE_TTS_API_KEY=... npm run narration:render -- --provider google\n" +
      "  See docs/narration-audio.md. `npm run narration:check` lists exactly what is stale.",
  };
}

function checkVercelEnv(state) {
  const result = run("vercel", ["env", "ls", "production"]);
  if (!result.ok) {
    return [
      {
        id: "vercel-env",
        title: "Vercel production environment variables",
        status: SKIP,
        detail:
          "Could not read them: " +
          (result.error ?? result.combined.trim().split("\n").slice(-3).join(" ")) +
          "\n  Run `vercel login` and `vercel link` first.",
      },
    ];
  }
  state.envRows = parseVercelEnvRows(result.combined);
  const present = new Set(state.envRows.map((row) => row.name));
  const checks = [];
  const byFeature = new Map();
  for (const variable of REQUIRED_ENV) {
    if (!byFeature.has(variable.feature)) byFeature.set(variable.feature, []);
    byFeature.get(variable.feature).push(variable);
  }
  for (const [feature, variables] of byFeature) {
    const missing = variables.filter((variable) => !present.has(variable.name));
    if (missing.length === 0) {
      checks.push({
        id: `vercel-env:${feature}`,
        title: `${feature}: all ${variables.length} variables set in Vercel production`,
        status: OK,
      });
      continue;
    }
    const lines = missing.map(
      (variable) =>
        `    ${variable.name} (read by ${variable.readBy})\n` +
        `      without it: ${variable.why}\n` +
        (variable.howToSet ? `      set it: ${variable.howToSet}\n` : ""),
    );
    const needsRebuild = missing.some((variable) => variable.scope === "build");
    checks.push({
      id: `vercel-env:${feature}`,
      title: `${feature}: ${missing.length} of ${variables.length} variables missing in Vercel production`,
      status: FAIL,
      detail:
        lines.join("") +
        (needsRebuild
          ? "  At least one is a NEXT_PUBLIC_* build-time value: Next.js inlines it, so a\n" +
            "  redeploy is required after setting it — setting it alone changes nothing.\n"
          : ""),
    });
  }
  return checks;
}

function checkLocalEnv() {
  const names = localEnvNames();
  const missing = REQUIRED_ENV.filter((variable) => !names.has(variable.name));
  if (missing.length === 0) {
    return {
      id: "local-env",
      title: "Local environment: every required variable is set",
      status: OK,
    };
  }
  return {
    id: "local-env",
    title: `Local environment: ${missing.length} of ${REQUIRED_ENV.length} variables not set here`,
    status: SKIP,
    detail:
      "Informational only — production reads Vercel's environment, not this machine's.\n" +
      "  It matters for `npm run dev` and for the --auth-probe rules check.\n" +
      "  Populate with: vercel env pull .env.local\n" +
      `  Not set here: ${missing.map((variable) => variable.name).join(", ")}`,
  };
}

function checkVercelDeployment(state) {
  const result = run("vercel", ["ls"]);
  if (!result.ok) {
    return {
      id: "vercel-deployment",
      title: "Vercel production deployment",
      status: SKIP,
      detail: "Could not read deployments: " + (result.error ?? result.combined.trim()),
    };
  }
  const production = parseVercelDeployments(result.combined).filter(
    (row) => row.environment === "Production",
  );
  if (production.length === 0) {
    return {
      id: "vercel-deployment",
      title: "Vercel production deployment: none found",
      status: FAIL,
      detail: "Push to main, or run `vercel --prod`.",
    };
  }
  const latest = production[0];
  // Only a finished build can have inlined anything, so a still-Building
  // deployment is deliberately not offered to the freshness check.
  if (latest.status === "Ready") state.latestReadyProduction = latest;
  // A deploy that is still Building is not a failure — the most likely reason
  // to be running preflight at all is "I just pushed". Only a finished-and-bad
  // deployment counts against the run.
  const inProgress = ["Building", "Queued", "Initializing"].includes(latest.status);
  return {
    id: "vercel-deployment",
    title: `Vercel production deployment: newest is ${latest.status} (${latest.age} old)`,
    status: latest.status === "Ready" ? OK : inProgress ? SKIP : FAIL,
    detail:
      `  ${latest.url}\n  Logs: vercel logs ${latest.url}` +
      (inProgress ? "\n  Still deploying — re-run preflight once it settles." : ""),
  };
}

function checkBuildEnvFreshness(state) {
  const id = "vercel-build-freshness";
  const title = "Build-time variables are in the deployed bundle";
  if (!state.envRows || !state.latestReadyProduction) {
    return {
      id,
      title,
      status: SKIP,
      detail:
        "  Needs both `vercel env ls production` and a Ready production deployment;\n" +
        "  one of those checks above did not produce a result.",
    };
  }
  const buildScoped = new Set(
    REQUIRED_ENV.filter((variable) => variable.scope === "build").map((v) => v.name),
  );
  const deploymentAge = state.latestReadyProduction.age;
  const verdict = classifyBuildEnvFreshness(state.envRows, deploymentAge, buildScoped);

  if (verdict.setAfterBuild.length > 0) {
    return {
      id,
      title: `${verdict.setAfterBuild.length} build-time variables were set after the last deploy`,
      status: FAIL,
      detail:
        "  Next.js inlines NEXT_PUBLIC_* at build time. These are set in Vercel but were\n" +
        `  set AFTER the newest Ready production deployment (${deploymentAge} old), so the\n` +
        "  bundle being served does not contain them and the site behaves as if they were\n" +
        "  never set — which the env check above cannot see:\n" +
        verdict.setAfterBuild.map((name) => `    ${name}\n`).join("") +
        "  Rebuild so they get inlined: vercel --prod (or push an empty commit to main).\n",
    };
  }
  if (verdict.unknown.length > 0) {
    return {
      id,
      title: `${verdict.unknown.length} build-time variables are too close to the deploy to judge`,
      status: SKIP,
      detail:
        "  Vercel reports both ages rounded to one unit, and for these the variable and\n" +
        `  the deployment (${deploymentAge} old) fall in the same bucket, so it cannot be\n` +
        "  told whether the build inlined them:\n" +
        verdict.unknown.map((name) => `    ${name}\n`).join("") +
        "  Redeploy if you are not sure — it is cheap and always makes this definite.\n",
    };
  }
  return {
    id,
    title: `All ${verdict.inBuild.length} build-time variables predate the deployed build`,
    status: OK,
    detail:
      `  Each was set before the newest Ready production deployment (${deploymentAge} old),\n` +
      "  so that build inlined them. Any NEXT_PUBLIC_* changed from here on needs a\n" +
      "  redeploy before it reaches the browser.",
  };
}

/**
 * Asks each deployed API route to actually run. See SMOKE_ROUTES for why this
 * is the one check here that exercises behaviour rather than configuration,
 * and for why every probe is non-mutating by construction.
 */
async function checkDeployedRoutes() {
  const layout = readFileSync(LAYOUT_FILE, "utf8");
  const origin = parseProductionOrigin(layout);
  if (!origin) {
    return [
      {
        id: "deployed-routes",
        title: "Deployed API routes respond",
        status: SKIP,
        detail:
          "  Could not read the production origin from src/app/layout.tsx (metadataBase),\n" +
          "  so there is no URL to probe. Probe by hand against the production alias.",
      },
    ];
  }

  const probes = await Promise.all(
    SMOKE_ROUTES.map(async (probe) => {
      const response = await httpRequest(origin + probe.path, {
        method: probe.method,
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      return classifyRouteProbe(probe, response, origin);
    }),
  );
  return probes;
}

async function checkDatabase(project) {
  const checks = [];
  const instances = run("firebase", ["database:instances:list", "--project", project]);
  if (!instances.ok) {
    checks.push({
      id: "rtdb-instance",
      title: "Realtime Database instance",
      status: SKIP,
      detail: "Could not list instances: " + (instances.error ?? instances.combined.trim()),
    });
    return checks;
  }
  const defaultInstance = `${project}-default-rtdb`;
  if (!instances.combined.includes(defaultInstance)) {
    checks.push({
      id: "rtdb-instance",
      title: `Realtime Database instance ${defaultInstance}: not found`,
      status: FAIL,
      detail: "Create it in the Firebase Console; the app has no other datastore.",
    });
    return checks;
  }

  // Find the real host. RTDB answers a wrong-region request with a 404 whose
  // body names the correct URL, so one probe both locates the instance and
  // tells us whether it is world-readable.
  let host = `${defaultInstance}.firebaseio.com`;
  let probe = await httpStatus(`https://${host}/games/__preflight__.json`);
  const redirect = parseDatabaseRegionRedirect(probe.body);
  if (probe.status === 404 && redirect) {
    host = new URL(redirect).host;
    probe = await httpStatus(`https://${host}/games/__preflight__.json`);
  }
  checks.push({
    id: "rtdb-instance",
    title: `Realtime Database instance ${defaultInstance}: exists at ${host}`,
    status: OK,
    detail: `  NEXT_PUBLIC_FIREBASE_DATABASE_URL must be exactly https://${host}`,
  });

  // The one live assertion about rules that needs no credentials: nothing under
  // /games is readable without auth. If this ever returns 200 the database is
  // in test mode and every player's secret role is public.
  if (probe.status === 401) {
    checks.push({
      id: "rtdb-public-read",
      title: "Realtime Database: unauthenticated read of /games is denied",
      status: OK,
      detail:
        "  Proves the database is not in test mode. It does NOT prove database.rules.json\n" +
        "  is the deployed ruleset — Firebase's default locked rules deny this too.\n" +
        "  See the rules-match check below for that.",
    });
  } else if (probe.status === 200) {
    checks.push({
      id: "rtdb-public-read",
      title: "Realtime Database: unauthenticated read of /games SUCCEEDED",
      status: FAIL,
      detail:
        "  The database is world-readable — anyone can read every player's secret role.\n" +
        "  Deploy the committed rules now: firebase deploy --only database",
    });
  } else {
    checks.push({
      id: "rtdb-public-read",
      title: `Realtime Database: unauthenticated read returned ${probe.status || "no response"}`,
      status: SKIP,
      detail: "  Unexpected response; could not judge. " + (probe.error ?? ""),
    });
  }

  checks.push(checkDeployedRules(project, defaultInstance));
  return checks;
}

/** Summarizes how a deployed ruleset differs from the committed one, in terms
 * of the top-level sections of the rule tree. A whole-file string diff answers
 * "are they the same" but not "what is broken about the live game", and those
 * are different questions: RTDB rules do not cascade upward, so a section that
 * is absent from the deployed tree is not "slightly stale", it is denied
 * outright for every client. Naming the absent sections turns the failure into
 * the list of features that are dead live. */
export function diffRuleSections(deployedSource, committedSource) {
  const sections = (source) => {
    const parsed = JSON.parse(stripJsonComments(source));
    // A ruleset is always wrapped in a single "rules" key; compare inside it so
    // the report names `games`, not `rules`.
    return parsed && typeof parsed.rules === "object" && parsed.rules !== null
      ? parsed.rules
      : {};
  };
  const deployed = sections(deployedSource);
  const committed = sections(committedSource);
  const missing = Object.keys(committed).filter((key) => !(key in deployed));
  const extra = Object.keys(deployed).filter((key) => !(key in committed));
  const differing = Object.keys(committed)
    .filter((key) => key in deployed)
    .filter((key) => stableStringify(deployed[key]) !== stableStringify(committed[key]));
  return { missing, extra, differing };
}

/** Compares the ruleset actually live on the database instance against
 * database.rules.json.
 *
 * Mechanism note: the obvious command for this, `firebase database:rules:list`
 * / `:get`, is doubly unusable. It sits behind firebase-tools' `rtdbrules`
 * experiment flag, and even with that flag enabled it reads a legacy
 * ruleset-label endpoint that answers 403 "unauthorized access" for ordinary
 * project owners, surfacing as the opaque "Unexpected error encountered with
 * database." So this uses the RTDB REST API's own `/.settings/rules` path
 * instead, which `firebase database:get` reaches with the CLI's existing
 * credentials, needs no experiment flag, and returns the live ruleset directly.
 * It is a read of a settings path — it writes nothing. */
function checkDeployedRules(project, instance) {
  const got = run("firebase", [
    "database:get",
    "/.settings/rules",
    "--instance",
    instance,
    "--project",
    project,
  ]);
  if (!got.ok) {
    return {
      id: "rtdb-rules-match",
      title: "Deployed rules match database.rules.json",
      status: SKIP,
      detail:
        "  Could not read the live ruleset: " +
        (got.error ?? got.combined.trim()) +
        "\n  Read it by hand at:\n" +
        `      https://console.firebase.google.com/project/${project}/database/${instance}/rules`,
    };
  }
  let deployedSource = got.stdout;
  let deployed;
  try {
    deployed = normalizeRules(deployedSource);
  } catch (error) {
    return {
      id: "rtdb-rules-match",
      title: "Deployed rules match database.rules.json",
      status: SKIP,
      detail: "  Live ruleset was not parseable JSON: " + String(error),
    };
  }
  const committedSource = readFileSync(RULES_FILE, "utf8");
  if (deployed === normalizeRules(committedSource)) {
    return {
      id: "rtdb-rules-match",
      title: "Deployed rules match database.rules.json",
      status: OK,
    };
  }
  const { missing, extra, differing } = diffRuleSections(deployedSource, committedSource);
  const lines = [
    "  The live database is NOT running the rules in this repo. Every rules test in",
    "  this suite asserts against the committed file, so the suite is green about a",
    "  ruleset that is not the one serving players.",
  ];
  if (missing.length > 0) {
    lines.push(
      `  Absent from the live ruleset: ${missing.join(", ")}`,
      "  RTDB rules do not cascade upward, so an absent section is denied for every",
      "  client — those paths are unusable live, not merely stale.",
    );
  }
  if (differing.length > 0) lines.push(`  Present but different: ${differing.join(", ")}`);
  if (extra.length > 0) lines.push(`  Live-only (not in the repo): ${extra.join(", ")}`);
  lines.push("  Deploy the committed rules: firebase deploy --only database");
  return {
    id: "rtdb-rules-match",
    title: "Deployed rules DIFFER from database.rules.json",
    status: FAIL,
    detail: lines.join("\n"),
  };
}

function report(checks, asJson) {
  const summary = summarize(checks);
  if (asJson) {
    console.log(JSON.stringify({ summary, checks }, null, 2));
    return summary.exitCode;
  }
  const mark = { [OK]: "PASS", [FAIL]: "FAIL", [SKIP]: "SKIP" };
  for (const check of checks) {
    console.log(`${mark[check.status]}  ${check.title}`);
    if (check.detail) console.log(check.detail.replace(/\n$/, ""));
  }
  console.log("");
  console.log(`${summary.ok} passed, ${summary.fail} failed, ${summary.skip} skipped.`);
  if (summary.fail > 0) {
    console.log("");
    console.log("Still blocking a real game:");
    for (const check of checks.filter((c) => c.status === FAIL)) {
      console.log(`  - ${check.title}`);
    }
  }
  return summary.exitCode;
}

async function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes("--json");
  const offline = args.includes("--offline");

  const checks = [checkNarration()];
  if (offline) {
    checks.push({
      id: "live-checks",
      title: "Live checks (Vercel, Firebase)",
      status: SKIP,
      detail: "  --offline was passed.",
    });
  } else {
    const state = {};
    checks.push(...checkVercelEnv(state));
    checks.push(checkLocalEnv());
    checks.push(checkVercelDeployment(state));
    // Must come after both of the above: it compares what they each read.
    checks.push(checkBuildEnvFreshness(state));
    checks.push(...(await checkDeployedRoutes()));
    checks.push(...(await checkDatabase(projectId())));
  }
  process.exit(report(checks, asJson));
}

// Only run when invoked directly — src/test/preflight.test.ts imports the pure
// helpers above and must not trigger a network round trip by doing so. The
// comparison is on resolved paths, not a filename suffix: under vitest (and
// under any wrapper whose own filename happens to end the same way) a suffix
// test matches and fires the whole live check inside the test run.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
