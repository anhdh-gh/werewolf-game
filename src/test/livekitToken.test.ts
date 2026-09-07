// @vitest-environment node
//
// jose (which livekit-server-sdk signs JWTs with) needs Node's native
// WebCrypto/TextEncoder; jsdom (this project's default test environment,
// needed elsewhere for browser-API-dependent component tests) overrides
// enough of that to break signing ("payload must be an instance of
// Uint8Array"). This route is server-only code anyway — node is the
// correct environment for it, not a workaround.
//
// Unlike most of this codebase's "not live-verified" Admin-SDK routes,
// LiveKit access tokens are self-contained, offline-verifiable JWTs: minting
// and decoding one only needs a matching key/secret pair, never a real
// LiveKit server. So this file is genuine, real verification of the
// route's actual output — not a mock of what LiveKit would do, a real
// TokenVerifier decoding a real signed token produced by the real route
// handler, with a throwaway key/secret pair that only ever exists in this
// test process. It does NOT verify Firebase ID token checking itself
// (that's Firebase's own tested code) — verifyIdToken is mocked to trust
// whatever string this test sends as the bearer token, so the test
// controls exactly which uid is "authenticated" for each case.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { TokenVerifier } from "livekit-server-sdk";
import { FakeAdminDatabase } from "./helpers/fakeAdminDb";
import type { Game, PrivatePlayerState } from "@/types/game";

const fakeDb = new FakeAdminDatabase();

vi.mock("@/lib/firebase/admin", () => ({
  adminDb: () => fakeDb,
  adminAuth: () => ({
    verifyIdToken: async (token: string) => {
      if (!token) throw new Error("empty token");
      return { uid: token };
    },
  }),
}));

process.env.LIVEKIT_API_KEY = "test-key";
process.env.LIVEKIT_API_SECRET = "test-secret-at-least-32-chars-long";
process.env.NEXT_PUBLIC_LIVEKIT_URL = "wss://example.livekit.cloud";

const { POST: getToken } = await import("@/app/api/livekit/token/route");

async function callToken(uid: string | null, gameId: string) {
  const headers = new Headers();
  if (uid) headers.set("authorization", `Bearer ${uid}`);
  const res = await getToken(
    new Request("http://x", { method: "POST", headers, body: JSON.stringify({ gameId }) }),
  );
  const body = (await res.json()) as {
    token?: string;
    url?: string;
    room?: string;
    canPublish?: boolean;
    error?: string;
  };
  return { status: res.status, body };
}

const verifier = new TokenVerifier(
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!,
);

beforeEach(() => {
  fakeDb.root = {};
  fakeDb.counter = 0;
});

const wolfA = "wolfA";
const traitor = "traitor";
const seer = "seer";
const deadVillager = "deadVillager";
const gameId = "GAME-LK";
const roomCode = "LKROOM";

async function seedGame(phaseName: Game["phase"]["name"], remoteMode: boolean) {
  const players: Game["players"] = {
    [wolfA]: { name: "Wolf A", alive: true, muted: false },
    [traitor]: { name: "Traitor", alive: true, muted: false },
    [seer]: { name: "Seer", alive: true, muted: false },
    [deadVillager]: { name: "Dead Villager", alive: false, muted: false },
  };
  const game: Game = {
    roomCode,
    startedAt: 1,
    dayNumber: 1,
    phase: { name: phaseName, endsAt: Date.now() + 60_000, version: 1 },
    players,
  };
  await fakeDb.ref(`games/${gameId}`).set(game);
  await fakeDb.ref(`private/${gameId}`).set({
    [wolfA]: { role: "WEREWOLF", initialRole: "WEREWOLF", potions: { heal: true, poison: true } },
    [traitor]: { role: "TRAITOR", initialRole: "TRAITOR", potions: { heal: true, poison: true } },
    [seer]: { role: "SEER", initialRole: "SEER", potions: { heal: true, poison: true } },
    [deadVillager]: {
      role: "VILLAGER",
      initialRole: "VILLAGER",
      potions: { heal: true, poison: true },
    },
  } satisfies Record<string, PrivatePlayerState>);
  await fakeDb.ref(`rooms/${roomCode}/settings`).set({
    maxPlayers: 8,
    rolesEnabled: {},
    remoteMode,
  });
}

describe("POST /api/livekit/token", () => {
  it("denies a request with no Authorization header", async () => {
    await seedGame("WOLVES", true);
    const { status, body } = await callToken(null, gameId);
    expect(status).toBe(401);
    expect(body.error).toBeTruthy();
  });

  it("denies a room that hasn't turned on Chơi xa", async () => {
    await seedGame("WOLVES", false);
    const { status } = await callToken(wolfA, gameId);
    expect(status).toBe(403);
  });

  it("mints a canPublish WOLVES token for an alive Werewolf, and only for them", async () => {
    await seedGame("WOLVES", true);
    const { status, body } = await callToken(wolfA, gameId);
    expect(status).toBe(200);
    expect(body.room).toBe(`${gameId}-WOLVES`);
    expect(body.canPublish).toBe(true);
    expect(body.url).toBe("wss://example.livekit.cloud");

    const grants = await verifier.verify(body.token!);
    expect(grants.video?.room).toBe(`${gameId}-WOLVES`);
    expect(grants.video?.roomJoin).toBe(true);
    expect(grants.video?.canPublish).toBe(true);
    expect(grants.video?.canSubscribe).toBe(true);
  });

  it("denies the Traitor a WOLVES room token — they never wake with the pack (spec §4.1)", async () => {
    await seedGame("WOLVES", true);
    const { status } = await callToken(traitor, gameId);
    expect(status).toBe(404);
  });

  it("denies a non-wolf, non-traitor player (the Seer) a WOLVES token", async () => {
    await seedGame("WOLVES", true);
    const { status } = await callToken(seer, gameId);
    expect(status).toBe(404);
  });

  it("mints a canPublish DISCUSSION token for an alive player", async () => {
    await seedGame("DISCUSSION", true);
    const { status, body } = await callToken(seer, gameId);
    expect(status).toBe(200);
    expect(body.room).toBe(`${gameId}-DISCUSSION`);
    expect(body.canPublish).toBe(true);

    const grants = await verifier.verify(body.token!);
    expect(grants.video?.canPublish).toBe(true);
  });

  it("mints a subscribe-only DISCUSSION token for a dead player — they still watch, never speak", async () => {
    await seedGame("DISCUSSION", true);
    const { status, body } = await callToken(deadVillager, gameId);
    expect(status).toBe(200);
    expect(body.room).toBe(`${gameId}-DISCUSSION`);
    expect(body.canPublish).toBe(false);

    const grants = await verifier.verify(body.token!);
    expect(grants.video?.canPublish).toBeFalsy();
    expect(grants.video?.canSubscribe).toBe(true);
  });

  it("has no call room at all for a solo-action phase like SEER", async () => {
    await seedGame("SEER", true);
    const { status } = await callToken(seer, gameId);
    expect(status).toBe(404);
  });

  it("denies a uid that isn't a player in this game", async () => {
    await seedGame("DISCUSSION", true);
    const { status } = await callToken("some-stranger", gameId);
    expect(status).toBe(403);
  });

  it("the identity embedded in the token is the verified uid, not anything the caller could forge in the body", async () => {
    await seedGame("DISCUSSION", true);
    const { body } = await callToken(wolfA, gameId);
    const grants = await verifier.verify(body.token!);
    expect(grants.sub).toBe(wolfA);
  });
});
