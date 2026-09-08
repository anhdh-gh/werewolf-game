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
 * database:instances:list`, `firebase database:rules:list/get`, and
 * unauthenticated HTTPS GETs. It never deploys, never writes to the database,
 * never creates an auth user, and never prints an environment variable's
 * value — only whether the name is set. (`vercel env ls` shows values
 * encrypted anyway; this script parses the name column and drops the rest.)
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
export function parseVercelEnvList(stdout) {
  const names = [];
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
    if (/^[A-Za-z_][A-Za-z_0-9]*$/.test(name)) names.push(name);
  }
  return names;
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
export function normalizeRules(source) {
  const withoutComments = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  return stableStringify(JSON.parse(withoutComments));
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

const OK = "ok";
const FAIL = "fail";
const SKIP = "skip";

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

async function httpStatus(url, timeoutMs = 30_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return { status: response.status, body: await response.text() };
  } catch (error) {
    return { status: 0, body: "", error: String(error) };
  } finally {
    clearTimeout(timer);
  }
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

function checkVercelEnv() {
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
  const present = new Set(parseVercelEnvList(result.combined));
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

function checkVercelDeployment() {
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

  checks.push(checkDeployedRules(project));
  return checks;
}

/** Compares the ruleset actually released on the project against
 * database.rules.json. `database:rules:*` sits behind firebase-tools' own
 * `rtdbrules` experiment flag, which is a local CLI setting (not a project
 * change), so when it is off this reports the one command that turns it on
 * rather than guessing. */
function checkDeployedRules(project) {
  const list = run("firebase", ["database:rules:list", "--project", project, "--json"]);
  if (!list.ok) {
    // With --json, firebase-tools prints nothing at all for an unknown command
    // (the failure happens before its JSON reporter is wired up), so the reason
    // has to be re-fetched from the human-readable run.
    const plain = run("firebase", ["database:rules:list", "--project", project]);
    const output = `${list.combined}\n${plain.combined}`;
    const experimentOff = /is not a Firebase command|rtdbrules/i.test(output);
    return {
      id: "rtdb-rules-match",
      title: "Deployed rules match database.rules.json",
      status: SKIP,
      detail: experimentOff
        ? "  Needs firebase-tools' read-only ruleset API, which is behind an experiment flag:\n" +
          "      firebase experiments:enable rtdbrules\n" +
          "  (a local CLI setting — it changes nothing on the project), then re-run."
        : "  Could not read rulesets: " + (list.error ?? output.trim() ?? ""),
    };
  }
  let stableId;
  try {
    stableId = JSON.parse(list.stdout).result?.labeled?.stable;
  } catch {
    stableId = null;
  }
  if (!stableId) {
    return {
      id: "rtdb-rules-match",
      title: "Deployed rules match database.rules.json",
      status: SKIP,
      detail: "  Could not determine the released ruleset id from the CLI output.",
    };
  }
  const got = run("firebase", [
    "database:rules:get",
    stableId,
    "--project",
    project,
    "--json",
  ]);
  if (!got.ok) {
    return {
      id: "rtdb-rules-match",
      title: "Deployed rules match database.rules.json",
      status: SKIP,
      detail: `  Could not fetch ruleset ${stableId}: ` + (got.error ?? got.combined.trim()),
    };
  }
  let deployed;
  try {
    deployed = normalizeRules(JSON.parse(got.stdout).result.source);
  } catch (error) {
    return {
      id: "rtdb-rules-match",
      title: "Deployed rules match database.rules.json",
      status: SKIP,
      detail: "  Deployed ruleset was not parseable JSON: " + String(error),
    };
  }
  const committed = normalizeRules(readFileSync(RULES_FILE, "utf8"));
  if (deployed === committed) {
    return {
      id: "rtdb-rules-match",
      title: `Deployed rules match database.rules.json (ruleset ${stableId})`,
      status: OK,
    };
  }
  return {
    id: "rtdb-rules-match",
    title: `Deployed rules DIFFER from database.rules.json (ruleset ${stableId})`,
    status: FAIL,
    detail:
      "  The rules in this repo are what every rules test asserts against, so the tests\n" +
      "  are currently green about a ruleset that is not the one live.\n" +
      "  Deploy: firebase deploy --only database",
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
    checks.push(...checkVercelEnv());
    checks.push(checkLocalEnv());
    checks.push(checkVercelDeployment());
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
