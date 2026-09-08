// @vitest-environment node
//
// Why a test about a transitive dependency's module format:
//
// On 2026-09-08 every Admin-SDK route on wolf.anhdh.net returned a bare 500.
// The cause was never in this repo's code:
//
//   Failed to load external module firebase-admin-<hash>/auth:
//   ERR_REQUIRE_ESM: require() of ES Module node_modules/jose/dist/webapi/index.js
//   from node_modules/jwks-rsa/src/utils.js not supported.
//
// `firebase-admin` is on Next's default `serverExternalPackages` list, so it is
// never bundled — the deployed function `require()`s it straight out of
// node_modules. firebase-admin -> jwks-rsa@4 -> `require('jose')`, and jose@6
// dropped its CommonJS build entirely (v5 shipped both; v6 is ESM-only). That
// require only works on a runtime with `require(esm)` enabled, which the
// deployed function turned out not to be, so the route died at module load.
//
// The rest of the suite cannot see this: every test mocks the Admin SDK, so
// nothing here ever loads jwks-rsa. CI stayed green through a two-hour outage.
// package.json therefore pins jwks-rsa's jose to the last dual CJS/ESM major,
// and this test guards that pin — deliberately reading package-lock.json rather
// than node_modules, so it asserts what `npm ci` will install on Vercel rather
// than whatever happens to be unpacked on the machine running it.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { REPO_ROOT } from "../../scripts/narration-catalog.mjs";

const pkg = JSON.parse(
  readFileSync(path.join(REPO_ROOT, "package.json"), "utf8"),
);
const lock = JSON.parse(
  readFileSync(path.join(REPO_ROOT, "package-lock.json"), "utf8"),
);

/** jose 6.0.0 removed `exports["."].require`. Anything that reaches jose
 * through a CommonJS `require()` must therefore stay on 5.x or below. */
const LAST_DUAL_BUILD_MAJOR = 5;

/**
 * Node's resolution algorithm, replayed against the lockfile's flat package
 * map: from `node_modules/a/node_modules/b`, `require('jose')` checks
 * `node_modules/a/node_modules/b/node_modules/jose`, then
 * `node_modules/a/node_modules/jose`, then `node_modules/jose`.
 */
function resolveFromLock(importerDir: string, name: string): string | null {
  const segments = importerDir.split("/");
  for (let i = segments.length; i > 0; i--) {
    if (segments[i - 1] === "node_modules") continue;
    const candidate = [...segments.slice(0, i), "node_modules", name].join("/");
    if (lock.packages[candidate]) return candidate;
  }
  return lock.packages[`node_modules/${name}`] ? `node_modules/${name}` : null;
}

describe("server-external dependencies stay require()-able", () => {
  it("resolves jwks-rsa's jose to a version that still ships CommonJS", () => {
    const resolved = resolveFromLock("node_modules/jwks-rsa", "jose");
    expect(resolved).not.toBeNull();

    const version: string = lock.packages[resolved!].version;
    const major = Number(version.split(".")[0]);
    expect(
      major,
      `jwks-rsa resolves to jose@${version} at ${resolved}; jose >= 6 is ` +
        "ESM-only and jwks-rsa require()s it, which 500s every firebase-admin " +
        "route on the deployed runtime",
    ).toBeLessThanOrEqual(LAST_DUAL_BUILD_MAJOR);
  });

  it("keeps the pin in package.json so `npm install` cannot re-flatten it", () => {
    // Without the override npm hoists jose@6 (livekit-client and
    // @livekit/components-react both want ^6) and jwks-rsa picks it up again.
    expect(pkg.overrides?.["jwks-rsa"]?.jose).toBeDefined();
    const pinned = String(pkg.overrides["jwks-rsa"].jose);
    expect(Number(pinned.replace(/^[^\d]*/, "").split(".")[0])).toBeLessThanOrEqual(
      LAST_DUAL_BUILD_MAJOR,
    );
  });

  it("records the same override in the lockfile npm ci will replay", () => {
    expect(lock.packages[""].overrides).toEqual(pkg.overrides);
  });
});
