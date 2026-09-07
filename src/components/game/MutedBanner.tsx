"use client";

import { MicOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/** Spec §4.7: "người bị câm nhận thông báo rõ ràng trên máy mình" — a clear
 * notification on the muted player's own device is required and sufficient
 * on its own (chat/mic lockout only layers on top of this in "Chơi xa" mode,
 * which is out of this Game Engine's scope). The table-wide "câm" badge next
 * to their name in PlayerList satisfies the "cả bàn thấy" half; this covers
 * the other half. */
export function MutedBanner({ muted }: { muted: boolean }) {
  if (!muted) return null;

  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <CardContent className="flex items-center gap-2 py-3 text-sm text-destructive">
        <MicOff className="size-4 shrink-0" />
        Hôm nay bạn không được nói.
      </CardContent>
    </Card>
  );
}
