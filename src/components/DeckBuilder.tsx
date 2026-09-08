"use client";

import { Minus, Plus, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ALL_ROLE_KEYS, FACTION_BY_ROLE, type Faction, type RoleKey } from "@/types/game";
import { deckSize } from "@/types/room";
import { deckIssue } from "@/lib/game/roles";
import { ROLE_LABELS, FACTION_LABELS } from "@/lib/game/labels";
import { cn } from "@/lib/utils";

const FACTION_ORDER: Faction[] = ["WOLF", "VILLAGE", "TANNER"];

/** Shared by room creation and the in-lobby "Cài đặt vai" panel — one deck
 * concept, one component (design doc 2026-09-08-deck-builder.md §5). The
 * room creator sets an exact count per role; who ends up with which role
 * among the joined players stays random and hidden, unaffected by this UI. */
export function DeckBuilder({
  roleCounts,
  onChange,
}: {
  roleCounts: Record<RoleKey, number>;
  onChange: (role: RoleKey, count: number) => void;
}) {
  const total = deckSize(roleCounts);
  const issue = deckIssue(roleCounts);

  return (
    <div className="flex flex-col gap-4">
      {FACTION_ORDER.map((faction) => (
        <div key={faction} className="flex flex-col gap-1">
          <p className="px-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {FACTION_LABELS[faction]}
          </p>
          {ALL_ROLE_KEYS.filter((role) => FACTION_BY_ROLE[role] === faction).map((role) => {
            const count = roleCounts[role] ?? 0;
            return (
              <div
                key={role}
                className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 hover:bg-muted"
              >
                <span className="text-sm">{ROLE_LABELS[role]}</span>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-9"
                    onClick={() => onChange(role, Math.max(0, count - 1))}
                    disabled={count <= 0}
                    aria-label={`Giảm ${ROLE_LABELS[role]}`}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <span className="w-5 text-center text-base tabular-nums">{count}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-9"
                    onClick={() => onChange(role, count + 1)}
                    aria-label={`Tăng ${ROLE_LABELS[role]}`}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      <div
        className={cn(
          "flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium",
          issue ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
        )}
      >
        <span className="font-heading text-lg tabular-nums">{total} người chơi</span>
        {issue && (
          <span className="flex items-center gap-1.5 text-xs">
            <ShieldAlert className="size-3.5 shrink-0" />
            {issue}
          </span>
        )}
      </div>
    </div>
  );
}
