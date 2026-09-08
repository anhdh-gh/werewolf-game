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

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  REQUIRED_ENV,
  normalizeRules,
  parseDatabaseRegionRedirect,
  parseEnvFileNames,
  parseVercelDeployments,
  parseVercelEnvList,
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
