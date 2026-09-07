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

export function nudgeAdvance(gameId: string): void {
  fetch(`/api/games/${gameId}/advance`, { method: "POST" }).catch(() => {
    // best-effort — the next tick's timer-driven call covers it either way
  });
}
