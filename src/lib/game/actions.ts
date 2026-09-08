import { type Database, ref, set } from "firebase/database";
import { gameActionPath } from "./paths";

/** Every player action — including an abstain vote (`target: null`) — is a
 * direct write to the player's own leaf (spec §6.2), so it inherits the SDK's
 * offline write queue for free. Nudges the server to check whether the whole
 * table is now done (a harmless no-op if it isn't — see the advance route's
 * readiness check). */
export async function submitAction(
  db: Database,
  gameId: string,
  phaseKey: string,
  uid: string,
  target: string | null,
): Promise<void> {
  await set(ref(db, gameActionPath(gameId, phaseKey, uid)), {
    target,
    done: true,
    at: Date.now(),
  });
  nudgeAdvance(gameId);
}

/** POSTs the advance endpoint once and reports whether the server actually
 * took it. `fetch` only rejects on a transport failure, so a 500 from a broken
 * deployment resolves normally — checking `res.ok` is the difference between
 * noticing an outage and silently treating it as success. Every failure lands
 * in the browser console, because a stuck table is otherwise indistinguishable
 * from a table waiting on a slow player. */
export async function requestAdvance(gameId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/games/${gameId}/advance`, { method: "POST" });
    if (!res.ok) {
      console.error(`advance(${gameId}) failed: HTTP ${res.status}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`advance(${gameId}) failed: request did not complete`, error);
    return false;
  }
}

/** Best-effort early nudge: if it fails, the phase's own `endsAt` timer in
 * useAutoAdvance still drives the transition, and that one retries. */
export function nudgeAdvance(gameId: string): void {
  void requestAdvance(gameId);
}
