// NOTE for whoever runs this: the sandboxed session that wrote this file
// could not reach firebase-public.firebaseio.com to run the RTDB emulator's
// rules validation (see Task 7 of docs/superpowers/plans/2026-09-07-game-engine.md)
// — that's a network policy on that machine, not a problem with these tests.
// Run `npm run emulators` then `npx vitest run src/test/rulesGames.test.ts`
// somewhere with normal internet access before trusting these rules live.

import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { ref, set, get } from "firebase/database";

let testEnv: RulesTestEnvironment;

const EXISTING_GAME = {
  roomCode: "EXIST1",
  startedAt: 1000,
  dayNumber: 1,
  phase: { name: "WOLVES", endsAt: 9999999999999, version: 1 },
  players: {
    "uid-wolf": { name: "Wolf", alive: true, muted: false },
    "uid-wolfman": { name: "Wolf Man", alive: true, muted: false },
    "uid-wolfcub": { name: "Wolf Cub", alive: true, muted: false },
    "uid-seer": { name: "Seer", alive: true, muted: false },
    "uid-witch": { name: "Witch", alive: true, muted: false },
    "uid-pacifist": { name: "Pacifist", alive: true, muted: false },
    "uid-sorcerer": { name: "Sorcerer", alive: true, muted: false },
    "uid-dead-hunter": { name: "Hunter", alive: false, muted: false },
    "uid-dead-villager": { name: "Villager", alive: false, muted: false },
  },
};

/** Every player in EXISTING_GAME gets their real /private entry, not just
 * the wolf. The rules for actions/ read the writer's role out of this tree
 * (see the "only the phase's own role may act" block below), so a fixture
 * that left it out would make a legitimate actor look like an impostor and
 * quietly turn every allow-case into a pass-for-the-wrong-reason. */
const EXISTING_PRIVATE: Record<string, Record<string, unknown>> = {
  "uid-wolf": {
    role: "WEREWOLF",
    initialRole: "WEREWOLF",
    potions: { heal: true, poison: true },
  },
  "uid-wolfman": { role: "WOLF_MAN", initialRole: "WOLF_MAN" },
  "uid-wolfcub": { role: "WOLF_CUB", initialRole: "WOLF_CUB" },
  "uid-seer": { role: "SEER", initialRole: "SEER" },
  "uid-witch": {
    role: "WITCH",
    initialRole: "WITCH",
    potions: { heal: true, poison: true },
  },
  "uid-pacifist": { role: "PACIFIST", initialRole: "PACIFIST" },
  "uid-sorcerer": { role: "SORCERER", initialRole: "SORCERER" },
  "uid-dead-hunter": { role: "HUNTER", initialRole: "HUNTER" },
  "uid-dead-villager": { role: "VILLAGER", initialRole: "VILLAGER" },
};

/** Rewrites only games/GAME1/phase/name — the actions rules gate on the
 * live phase, so a test about VOTE or PAIR_LOVERS has to move the game
 * there first. Uses the rules-disabled context because a client may never
 * write the phase (see the games/$gameId block above). */
async function setPhase(name: string): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await set(ref(context.database(), "games/GAME1/phase/name"), name);
  });
}

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
    await set(ref(context.database(), "games/GAME1"), EXISTING_GAME);
    await set(ref(context.database(), "private/GAME1"), EXISTING_PRIVATE);
  });
});

describe("games/$gameId", () => {
  it("denies read to an unauthenticated client", async () => {
    const db = testEnv.unauthenticatedContext().database();
    await assertFails(get(ref(db, "games/GAME1")));
  });

  it("allows read to any authenticated client", async () => {
    const db = testEnv.authenticatedContext("uid-seer").database();
    await assertSucceeds(get(ref(db, "games/GAME1")));
  });

  it("denies a client writing the phase directly, even the phase's own required actor", async () => {
    const db = testEnv.authenticatedContext("uid-wolf").database();
    await assertFails(
      set(ref(db, "games/GAME1/phase"), { name: "DAWN", endsAt: 0, version: 2 }),
    );
  });

  it("denies a client writing players, result, roomCode, startedAt, dayNumber, lastProtectedUid, or lastDeaths", async () => {
    const db = testEnv.authenticatedContext("uid-wolf").database();
    await assertFails(set(ref(db, "games/GAME1/players/uid-wolf/alive"), false));
    await assertFails(set(ref(db, "games/GAME1/result"), { winner: "WOLF" }));
    await assertFails(set(ref(db, "games/GAME1/roomCode"), "HACKED"));
    await assertFails(set(ref(db, "games/GAME1/dayNumber"), 99));
    await assertFails(set(ref(db, "games/GAME1/lastProtectedUid"), "uid-seer"));
    await assertFails(set(ref(db, "games/GAME1/lastDeaths"), ["uid-seer"]));
  });
});

describe("actions/$gameId — the role-hiding tree (spec §6.5)", () => {
  it("allows a player to write their own action while their phase is live", async () => {
    const db = testEnv.authenticatedContext("uid-wolf").database();
    await assertSucceeds(
      set(ref(db, "actions/GAME1/WOLVES/uid-wolf"), { target: "uid-seer", done: true, at: 1234 }),
    );
  });

  it("allows a Wolf Man to write a WOLVES action just like a Werewolf", async () => {
    const db = testEnv.authenticatedContext("uid-wolfman").database();
    await assertSucceeds(
      set(ref(db, "actions/GAME1/WOLVES/uid-wolfman"), {
        target: "uid-seer",
        done: true,
        at: 1234,
      }),
    );
  });

  it("allows a Wolf Cub to write a WOLVES action just like a Werewolf", async () => {
    const db = testEnv.authenticatedContext("uid-wolfcub").database();
    await assertSucceeds(
      set(ref(db, "actions/GAME1/WOLVES/uid-wolfcub"), {
        target: "uid-seer",
        done: true,
        at: 1234,
      }),
    );
  });

  it("denies writing an action for a phase that isn't the current one", async () => {
    const db = testEnv.authenticatedContext("uid-wolf").database();
    await assertFails(
      set(ref(db, "actions/GAME1/SEER/uid-wolf"), { target: "x", done: true, at: 1 }),
    );
  });

  it("denies writing someone else's action", async () => {
    const db = testEnv.authenticatedContext("uid-wolf").database();
    await assertFails(
      set(ref(db, "actions/GAME1/WOLVES/uid-seer"), { target: "uid-wolf", done: true, at: 1 }),
    );
  });

  it("allows a dead Hunter to write their revenge shot regardless of the current phase", async () => {
    const db = testEnv.authenticatedContext("uid-dead-hunter").database();
    await assertSucceeds(
      set(ref(db, "actions/GAME1/HUNTER_SHOT/uid-dead-hunter"), {
        target: "uid-seer",
        done: true,
        at: 1234,
      }),
    );
  });

  it("denies a still-alive player from writing a Hunter revenge shot", async () => {
    const db = testEnv.authenticatedContext("uid-wolf").database();
    await assertFails(
      set(ref(db, "actions/GAME1/HUNTER_SHOT/uid-wolf"), {
        target: "uid-seer",
        done: true,
        at: 1234,
      }),
    );
  });

  it("this is the whole point: a role-specific action is readable only by its own writer, never anyone else", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await set(ref(context.database(), "actions/GAME1/SEER/uid-seer"), {
        target: "uid-wolf",
        done: true,
        at: 1,
      });
    });

    const owner = testEnv.authenticatedContext("uid-seer").database();
    await assertSucceeds(get(ref(owner, "actions/GAME1/SEER/uid-seer")));

    // The mere existence of an entry at actions/GAME1/SEER/{uid} already
    // identifies {uid} as the Seer — this must be undiscoverable by anyone
    // else, including a direct fetch of a uid they already suspect.
    const someoneElse = testEnv.authenticatedContext("uid-wolf").database();
    await assertFails(get(ref(someoneElse, "actions/GAME1/SEER/uid-seer")));
  });

  it("VOTE is the one phase readable by everyone — voting is public information, not a role", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await set(ref(context.database(), "actions/GAME1/VOTE/uid-wolf"), {
        target: "uid-seer",
        done: true,
        at: 1,
      });
    });

    const db = testEnv.authenticatedContext("uid-seer").database();
    await assertSucceeds(get(ref(db, "actions/GAME1/VOTE/uid-wolf")));
  });
});

// Owning the leaf and being in the right phase is NOT enough to act. The
// advance route counts whatever it finds under actions/{gameId}/{phase}
// verbatim — tallyMajorityVote() sums every entry under WOLVES,
// Object.values(...)[0] takes the single actor for SEER/BODYGUARD/MUTER/
// WITCH_*/PAIR_LOVERS, resolveVote() sums every ballot, and
// applyPendingHunterShots() kills the target of every dead writer — none of
// them re-checks who wrote it, because Security Rules are the gate. So the
// rules have to be the ones that know a phase belongs to a role.
describe("actions/$gameId — only the phase's own role may act", () => {
  it("denies an alive player in the game acting in a phase that is not their role's", async () => {
    // The Seer is in the game, alive, and WOLVES is genuinely the live
    // phase — the only thing wrong is that she is not a wolf. Were this
    // allowed, it would be a free extra ballot in the pack's majority tally,
    // available to any player on any night.
    const db = testEnv.authenticatedContext("uid-seer").database();
    await assertFails(
      set(ref(db, "actions/GAME1/WOLVES/uid-seer"), { target: "uid-wolf", done: true, at: 1 }),
    );
  });

  it("denies someone who never joined the game from writing any action at all", async () => {
    const db = testEnv.authenticatedContext("uid-outsider").database();
    await assertFails(
      set(ref(db, "actions/GAME1/WOLVES/uid-outsider"), {
        target: "uid-seer",
        done: true,
        at: 1,
      }),
    );
    await setPhase("VOTE");
    await assertFails(
      set(ref(db, "actions/GAME1/VOTE/uid-outsider"), {
        target: "uid-seer",
        done: true,
        at: 1,
      }),
    );
  });

  it("denies a dead player from casting a ballot", async () => {
    await setPhase("VOTE");
    const dead = testEnv.authenticatedContext("uid-dead-villager").database();
    await assertFails(
      set(ref(dead, "actions/GAME1/VOTE/uid-dead-villager"), {
        target: "uid-seer",
        done: true,
        at: 1,
      }),
    );

    // ...while a live player in the same phase still votes normally, so the
    // rule above is denying the death and not the phase.
    const alive = testEnv.authenticatedContext("uid-seer").database();
    await assertSucceeds(
      set(ref(alive, "actions/GAME1/VOTE/uid-seer"), {
        target: "uid-wolf",
        done: true,
        at: 1,
      }),
    );
  });

  it("denies an alive Pacifist from casting a ballot, while another alive player votes normally", async () => {
    // Story 1.3: VOTE was the one action-phase rule with no role condition
    // at all — Pacifist is the first role that needs one. Both sides must
    // hold: the rule actually blocks the Pacifist (not just the UI), and it
    // must not accidentally block everyone else in the same phase.
    await setPhase("VOTE");
    const pacifist = testEnv.authenticatedContext("uid-pacifist").database();
    await assertFails(
      set(ref(pacifist, "actions/GAME1/VOTE/uid-pacifist"), {
        target: "uid-seer",
        done: true,
        at: 1,
      }),
    );

    const alive = testEnv.authenticatedContext("uid-seer").database();
    await assertSucceeds(
      set(ref(alive, "actions/GAME1/VOTE/uid-seer"), {
        target: "uid-wolf",
        done: true,
        at: 1,
      }),
    );
  });

  it("denies a dead player who is not the Hunter from firing a revenge shot", async () => {
    // HUNTER_SHOT is the one action deliberately not phase-gated (spec §4.4
    // step 8 — it fires reactively on death), so "dead" was the only thing
    // standing between any corpse and killing any living player on demand.
    const db = testEnv.authenticatedContext("uid-dead-villager").database();
    await assertFails(
      set(ref(db, "actions/GAME1/HUNTER_SHOT/uid-dead-villager"), {
        target: "uid-seer",
        done: true,
        at: 1,
      }),
    );
  });

  it("lets the Sorcerer act during SORCERER, and nobody else", async () => {
    await setPhase("SORCERER");
    await assertSucceeds(
      set(
        ref(
          testEnv.authenticatedContext("uid-sorcerer").database(),
          "actions/GAME1/SORCERER/uid-sorcerer",
        ),
        { target: "uid-seer", done: true, at: 1 },
      ),
    );
    await assertFails(
      set(
        ref(testEnv.authenticatedContext("uid-seer").database(), "actions/GAME1/SORCERER/uid-seer"),
        { target: "uid-wolf", done: true, at: 1 },
      ),
    );
  });

  it("lets the Seer and the Witch act in their own phases, and nobody else in them", async () => {
    await setPhase("SEER");
    await assertSucceeds(
      set(
        ref(testEnv.authenticatedContext("uid-seer").database(), "actions/GAME1/SEER/uid-seer"),
        { target: "uid-wolf", done: true, at: 1 },
      ),
    );

    // Both Witch phases resolve to the same role, so both are checked.
    for (const phaseKey of ["WITCH_SAVE", "WITCH_KILL"]) {
      await setPhase(phaseKey);
      await assertSucceeds(
        set(
          ref(
            testEnv.authenticatedContext("uid-witch").database(),
            `actions/GAME1/${phaseKey}/uid-witch`,
          ),
          { target: "uid-wolf", done: true, at: 1 },
        ),
      );
      await assertFails(
        set(
          ref(
            testEnv.authenticatedContext("uid-seer").database(),
            `actions/GAME1/${phaseKey}/uid-seer`,
          ),
          { target: "uid-wolf", done: true, at: 1 },
        ),
      );
    }
  });

  it("denies writing under a phase key that has no action, even while that phase is live", async () => {
    await setPhase("DISCUSSION");
    const db = testEnv.authenticatedContext("uid-wolf").database();
    await assertFails(
      set(ref(db, "actions/GAME1/DISCUSSION/uid-wolf"), { target: "uid-seer", done: true, at: 1 }),
    );
  });

  it("still lets every client subscribe to its own leaf for an actionless phase", async () => {
    // GameScreen calls useMyAction(db, gameId, game.phase.name, uid) on every
    // phase, not just the ones with an action UI — DAWN, DISCUSSION,
    // NIGHT_FALLS, CURSED, REVEAL_ROLE, VOTE_RESULT and ENDED all subscribe.
    // Locking those keys for writes must not lock them for that read, or
    // every client logs a permission error once per phase.
    await setPhase("DISCUSSION");
    const db = testEnv.authenticatedContext("uid-wolf").database();
    await assertSucceeds(get(ref(db, "actions/GAME1/DISCUSSION/uid-wolf")));
    await assertFails(get(ref(db, "actions/GAME1/DISCUSSION/uid-seer")));
  });
});

describe("private/$gameId/$uid", () => {
  it("denies read to anyone but the owning uid", async () => {
    const db = testEnv.authenticatedContext("uid-seer").database();
    await assertFails(get(ref(db, "private/GAME1/uid-wolf")));
  });

  it("allows the owning uid to read their own private state", async () => {
    const db = testEnv.authenticatedContext("uid-wolf").database();
    await assertSucceeds(get(ref(db, "private/GAME1/uid-wolf")));
  });

  it("denies any client write, even from the owning uid", async () => {
    const db = testEnv.authenticatedContext("uid-wolf").database();
    await assertFails(set(ref(db, "private/GAME1/uid-wolf/role"), "VILLAGER"));
  });
});

describe("chat/$gameId — Resilience Task 2", () => {
  it("village: allows a live player in the game to send, with their own uid", async () => {
    const db = testEnv.authenticatedContext("uid-wolf").database();
    await assertSucceeds(
      set(ref(db, "chat/GAME1/village/msg1"), { uid: "uid-wolf", text: "chào", at: 1 }),
    );
  });

  it("village: denies a dead player from sending", async () => {
    const db = testEnv.authenticatedContext("uid-dead-hunter").database();
    await assertFails(
      set(ref(db, "chat/GAME1/village/msg1"), { uid: "uid-dead-hunter", text: "chào", at: 1 }),
    );
  });

  it("village: denies spoofing another uid as the sender", async () => {
    const db = testEnv.authenticatedContext("uid-wolf").database();
    await assertFails(
      set(ref(db, "chat/GAME1/village/msg1"), { uid: "uid-seer", text: "chào", at: 1 }),
    );
  });

  it("village: denies someone not in this game", async () => {
    const db = testEnv.authenticatedContext("uid-outsider").database();
    await assertFails(
      set(ref(db, "chat/GAME1/village/msg1"), { uid: "uid-outsider", text: "chào", at: 1 }),
    );
  });

  it("village: denies an empty or oversized message", async () => {
    const db = testEnv.authenticatedContext("uid-wolf").database();
    await assertFails(set(ref(db, "chat/GAME1/village/msg1"), { uid: "uid-wolf", text: "", at: 1 }));
    await assertFails(
      set(ref(db, "chat/GAME1/village/msg1"), {
        uid: "uid-wolf",
        text: "x".repeat(501),
        at: 1,
      }),
    );
  });

  it("village: denies editing an existing message", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await set(ref(context.database(), "chat/GAME1/village/msg1"), {
        uid: "uid-wolf",
        text: "gốc",
        at: 1,
      });
    });
    const db = testEnv.authenticatedContext("uid-wolf").database();
    await assertFails(
      set(ref(db, "chat/GAME1/village/msg1"), { uid: "uid-wolf", text: "sửa", at: 2 }),
    );
  });

  it("village: readable by anyone in the game, including a dead player", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await set(ref(context.database(), "chat/GAME1/village/msg1"), {
        uid: "uid-wolf",
        text: "chào",
        at: 1,
      });
    });
    const db = testEnv.authenticatedContext("uid-dead-hunter").database();
    await assertSucceeds(get(ref(db, "chat/GAME1/village")));
  });

  it("village: denied to someone not in the game", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await set(ref(context.database(), "chat/GAME1/village/msg1"), {
        uid: "uid-wolf",
        text: "chào",
        at: 1,
      });
    });
    const db = testEnv.authenticatedContext("uid-outsider").database();
    await assertFails(get(ref(db, "chat/GAME1/village")));
  });

  it("wolves: allows a live wolf-faction uid to send", async () => {
    const db = testEnv.authenticatedContext("uid-wolf").database();
    await assertSucceeds(
      set(ref(db, "chat/GAME1/wolves/msg1"), { uid: "uid-wolf", text: "cắn ai", at: 1 }),
    );
  });

  it("wolves: allows a live Wolf Man uid to send, same as a Werewolf", async () => {
    const db = testEnv.authenticatedContext("uid-wolfman").database();
    await assertSucceeds(
      set(ref(db, "chat/GAME1/wolves/msg1"), { uid: "uid-wolfman", text: "cắn ai", at: 1 }),
    );
  });

  it("wolves: allows a live Wolf Cub uid to send, same as a Werewolf", async () => {
    const db = testEnv.authenticatedContext("uid-wolfcub").database();
    await assertSucceeds(
      set(ref(db, "chat/GAME1/wolves/msg1"), { uid: "uid-wolfcub", text: "cắn ai", at: 1 }),
    );
  });

  it("wolves: denies a non-wolf player in the same game, even the Seer", async () => {
    const db = testEnv.authenticatedContext("uid-seer").database();
    await assertFails(
      set(ref(db, "chat/GAME1/wolves/msg1"), { uid: "uid-seer", text: "soi thấy gì", at: 1 }),
    );
  });

  it("wolves: this is the whole point — a non-wolf can't even prove the room is non-empty", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await set(ref(context.database(), "chat/GAME1/wolves/msg1"), {
        uid: "uid-wolf",
        text: "cắn ai",
        at: 1,
      });
    });
    const db = testEnv.authenticatedContext("uid-seer").database();
    await assertFails(get(ref(db, "chat/GAME1/wolves")));
  });
});
