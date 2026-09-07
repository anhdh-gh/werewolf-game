"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { db } from "@/lib/firebase/client";
import { requestPushPermission } from "@/lib/notifications/push";
import { Button } from "@/components/ui/button";

/** Spec §8.2's safety net — offered, never forced: only shown while
 * Notification permission is still "default" (never asked, and not
 * denied), and disappears the moment it's granted or the user declines.
 * A denied permission stays denied until the user changes it themselves
 * in browser settings — this never re-prompts. */
export function EnableNotificationsButton({ uid }: { uid: string }) {
  const [visible, setVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setVisible(Notification.permission === "default");
  }, []);

  if (!visible) return null;

  const enable = async () => {
    setRequesting(true);
    const granted = await requestPushPermission(db, uid);
    setRequesting(false);
    setVisible(!granted && Notification.permission === "default");
  };

  return (
    <Button
      variant="outline"
      onClick={enable}
      disabled={requesting}
      className="h-9 w-full gap-1.5 text-sm"
    >
      <Bell className="size-4" />
      Bật thông báo khi đến lượt bạn
    </Button>
  );
}
