"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { FACTION_BY_ROLE, type PrivatePlayerState } from "@/types/game";
import { ROLE_LABELS, FACTION_LABELS } from "@/lib/game/labels";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/** Spec §4.3: role is only shown at REVEAL_ROLE by default afterward — a
 * hold-to-peek button, not something permanently on screen, so a glance at
 * someone else's phone doesn't give it away. */
export function RoleCard({
  privateState,
  alwaysVisible,
}: {
  privateState: PrivatePlayerState | null;
  alwaysVisible?: boolean;
}) {
  const [peeking, setPeeking] = useState(false);

  if (!privateState) return null;

  const visible = alwaysVisible || peeking;
  const roleLabel = ROLE_LABELS[privateState.role];
  const factionLabel = FACTION_LABELS[FACTION_BY_ROLE[privateState.role]];

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 pt-4">
        {visible ? (
          <>
            <span className="font-heading text-2xl tracking-wide">{roleLabel}</span>
            <span className="text-sm text-muted-foreground">{factionLabel}</span>
          </>
        ) : (
          <Button
            variant="outline"
            className="h-11 gap-2"
            onMouseDown={() => setPeeking(true)}
            onMouseUp={() => setPeeking(false)}
            onMouseLeave={() => setPeeking(false)}
            onTouchStart={() => setPeeking(true)}
            onTouchEnd={() => setPeeking(false)}
          >
            <Eye className="size-4" />
            Giữ để xem vai
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
