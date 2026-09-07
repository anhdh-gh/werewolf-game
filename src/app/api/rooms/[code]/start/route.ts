import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { assignRoles } from "@/lib/game/roles";
import { PHASE_DURATIONS_MS } from "@/lib/game/phases";
import type { Room } from "@/types/room";
import { FACTION_BY_ROLE, type PrivatePlayerState } from "@/types/game";

/**
 * Deals roles and creates the game (spec §3: anyone in the room can start it
 * once there are enough players — no host). Sets rooms/{code}.currentGameId
 * and flips status to PLAYING via the Admin SDK, which is the only writer
 * Security Rules ever allow for either field.
 *
 * NOT LIVE-VERIFIED — see the same credential-blocker note on the advance
 * route (src/app/api/games/[gameId]/advance/route.ts).
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
): Promise<NextResponse> {
  const { code } = await params;
  const db = adminDb();

  const roomSnap = await db.ref(`rooms/${code}`).get();
  if (!roomSnap.exists()) {
    return NextResponse.json({ error: `Phòng ${code} không tồn tại` }, { status: 404 });
  }
  const room = roomSnap.val() as Room;

  if (room.status !== "LOBBY") {
    return NextResponse.json({ error: "Phòng đã bắt đầu chơi hoặc đã kết thúc" }, { status: 409 });
  }

  const uids = Object.keys(room.members ?? {});
  if (uids.length < 4) {
    return NextResponse.json({ error: "Cần ít nhất 4 người chơi" }, { status: 400 });
  }

  const assignment = assignRoles(uids, room.settings.rolesEnabled);

  const gameId = db.ref("games").push().key;
  if (!gameId) throw new Error("Không tạo được mã ván đấu");

  const now = Date.now();
  // Spec §7: "danh sách đồng bọn cho Sói" — every wolf-faction uid (WEREWOLF
  // and TRAITOR both) needs to know the rest of the pack.
  const wolfFactionUids = uids.filter((uid) => FACTION_BY_ROLE[assignment[uid]] === "WOLF");

  const privateWrites: Record<string, PrivatePlayerState> = {};
  const players: Record<string, { name: string; alive: boolean; muted: boolean }> = {};
  for (const uid of uids) {
    const role = assignment[uid];
    privateWrites[uid] = {
      role,
      initialRole: role,
      potions: { heal: true, poison: true },
      ...(FACTION_BY_ROLE[role] === "WOLF"
        ? { packUids: wolfFactionUids.filter((packUid) => packUid !== uid) }
        : {}),
    };
    players[uid] = { name: room.members[uid].name, alive: true, muted: false };
  }

  const updates: Record<string, unknown> = {
    [`games/${gameId}`]: {
      roomCode: code,
      startedAt: now,
      dayNumber: 1,
      phase: {
        name: "REVEAL_ROLE",
        endsAt: now + PHASE_DURATIONS_MS.REVEAL_ROLE,
        version: 0,
      },
      players,
    },
    [`private/${gameId}`]: privateWrites,
    [`rooms/${code}/currentGameId`]: gameId,
    [`rooms/${code}/status`]: "PLAYING",
  };

  await db.ref().update(updates);

  return NextResponse.json({ gameId });
}
