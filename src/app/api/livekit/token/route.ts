import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { requiredActorsForPhase } from "@/lib/game/requiredActors";
import type { Game, PrivatePlayerState, RoleKey } from "@/types/game";

/**
 * Spec §10: mints a LiveKit access token for the one call room the current
 * phase actually has (WOLVES for the pack, DISCUSSION for everyone alive —
 * every other phase is a solo action, no room to join at all). Room name
 * is `{gameId}-{phaseKey}`, matching spec exactly — LiveKit tears down an
 * empty room on its own, so there's no cleanup step needed when a phase
 * ends and its room stops being auto-joined.
 *
 * Unlike start/advance, this route DOES need to know who's calling — the
 * grant it mints (which room, canPublish or subscribe-only) depends on
 * this uid's own role, alive, and muted status. Spec §3 puts "chống gian lận"
 * (anti-cheat) out of scope for the game's OWN state — a compromised
 * client can already only hurt its own play experience there — but a
 * forged uid here wouldn't just cheat the forger, it would let them join
 * the wolves' private voice room and listen in on people who did nothing
 * wrong. That's the one place in this codebase a client-supplied uid
 * can't simply be trusted the way submitAction's is (Security Rules
 * already gate those by auth.uid) — this route verifies a real Firebase
 * ID token instead of trusting a body param.
 *
 * NOT LIVE-VERIFIED: needs LIVEKIT_API_KEY/LIVEKIT_API_SECRET (this
 * sandbox has neither, same credential-blocker shape as every other
 * Admin-SDK-backed route) to actually connect to a room, and
 * FIREBASE_SERVICE_ACCOUNT_KEY to verify the ID token. The grant-shape
 * logic below (who gets a token, with which permissions, for which room)
 * is unit-tested independent of any of that — see
 * src/lib/game/livekitGrant.test.ts, which signs and decodes real JWTs
 * with a throwaway key/secret pair entirely offline.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization");
  const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
  if (!idToken) {
    return NextResponse.json({ error: "Thiếu token đăng nhập" }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Token đăng nhập không hợp lệ" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { gameId?: string } | null;
  const gameId = body?.gameId;
  if (!gameId) {
    return NextResponse.json({ error: "Thiếu gameId" }, { status: 400 });
  }

  const db = adminDb();
  const gameSnap = await db.ref(`games/${gameId}`).get();
  if (!gameSnap.exists()) {
    return NextResponse.json({ error: "Không tìm thấy ván đấu" }, { status: 404 });
  }
  const game = gameSnap.val() as Game;

  const roomSnap = await db.ref(`rooms/${game.roomCode}/settings/remoteMode`).get();
  if (roomSnap.val() !== true) {
    return NextResponse.json({ error: "Phòng chưa bật Chơi xa" }, { status: 403 });
  }

  const player = game.players[uid];
  if (!player) {
    return NextResponse.json({ error: "Bạn không ở trong ván đấu này" }, { status: 403 });
  }

  const grant = await resolveCallRoomGrant(db, gameId, game, uid);
  if (!grant) {
    return NextResponse.json({ error: "Phase hiện tại không có phòng gọi" }, { status: 404 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  if (!apiKey || !apiSecret || !url) {
    return NextResponse.json({ error: "Chưa cấu hình LiveKit" }, { status: 500 });
  }

  const at = new AccessToken(apiKey, apiSecret, { identity: uid, name: player.name });
  // canPublish alone (no canPublishSources restriction) covers both camera
  // and microphone — spec §10 wants both, not audio-only.
  at.addGrant({
    room: grant.roomName,
    roomJoin: true,
    canPublish: grant.canPublish,
    canSubscribe: true,
  });

  const token = await at.toJwt();
  return NextResponse.json({ token, url, room: grant.roomName, canPublish: grant.canPublish });
}

export interface CallRoomGrant {
  roomName: string;
  canPublish: boolean;
}

/**
 * Spec §10's exact room list: WOLVES (the pack only — same set
 * requiredActorsForPhase already computes for who must act, deliberately
 * reused rather than re-deriving "is this uid a live Werewolf" a second,
 * possibly inconsistent way) and DISCUSSION (everyone alive can publish;
 * everyone including the dead can subscribe — "vẫn xem được hình để theo
 * dõi ván"). Every other phase has no call room at all. Exported and
 * separated from the route itself so it's the thing under test in
 * livekitGrant.test.ts, without needing a mock NextRequest for the parts
 * that are pure decision logic.
 *
 * Spec §4.7: a muted (but alive) player's DISCUSSION token also doesn't
 * get publish permission — "token LiveKit của họ không được cấp quyền
 * publish trong phase Thảo Luận, nên micro thật sự không phát được." The
 * Muter's whole point is worthless in a "Chơi xa" room without this;
 * ChatPanel's text lock already covers the chat half of the same rule.
 */
export async function resolveCallRoomGrant(
  db: ReturnType<typeof adminDb>,
  gameId: string,
  game: Game,
  uid: string,
): Promise<CallRoomGrant | null> {
  const player = game.players[uid];
  if (!player) return null;

  if (game.phase.name === "WOLVES") {
    const privateSnap = await db.ref(`private/${gameId}`).get();
    const privateState = (privateSnap.val() ?? {}) as Record<string, PrivatePlayerState>;
    const aliveRolesByUid: Record<string, RoleKey> = {};
    for (const [playerUid, p] of Object.entries(game.players)) {
      if (p.alive) aliveRolesByUid[playerUid] = privateState[playerUid]?.role;
    }
    const pack = requiredActorsForPhase("WOLVES", aliveRolesByUid);
    if (!pack.includes(uid)) return null;
    return { roomName: `${gameId}-WOLVES`, canPublish: true };
  }

  if (game.phase.name === "DISCUSSION") {
    return { roomName: `${gameId}-DISCUSSION`, canPublish: player.alive && !player.muted };
  }

  return null;
}
