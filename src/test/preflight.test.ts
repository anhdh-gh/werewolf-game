// @vitest-environment node
//
// scripts/preflight.mjs is the one place that answers "what is still missing
// before a real game can run". It is only worth trusting if two things hold,
// and neither is self-evident:
//
//   1. Its list of required environment variables is the list the code
//      actually reads. A preflight that silently omits a variable is worse
//      than none — it reports PASS and the owner deploys into a 500. So this
//      file greps the shipped source for every `process.env.X` and fails if
//      the table and the code disagree in either direction.
//   2. Its parsers survive the real CLI output shapes. `vercel ls` writes its
//      table to stderr and bare URLs to stdout; `vercel env ls` does the
//      opposite; the Vercel status column carries a "●" bullet; a secret's
//      value column reads "Hidden". Each of those is pinned below with a
//      captured sample, because getting one wrong turns into a false PASS.
//
// Nothing here touches the network: preflight.mjs only runs its checks when
// invoked as a script, so importing it is inert.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  REQUIRED_ENV,
  SMOKE_ROUTES,
  classifyRouteProbe,
  parseProductionOrigin,
  diffRuleSections,
  normalizeRules,
  parseDatabaseRegionRedirect,
  parseEnvFileNames,
  classifyBuildEnvFreshness,
  parseRelativeAge,
  parseVercelDeployments,
  parseVercelEnvList,
  parseVercelEnvRows,
  summarize,
} from "../../scripts/preflight.mjs";
import { REPO_ROOT } from "../../scripts/narration-catalog.mjs";

/** Variables that are read by tooling rather than by the running app, so they
 * are deliberately not part of the deploy preflight. Each needs a reason. */
const NOT_DEPLOY_TIME = new Set([
  // Only scripts/render-narration.mjs reads these, on the owner's machine,
  // once. They are never present in production and must never be required
  // there. Their own coverage lives in narrationCatalog.test.ts.
  "GOOGLE_TTS_API_KEY",
  "AZURE_SPEECH_KEY",
  "AZURE_SPEECH_REGION",
]);

/** Strips block comments and whole-line `//` comments before grepping.
 * src/lib/firebase/client.ts explains the Next.js inlining rule in prose that
 * contains the literal `process.env.NEXT_PUBLIC_X`, which is documentation,
 * not a variable — matching it would demand a preflight entry for a name that
 * does not exist. Only full-line comments are removed, so a trailing `//`
 * after real code (or a `https://` inside one) can never eat a real read. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => !/^\s*(\/\/|\*)/.test(line))
    .join("\n");
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function envNamesReadBySource(): Set<string> {
  const names = new Set<string>();
  for (const file of walk(path.join(REPO_ROOT, "src"))) {
    // src/test/** sets fake values for its own fixtures; those are not
    // deployment requirements.
    if (file.includes(`${path.sep}test${path.sep}`)) continue;
    for (const match of stripComments(readFileSync(file, "utf8")).matchAll(
      /process\.env\.([A-Z][A-Z_0-9]*)/g,
    )) {
      names.add(match[1]);
    }
  }
  return names;
}

describe("preflight required-variable table", () => {
  const fromSource = envNamesReadBySource();

  it("requires every environment variable the shipped app reads", () => {
    const declared = new Set(REQUIRED_ENV.map((entry) => entry.name));
    const unpreflighted = [...fromSource].filter(
      (name) => !declared.has(name) && !NOT_DEPLOY_TIME.has(name),
    );
    expect(unpreflighted).toEqual([]);
  });

  it("does not require variables nothing reads", () => {
    const stale = REQUIRED_ENV.map((entry) => entry.name).filter((name) => !fromSource.has(name));
    expect(stale).toEqual([]);
  });

  it("points each variable at a file that really reads it", () => {
    const wrong = REQUIRED_ENV.filter(
      (entry) =>
        !readFileSync(path.join(REPO_ROOT, entry.readBy), "utf8").includes(
          `process.env.${entry.name}`,
        ),
    ).map((entry) => `${entry.name} -> ${entry.readBy}`);
    expect(wrong).toEqual([]);
  });

  it("explains, for every variable, what breaks without it and how to set it", () => {
    // A preflight that only prints a name is a search task, not an answer:
    // FIREBASE_SERVICE_ACCOUNT_KEY and NEXT_PUBLIC_FIREBASE_VAPID_KEY live on
    // two different Firebase console pages, neither obvious. Every entry has
    // to carry both halves.
    const incomplete = REQUIRED_ENV.filter(
      (entry) =>
        !entry.howToSet ||
        !entry.why ||
        entry.why.length < 20 ||
        !["build", "runtime"].includes(entry.scope),
    ).map((entry) => entry.name);
    expect(incomplete).toEqual([]);
  });
});

describe("vercel output parsing", () => {
  // Captured verbatim from `vercel env ls production` on 2026-09-08.
  const ENV_LS = [
    "",
    " name                                        value                       type      environments                        created    ",
    " FIREBASE_SERVICE_ACCOUNT_KEY                Hidden                      Secret    Production                          3m ago     ",
    " NEXT_PUBLIC_FIREBASE_APP_ID                 eyJ2IjoidjIiLCJjIj…         Config    Production, Preview, Development    2d ago     ",
    "",
    "Next steps:",
    "- Add an Environment Variable:",
    "  vercel env add",
  ].join("\n");

  it("reads the name column and nothing else", () => {
    expect(parseVercelEnvList(ENV_LS)).toEqual([
      "FIREBASE_SERVICE_ACCOUNT_KEY",
      "NEXT_PUBLIC_FIREBASE_APP_ID",
    ]);
  });

  it("never lets a value reach the report", () => {
    const names = parseVercelEnvList(ENV_LS).join(" ");
    expect(names).not.toContain("Hidden");
    expect(names).not.toContain("eyJ2");
  });

  it("stops at the end of the table instead of reading the CLI's own footer", () => {
    // Regression: "  vercel env add" in the Next steps footer has a valid
    // identifier as its first token, so a footer-blind parser reported a
    // variable named "vercel" as set — harmless here, but the same bug on a
    // differently-worded footer is how a missing credential gets reported OK.
    expect(parseVercelEnvList(ENV_LS)).not.toContain("vercel");
  });

  it("ignores the bare-URL stdout half that gets concatenated with the table", () => {
    const combined = `https://werewolf-game-p8pnmevhi.vercel.app\n${ENV_LS}`;
    expect(parseVercelEnvList(combined)).toEqual([
      "FIREBASE_SERVICE_ACCOUNT_KEY",
      "NEXT_PUBLIC_FIREBASE_APP_ID",
    ]);
  });

  // Captured verbatim from `vercel ls` on 2026-09-08 — note the "●" bullet
  // glued to the status column, which a naive split on whitespace mistakes for
  // the status itself.
  const LS = [
    "  Age     Project                    Deployment                                    Status      Environment     Duration     Username",
    "  9m      dohunganh/werewolf-game    https://werewolf-game-p8pnmevhi.vercel.app     ● Ready     Production      23s          dohunganh",
    "  12h     dohunganh/werewolf-game    https://werewolf-game-fg7k14vjq.vercel.app     ● Error     Production      18s          dohunganh",
    "  13h     dohunganh/werewolf-game    https://werewolf-game-aaaaaaaaa.vercel.app     ● Ready     Preview         18s          dohunganh",
  ].join("\n");

  it("reads status and environment past the bullet, newest first", () => {
    expect(parseVercelDeployments(LS)).toEqual([
      {
        age: "9m",
        url: "https://werewolf-game-p8pnmevhi.vercel.app",
        status: "Ready",
        environment: "Production",
      },
      {
        age: "12h",
        url: "https://werewolf-game-fg7k14vjq.vercel.app",
        status: "Error",
        environment: "Production",
      },
      {
        age: "13h",
        url: "https://werewolf-game-aaaaaaaaa.vercel.app",
        status: "Ready",
        environment: "Preview",
      },
    ]);
  });

  it("skips the header row rather than reading it as a deployment", () => {
    expect(parseVercelDeployments(LS).map((row) => row.url)).not.toContain("Deployment");
  });
});

// Setting a NEXT_PUBLIC_* variable in Vercel and having the served site
// actually contain it are two different facts: Next.js inlines those at build
// time, so one set after the last build is absent from the bundle and the app
// behaves exactly as if it had never been set. The plain "is it set" check
// above reports PASS in that state, which is the specific false all-clear this
// suite exists to prevent. Vercel only ever reports rounded relative ages, so
// the comparison must also refuse to answer when the two ages are genuinely
// indistinguishable rather than guess.
describe("build-time variables reaching the deployed bundle", () => {
  // Captured verbatim from `vercel env ls production` on 2026-09-08, after the
  // owner supplied the VAPID and LiveKit credentials. Note that the
  // `environments` column is a comma-and-space list of varying width, so the
  // `created` column can only be reached by anchoring on the end of the row.
  const ENV_LS_WITH_AGES = [
    " name                                        value                       type      environments                        created    ",
    " NEXT_PUBLIC_FIREBASE_VAPID_KEY              eyJ2IjoidjIiLCJjIj…         Config    Production                          24m ago    ",
    " LIVEKIT_API_SECRET                          Hidden                      Secret    Production                          26m ago    ",
    " NEXT_PUBLIC_LIVEKIT_URL                     eyJ2IjoidjIiLCJjIj…         Config    Production                          26m ago    ",
    " NEXT_PUBLIC_FIREBASE_APP_ID                 eyJ2IjoidjIiLCJjIj…         Config    Production, Preview, Development    2d ago     ",
    "",
  ].join("\n");

  const rows = () => parseVercelEnvRows(ENV_LS_WITH_AGES);
  const buildScoped = new Set(
    REQUIRED_ENV.filter((variable) => variable.scope === "build").map((variable) => variable.name),
  );

  it("reads each row's created age without reading its value", () => {
    expect(rows()).toEqual([
      { name: "NEXT_PUBLIC_FIREBASE_VAPID_KEY", age: "24m" },
      { name: "LIVEKIT_API_SECRET", age: "26m" },
      { name: "NEXT_PUBLIC_LIVEKIT_URL", age: "26m" },
      { name: "NEXT_PUBLIC_FIREBASE_APP_ID", age: "2d" },
    ]);
    const serialized = JSON.stringify(rows());
    expect(serialized).not.toContain("eyJ2");
    expect(serialized).not.toContain("Hidden");
  });

  it("keeps parseVercelEnvList as exactly the names of those rows", () => {
    expect(parseVercelEnvList(ENV_LS_WITH_AGES)).toEqual(rows().map((row) => row.name));
  });

  it("reads an age as a span, not a point, because Vercel truncates it", () => {
    expect(parseRelativeAge("5m")).toEqual({ seconds: 300, granularity: 60 });
    expect(parseRelativeAge("2d")).toEqual({ seconds: 172800, granularity: 86400 });
    // "mo" has to win over "m", or three months would read as three minutes.
    expect(parseRelativeAge("3mo")).toEqual({ seconds: 7776000, granularity: 2592000 });
    for (const junk of ["Hidden", "ago", "", "m", "5x", null, undefined]) {
      expect([junk, parseRelativeAge(junk as string)]).toEqual([junk, null]);
    }
  });

  it("passes a build newer than every variable, and ignores runtime-only ones", () => {
    const verdict = classifyBuildEnvFreshness(rows(), "5m", buildScoped);
    expect(verdict.setAfterBuild).toEqual([]);
    expect(verdict.unknown).toEqual([]);
    expect(verdict.inBuild).toEqual([
      "NEXT_PUBLIC_FIREBASE_VAPID_KEY",
      "NEXT_PUBLIC_LIVEKIT_URL",
      "NEXT_PUBLIC_FIREBASE_APP_ID",
    ]);
    // LIVEKIT_API_SECRET is read by a route at runtime, not inlined, so a
    // redeploy is irrelevant to it and flagging it would be a false alarm.
    expect(verdict.inBuild).not.toContain("LIVEKIT_API_SECRET");
  });

  it("catches the variable that is set but absent from the served bundle", () => {
    // The build is 40m old; VAPID and the LiveKit URL were set 24m and 26m
    // ago. Both are "set in Vercel" and neither is in the deployed JS.
    const verdict = classifyBuildEnvFreshness(rows(), "40m", buildScoped);
    expect(verdict.setAfterBuild).toEqual([
      "NEXT_PUBLIC_FIREBASE_VAPID_KEY",
      "NEXT_PUBLIC_LIVEKIT_URL",
    ]);
    expect(verdict.inBuild).toEqual(["NEXT_PUBLIC_FIREBASE_APP_ID"]);
  });

  it("refuses to judge when the two rounded ages overlap", () => {
    const same = [{ name: "NEXT_PUBLIC_LIVEKIT_URL", age: "24m" }];
    expect(classifyBuildEnvFreshness(same, "24m", buildScoped).unknown).toEqual([
      "NEXT_PUBLIC_LIVEKIT_URL",
    ]);
    // Coarser unit on one side widens the doubt rather than inventing a
    // verdict: "1d" is anywhere in [24h, 48h), which straddles a 30h build.
    const day = [{ name: "NEXT_PUBLIC_LIVEKIT_URL", age: "1d" }];
    expect(classifyBuildEnvFreshness(day, "30h", buildScoped).unknown).toEqual([
      "NEXT_PUBLIC_LIVEKIT_URL",
    ]);
    // But [24h, 48h) is entirely after a 20h build, so that one is decidable.
    expect(classifyBuildEnvFreshness(day, "20h", buildScoped).inBuild).toEqual([
      "NEXT_PUBLIC_LIVEKIT_URL",
    ]);
  });

  it("decides adjacent buckets, which do not actually overlap", () => {
    const older = [{ name: "NEXT_PUBLIC_LIVEKIT_URL", age: "25m" }];
    const newer = [{ name: "NEXT_PUBLIC_LIVEKIT_URL", age: "23m" }];
    expect(classifyBuildEnvFreshness(older, "24m", buildScoped).inBuild).toEqual([
      "NEXT_PUBLIC_LIVEKIT_URL",
    ]);
    expect(classifyBuildEnvFreshness(newer, "24m", buildScoped).setAfterBuild).toEqual([
      "NEXT_PUBLIC_LIVEKIT_URL",
    ]);
  });

  it("never reports an unreadable age as fine", () => {
    const unreadable = [{ name: "NEXT_PUBLIC_LIVEKIT_URL", age: null }];
    const verdict = classifyBuildEnvFreshness(unreadable, "5m", buildScoped);
    expect(verdict.unknown).toEqual(["NEXT_PUBLIC_LIVEKIT_URL"]);
    expect(verdict.inBuild).toEqual([]);
  });

  it("covers every build-time variable the table declares", () => {
    // If a NEXT_PUBLIC_* is added to REQUIRED_ENV, it is automatically in
    // scope here — this pins that `scope` is actually being used to select.
    expect(buildScoped.size).toBeGreaterThan(0);
    for (const name of buildScoped) expect(name.startsWith("NEXT_PUBLIC_")).toBe(true);
    const runtime = REQUIRED_ENV.filter((variable) => variable.scope !== "build");
    for (const variable of runtime) {
      expect([variable.name, variable.name.startsWith("NEXT_PUBLIC_")]).toEqual([
        variable.name,
        false,
      ]);
    }
  });
});

describe("deployed-rules comparison", () => {
  it("calls a reformatted copy of the committed rules a match", () => {
    const committed = readFileSync(path.join(REPO_ROOT, "database.rules.json"), "utf8");
    const reserialized = JSON.stringify(JSON.parse(committed));
    expect(normalizeRules(reserialized)).toBe(normalizeRules(committed));
  });

  it("tolerates the comments Firebase allows in a ruleset source", () => {
    const withComments = '{\n  // released by CI\n  "rules": { ".read": false }\n}';
    expect(normalizeRules(withComments)).toBe(normalizeRules('{"rules":{".read":false}}'));
  });

  it("still notices a real difference — key order is not content", () => {
    expect(normalizeRules('{"rules":{"a":1,"b":2}}')).toBe(normalizeRules('{"rules":{"b":2,"a":1}}'));
    expect(normalizeRules('{"rules":{"a":1}}')).not.toBe(normalizeRules('{"rules":{"a":2}}'));
  });

  it("would catch a rules file that lost a path's auth requirement", () => {
    const committed = readFileSync(path.join(REPO_ROOT, "database.rules.json"), "utf8");
    const weakened = committed.replace('"auth != null"', '"true"');
    expect(weakened).not.toBe(committed);
    expect(normalizeRules(weakened)).not.toBe(normalizeRules(committed));
  });
});

describe("naming which rule sections are wrong", () => {
  // normalizeRules answers "are these the same ruleset". That is enough to fail
  // the check but not enough to act on: the owner needs to know which features
  // are dead live. These pin the section-level breakdown that the FAIL prints.
  const committed = () => readFileSync(path.join(REPO_ROOT, "database.rules.json"), "utf8");

  it("reports nothing when the deployed ruleset is the committed one", () => {
    const diff = diffRuleSections(JSON.stringify(JSON.parse(committed())), committed());
    expect(diff).toEqual({ missing: [], extra: [], differing: [] });
  });

  it("names every committed section the live ruleset has never heard of", () => {
    // This is the shape actually found deployed on 2026-09-08: an older ruleset
    // covering only the lobby, with the whole game runtime absent. RTDB rules do
    // not cascade upward, so those paths were denied for every client.
    const deployed = JSON.stringify({
      rules: { presence: { $uid: { ".read": "auth != null" } }, rooms: { $code: {} } },
    });
    const diff = diffRuleSections(deployed, committed());
    expect(diff.missing).toEqual(
      expect.arrayContaining(["games", "actions", "chat", "private", "fcmTokens"]),
    );
    expect(diff.missing).not.toContain("presence");
    expect(diff.extra).toEqual([]);
  });

  it("separates a section that is present but changed from one that is absent", () => {
    const base = '{"rules":{"a":{".read":"auth != null"},"b":{".read":true}}}';
    const diff = diffRuleSections('{"rules":{"a":{".read":"true"},"c":{}}}', base);
    expect(diff.differing).toEqual(["a"]);
    expect(diff.missing).toEqual(["b"]);
    expect(diff.extra).toEqual(["c"]);
  });

  it("compares inside the rules wrapper, so it never just reports \"rules\"", () => {
    const diff = diffRuleSections('{"rules":{}}', committed());
    expect(diff.missing).not.toContain("rules");
    expect(diff.missing.length).toBeGreaterThan(0);
  });

  it("ignores key order and comments, exactly as the match check does", () => {
    const a = '{\n  // deployed\n  "rules":{"x":{"p":1,"q":2}}\n}';
    const b = '{"rules":{"x":{"q":2,"p":1}}}';
    expect(diffRuleSections(a, b)).toEqual({ missing: [], extra: [], differing: [] });
  });

  it("treats a ruleset with no rules wrapper as having no sections", () => {
    expect(diffRuleSections("{}", '{"rules":{"games":{}}}').missing).toEqual(["games"]);
  });
});

describe("supporting parsers", () => {
  it("finds the canonical host in RTDB's wrong-region 404 body", () => {
    const body = JSON.stringify({
      correctUrl: "https://werewolf-game-2026-default-rtdb.asia-southeast1.firebasedatabase.app",
      error: "Database lives in a different region.",
    });
    expect(parseDatabaseRegionRedirect(body)).toBe(
      "https://werewolf-game-2026-default-rtdb.asia-southeast1.firebasedatabase.app",
    );
  });

  it("returns null for a body that is not a region redirect", () => {
    expect(parseDatabaseRegionRedirect('{"error":"Permission denied"}')).toBeNull();
    expect(parseDatabaseRegionRedirect("not json at all")).toBeNull();
  });

  it("reads only names out of a dotenv file, never values", () => {
    const contents = 'A=1\nexport B="two"\n# C=3\n\nD=\n';
    expect(parseEnvFileNames(contents)).toEqual(["A", "B", "D"]);
  });
});

// The route probes are the only checks in preflight.mjs that ask deployed code
// to run rather than reading configuration, and they exist because the other
// nine reported PASS for two hours while every route on wolf.anhdh.net
// returned a bare 500 (see SMOKE_ROUTES' own comment). Two things have to hold
// for them to be worth anything: they must point at routes that still exist,
// and a 5xx must actually fail the run.
describe("deployed route probes", () => {
  const origin = "https://example.test";

  it("reads the production origin out of the app's own metadataBase", () => {
    const layout = readFileSync(path.join(REPO_ROOT, "src/app/layout.tsx"), "utf8");
    const parsed = parseProductionOrigin(layout);
    expect(parsed).toMatch(/^https:\/\/[^/]+$/);
    expect(layout).toContain(parsed as string);
  });

  it("returns null rather than a wrong URL when metadataBase is gone", () => {
    expect(parseProductionOrigin("export const metadata = { title: 'x' };")).toBeNull();
  });

  it("probes a route file that actually exists, for every entry", () => {
    for (const probe of SMOKE_ROUTES) {
      expect(existsSync(path.join(REPO_ROOT, probe.route))).toBe(true);
    }
  });

  it("covers every API route in the app", () => {
    const routeFiles = walk(path.join(REPO_ROOT, "src/app/api"))
      .filter((file) => path.basename(file) === "route.ts")
      .map((file) => path.relative(REPO_ROOT, file));
    expect(new Set(SMOKE_ROUTES.map((probe) => probe.route))).toEqual(new Set(routeFiles));
  });

  it("passes when a route answers with its own guard", () => {
    const probe = SMOKE_ROUTES[0];
    const check = classifyRouteProbe(probe, { status: probe.expect, body: "{}" }, origin);
    expect(check.status).toBe("ok");
  });

  it("FAILS on the 500 this check was built for — an empty-bodied module-load crash", () => {
    const probe = SMOKE_ROUTES[0];
    const check = classifyRouteProbe(
      probe,
      { status: 500, body: "", vercelError: "FUNCTION_INVOCATION_FAILED" },
      origin,
    );
    expect(check.status).toBe("fail");
    expect(summarize([check]).exitCode).toBe(1);
    // The owner needs the one command that shows the real stack; a bare 500
    // with no body says nothing on its own.
    expect(check.detail).toContain("vercel logs");
    expect(check.detail).toContain("FUNCTION_INVOCATION_FAILED");
  });

  it("SKIPs, not FAILs, when something in front of the app answers instead", () => {
    // Vercel Deployment Protection answers 401 for the whole site. The probe
    // never reached the route, so it proves nothing either way — calling that
    // a broken route would train the owner to ignore this check.
    const probe = SMOKE_ROUTES[0];
    const check = classifyRouteProbe(probe, { status: 401, body: "Authentication Required" }, origin);
    expect(check.status).toBe("skip");
    expect(summarize([check]).exitCode).toBe(0);
  });

  it("SKIPs when the request never completed", () => {
    const probe = SMOKE_ROUTES[0];
    const check = classifyRouteProbe(probe, { status: 0, body: "", error: "ETIMEDOUT" }, origin);
    expect(check.status).toBe("skip");
  });

  it("gives every probe a distinct id and a distinct report line", () => {
    // The livekit route is probed twice (with and without a bearer token), so
    // path alone no longer identifies a probe. Two checks sharing a title
    // would make the report unreadable in exactly the case that matters.
    const ids = SMOKE_ROUTES.map((probe) => probe.id);
    expect(new Set(ids).size).toBe(ids.length);
    const titles = SMOKE_ROUTES.map(
      (probe) => classifyRouteProbe(probe, { status: probe.expect, body: "{}" }, origin).title,
    );
    expect(new Set(titles).size).toBe(titles.length);
  });

  // A malformed bearer token is the only probe that makes the deployed Admin
  // SDK do real work: reaching its 401 means verifyIdToken loaded the service
  // account and ran the jwks-rsa -> jose chain that took production down. It
  // is only meaningful because the route answers 500 rather than 401 when that
  // chain cannot run — see isTokenRejection in the route itself.
  it("exercises verifyIdToken with a token that cannot possibly be valid", () => {
    const probe = SMOKE_ROUTES.find((entry) => entry.id === "route-livekit-verify");
    expect(probe).toBeDefined();
    expect(probe!.headers?.authorization).toMatch(/^Bearer \S+$/);
    // Three dots would be a JWT shape; this is not even that, and carries no
    // signature — it cannot authenticate anyone if the verifier does work.
    expect(probe!.headers!.authorization).not.toMatch(/^Bearer [\w-]+\.[\w-]+\.[\w-]+$/);
    expect(probe!.expect).toBe(401);
    const broken = classifyRouteProbe(probe!, { status: 500, body: "" }, origin);
    expect(broken.status).toBe("fail");
  });
});

describe("exit policy", () => {
  const check = (status: string) => ({ status });

  it("fails the run on any FAIL", () => {
    expect(summarize([check("ok"), check("fail"), check("skip")])).toEqual({
      ok: 1,
      fail: 1,
      skip: 1,
      exitCode: 1,
    });
  });

  it("does not fail on skips alone — a skip means 'could not determine from here'", () => {
    expect(summarize([check("ok"), check("skip"), check("skip")]).exitCode).toBe(0);
  });

  it("passes an all-clear run", () => {
    expect(summarize([check("ok")]).exitCode).toBe(0);
  });
});
