/**
 * A minimal in-memory stand-in for the Firebase Admin `Database` interface —
 * just enough of `ref().get()/.set()/.update()/.transaction()/.push()` for
 * the actual route handlers (src/app/api/**\/route.ts) to run against,
 * unmodified, in a test. This is what lets the "end to end" tests drive real
 * production code instead of re-implementing its logic — see the network
 * note in rulesGames.test.ts for why this exists instead of the RTDB
 * emulator: no live Firebase is reachable from this sandbox.
 *
 * It does NOT enforce Security Rules — that's rulesGames.test.ts's job
 * (against the real emulator, elsewhere). This only proves the route's own
 * orchestration logic (readiness gating, phase transitions, what gets
 * written where) is correct.
 */

type Json = unknown;

function parts(path: string): string[] {
  return path.split("/").filter(Boolean);
}

function getAt(root: Record<string, Json>, path: string): Json {
  let cur: Json = root;
  for (const p of parts(path)) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, Json>)[p];
  }
  return cur;
}

function setAt(root: Record<string, Json>, path: string, value: Json): void {
  const segments = parts(path);
  if (segments.length === 0) {
    for (const k of Object.keys(root)) delete root[k];
    if (value && typeof value === "object") Object.assign(root, value as object);
    return;
  }
  let cur: Record<string, Json> = root;
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    const next = cur[seg];
    if (typeof next !== "object" || next === null) cur[seg] = {};
    cur = cur[seg] as Record<string, Json>;
  }
  const last = segments[segments.length - 1];
  if (value === null || value === undefined) {
    delete cur[last];
  } else {
    cur[last] = value;
  }
}

class FakeSnapshot {
  constructor(private readonly value: Json) {}
  exists(): boolean {
    return this.value !== undefined && this.value !== null;
  }
  val(): Json {
    return this.value === undefined ? null : structuredClone(this.value);
  }
}

class FakeRef {
  constructor(
    private readonly store: FakeAdminDatabase,
    private readonly path: string,
  ) {}

  get key(): string | null {
    const segments = parts(this.path);
    return segments.length ? segments[segments.length - 1] : null;
  }

  async get() {
    return new FakeSnapshot(getAt(this.store.root, this.path));
  }

  async set(value: Json): Promise<void> {
    setAt(this.store.root, this.path, value === undefined ? null : structuredClone(value));
  }

  /** Mirrors the Admin SDK: keys of `values` are full paths from the DB
   * root (the routes always call `db.ref().update({ "games/x/phase": ... })`),
   * not paths relative to this ref — matching real usage exactly. */
  async update(values: Record<string, Json>): Promise<void> {
    for (const [key, value] of Object.entries(values)) {
      setAt(this.store.root, key, value === undefined ? null : structuredClone(value));
    }
  }

  async transaction(
    updateFn: (current: Json) => Json,
  ): Promise<{ committed: boolean; snapshot: FakeSnapshot }> {
    const current = getAt(this.store.root, this.path);
    const next = updateFn(current === undefined ? null : current);
    if (next === undefined) {
      return { committed: false, snapshot: new FakeSnapshot(current) };
    }
    setAt(this.store.root, this.path, next);
    return { committed: true, snapshot: new FakeSnapshot(next) };
  }

  /** Mirrors the Admin SDK's `ref.push(value)`: generates a new child key
   * and, when a value is given, writes it there immediately (real Firebase
   * does this asynchronously but `then()` above lets `await` wait for it
   * all the same). Real push() keys are timestamp-based and sort correctly
   * as plain strings by construction — this fake's counter-based keys are
   * zero-padded so the same "sort the keys, get chronological order"
   * property holds for callers (e.g. reading narration/{seq} history back
   * in order) regardless of how many pushes have happened. */
  push(value?: Json): FakeRef {
    const key = `fake${String(++this.store.counter).padStart(8, "0")}`;
    const childPath = this.path ? `${this.path}/${key}` : key;
    if (value !== undefined) {
      setAt(this.store.root, childPath, structuredClone(value));
    }
    return new FakeRef(this.store, childPath);
  }
}

export class FakeAdminDatabase {
  root: Record<string, Json> = {};
  counter = 0;

  ref(path = ""): FakeRef {
    return new FakeRef(this, path);
  }
}
