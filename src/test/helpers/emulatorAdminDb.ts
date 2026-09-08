/**
 * The slice of the Firebase Admin `Database` API that the two server routes
 * (src/app/api/rooms/[code]/start/route.ts and
 * src/app/api/games/[gameId]/advance/route.ts) actually use, backed by a
 * real RTDB emulator connection instead of an in-memory store.
 *
 * This is the emulator-backed sibling of helpers/fakeAdminDb.ts. The fake
 * exists so gameFlowEndToEnd.test.ts can play whole games with zero
 * infrastructure; this one exists so multiClientGame.test.ts can play one
 * game where the SAME route code writes through the real database while
 * several rule-enforced client connections read and write alongside it —
 * the closest approximation available here of the resilience plan's last
 * checklist item, "run a real multi-device game".
 *
 * The connection handed in must be the rules-bypassing ("owner") one from
 * `RulesTestEnvironment.withSecurityRulesDisabled` — the Admin SDK ignores
 * Security Rules, so anything standing in for it has to as well, or the
 * routes would be tested against a permission model they never run under.
 */

import {
  type Database,
  type DataSnapshot,
  ref,
  get,
  set,
  update,
  push,
  runTransaction,
} from "firebase/database";

type Json = unknown;

/**
 * What `ref().push()` returns in the Admin SDK: a reference whose `.key` is
 * readable synchronously (the start route needs the generated game id before
 * it writes anything) but which is also awaitable when a value was passed
 * (the advance route awaits `push()` for the Seer's hint). Resolving to
 * `undefined` rather than to itself matters: `await` unwraps thenables
 * recursively, so a `then` that hands back another thenable never settles.
 */
class PushedRef {
  constructor(
    readonly key: string | null,
    private readonly pending: Promise<unknown>,
  ) {}

  then(onFulfilled?: () => unknown, onRejected?: (reason: unknown) => unknown): Promise<unknown> {
    return this.pending.then(() => undefined).then(onFulfilled, onRejected);
  }
}

class EmulatorAdminRef {
  constructor(
    private readonly db: Database,
    private readonly path: string,
  ) {}

  private node() {
    return this.path ? ref(this.db, this.path) : ref(this.db);
  }

  get key(): string | null {
    const segments = this.path.split("/").filter(Boolean);
    return segments.length ? segments[segments.length - 1] : null;
  }

  get(): Promise<DataSnapshot> {
    return get(this.node());
  }

  async set(value: Json): Promise<void> {
    await set(this.node(), value === undefined ? null : value);
  }

  /** Admin-style: the keys are paths relative to this ref, and the routes
   * always call it on the root ref with full paths — same as the fake. */
  async update(values: Record<string, Json>): Promise<void> {
    await update(this.node(), values);
  }

  /** The JS client's runTransaction runs its update function against the
   * LOCAL cache first and treats a returned `undefined` as a final abort —
   * it never retries against the server after one. A cold connection caches
   * nothing, so the advance route's version claim (`if (current !==
   * game.phase.version) return`) would abort on `null` every single time.
   * Callers must therefore keep the namespace synced for as long as they
   * hold this database — see withServer() in multiClientGame.test.ts. */
  async transaction(
    updateFn: (current: Json) => Json,
  ): Promise<{ committed: boolean; snapshot: DataSnapshot }> {
    const result = await runTransaction(this.node(), updateFn as (current: unknown) => unknown);
    return { committed: result.committed, snapshot: result.snapshot };
  }

  push(value?: Json): PushedRef {
    const parent = this.node();
    const child = value === undefined ? push(parent) : push(parent, value);
    return new PushedRef(child.key, Promise.resolve(child));
  }
}

export class EmulatorAdminDatabase {
  constructor(private readonly db: Database) {}

  ref(path = ""): EmulatorAdminRef {
    return new EmulatorAdminRef(this.db, path);
  }
}
