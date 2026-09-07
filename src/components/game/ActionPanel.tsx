"use client";

import { useState } from "react";
import { type Database, ref, set } from "firebase/database";
import type { Game, PrivatePlayerState } from "@/types/game";
import { submitAction, nudgeAdvance } from "@/lib/game/actions";
import { gameActionPath } from "@/lib/game/paths";
import { useWolfTarget } from "@/lib/game/usePhaseActions";
import { TargetPicker, type PickableTarget } from "./TargetPicker";
import { Loader2 } from "lucide-react";

function alivePlayersExcept(game: Game, excludeUids: string[]): PickableTarget[] {
  return Object.entries(game.players)
    .filter(([uid, p]) => p.alive && !excludeUids.includes(uid))
    .map(([uid, p]) => ({ uid, name: p.name }));
}

/** Renders whichever action UI the current phase + role calls for. Only
 * rendered when the caller has already confirmed this uid is in
 * phase.requiredActors and hasn't submitted yet (see GameScreen). */
export function ActionPanel({
  db,
  gameId,
  uid,
  game,
  privateState,
}: {
  db: Database;
  gameId: string;
  uid: string;
  game: Game;
  privateState: PrivatePlayerState | null;
}) {
  const [selected, setSelected] = useState<string | null | undefined>(undefined);
  const [selectedB, setSelectedB] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const wolfTarget = useWolfTarget(db, gameId);

  const phase = game.phase.name;

  const submit = async (phaseKey: string, target: string | null) => {
    setSubmitting(true);
    try {
      await submitAction(db, gameId, phaseKey, uid, target);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitting) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (phase === "PAIR_LOVERS") {
    const submitPair = async () => {
      if (!selected || !selectedB) return;
      setSubmitting(true);
      try {
        await set(ref(db, gameActionPath(gameId, "PAIR_LOVERS", uid)), {
          targetA: selected,
          targetB: selectedB,
          done: true,
          at: Date.now(),
        });
        nudgeAdvance(gameId);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">Chọn người thứ nhất trong cặp đôi</p>
        <TargetPicker
          targets={alivePlayersExcept(game, [])}
          selected={selected}
          onSelect={setSelected}
          onSubmit={() => {}}
          submitLabel=""
          hideSubmit
        />
        {selected && (
          <>
            <p className="text-sm text-muted-foreground">Chọn người thứ hai</p>
            <TargetPicker
              targets={alivePlayersExcept(game, [selected])}
              selected={selectedB ?? undefined}
              onSelect={(v) => setSelectedB(v ?? undefined)}
              onSubmit={submitPair}
              submitLabel="Ghép đôi"
            />
          </>
        )}
      </div>
    );
  }

  if (phase === "SEER") {
    return (
      <TargetPicker
        targets={alivePlayersExcept(game, [uid])}
        selected={selected}
        onSelect={setSelected}
        onSubmit={() => selected && submit("SEER", selected)}
        submitLabel="Soi"
      />
    );
  }

  if (phase === "BODYGUARD") {
    return (
      <TargetPicker
        targets={alivePlayersExcept(game, [])}
        selected={selected}
        onSelect={setSelected}
        onSubmit={() => selected && submit("BODYGUARD", selected)}
        submitLabel="Bảo vệ"
      />
    );
  }

  if (phase === "MUTER") {
    return (
      <TargetPicker
        targets={alivePlayersExcept(game, [uid])}
        selected={selected}
        onSelect={setSelected}
        onSubmit={() => selected && submit("MUTER", selected)}
        submitLabel="Bịt miệng"
      />
    );
  }

  if (phase === "WOLVES") {
    return (
      <TargetPicker
        targets={alivePlayersExcept(game, [uid])}
        selected={selected}
        onSelect={setSelected}
        onSubmit={() => selected && submit("WOLVES", selected)}
        submitLabel="Cắn"
      />
    );
  }

  if (phase === "WITCH_SAVE") {
    const canSave = privateState?.potions.heal && wolfTarget;
    if (!canSave) {
      return (
        <p className="rounded-md bg-muted px-3 py-4 text-center text-sm text-muted-foreground">
          {wolfTarget ? "Bạn đã dùng hết bình cứu" : "Đêm nay sói không cắn ai"}
        </p>
      );
    }
    const victimName = game.players[wolfTarget]?.name ?? "?";
    return (
      <div className="flex flex-col gap-3">
        <p className="text-center text-sm text-muted-foreground">
          Sói đang cắn <span className="text-foreground">{victimName}</span>. Cứu không?
        </p>
        <TargetPicker
          targets={[{ uid: wolfTarget, name: `Cứu ${victimName}` }]}
          selected={selected}
          onSelect={setSelected}
          onSubmit={() => submit("WITCH_SAVE", selected ?? null)}
          submitLabel="Xác nhận"
          abstainLabel="Không cứu"
        />
      </div>
    );
  }

  if (phase === "WITCH_KILL") {
    if (!privateState?.potions.poison) {
      return (
        <p className="rounded-md bg-muted px-3 py-4 text-center text-sm text-muted-foreground">
          Bạn đã dùng hết bình độc
        </p>
      );
    }
    return (
      <TargetPicker
        targets={alivePlayersExcept(game, [uid])}
        selected={selected}
        onSelect={setSelected}
        onSubmit={() => submit("WITCH_KILL", selected ?? null)}
        submitLabel="Đầu độc"
        abstainLabel="Không dùng thuốc độc"
      />
    );
  }

  if (phase === "VOTE") {
    return (
      <TargetPicker
        targets={alivePlayersExcept(game, [uid])}
        selected={selected}
        onSelect={setSelected}
        onSubmit={() => submit("VOTE", selected ?? null)}
        submitLabel="Treo cổ"
        abstainLabel="Bỏ phiếu trắng"
      />
    );
  }

  return null;
}
