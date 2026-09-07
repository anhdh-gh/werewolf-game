"use client";

import { useState } from "react";
import { type Database } from "firebase/database";
import { Send } from "lucide-react";
import type { ChatScope, Game } from "@/types/game";
import { useChatMessages, sendChatMessage } from "@/lib/game/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Spec §0/§4.7: only rendered by the caller when room.settings.remoteMode
 * is on — this component itself has no opinion on that. `locked` is spec
 * §4.7's mute-lockout ("ô chat của người đó bị khoá") for a remote room;
 * the always-on MutedBanner (GameScreen) already covers the in-person
 * baseline notification. */
export function ChatPanel({
  db,
  gameId,
  scope,
  uid,
  players,
  title,
  lockedReason,
}: {
  db: Database;
  gameId: string;
  scope: ChatScope;
  uid: string;
  players: Game["players"];
  title: string;
  /** When set, the input is replaced by this message instead — e.g. muted
   * for the day, or already dead (spec §4.7/§10: a dead player still
   * watches/reads, but never speaks again). Read access always stays on
   * regardless of this prop; Security Rules are the read gate, not this. */
  lockedReason?: string;
}) {
  const messages = useChatMessages(db, gameId, scope);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft("");
    try {
      await sendChatMessage(db, gameId, scope, uid, text);
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ul className="flex max-h-48 flex-col gap-1.5 overflow-y-auto">
          {messages.length === 0 && (
            <li className="py-2 text-center text-xs text-muted-foreground">Chưa có tin nhắn</li>
          )}
          {messages.map((msg) => (
            <li key={msg.id} className={cn("flex flex-col text-sm", msg.uid === uid && "items-end")}>
              <span className="text-xs text-muted-foreground">
                {msg.uid === uid ? "Bạn" : (players[msg.uid]?.name ?? "?")}
              </span>
              <span
                className={cn(
                  "max-w-[85%] rounded-lg px-2.5 py-1.5",
                  msg.uid === uid ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                {msg.text}
              </span>
            </li>
          ))}
        </ul>

        {lockedReason ? (
          <p className="rounded-md bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
            {lockedReason}
          </p>
        ) : (
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder="Nhắn gì đó…"
              maxLength={500}
              className="h-9"
            />
            <Button
              size="icon"
              className="size-9 shrink-0"
              onClick={send}
              disabled={sending || draft.trim().length === 0}
              aria-label="Gửi"
            >
              <Send className="size-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
