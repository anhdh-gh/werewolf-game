"use client";

import { useEffect, useState } from "react";
import { type Database, ref, push, query, limitToLast, onValue } from "firebase/database";
import type { ChatMessage, ChatScope } from "@/types/game";
import { gameChatPath } from "./paths";

const MAX_MESSAGES = 200;
const MAX_TEXT_LENGTH = 500;

export interface ChatMessageWithId extends ChatMessage {
  id: string;
}

/** Live-subscribes to a chat scope's most recent messages, oldest first.
 * Security Rules already restrict which scope a given uid can even read
 * (see database.rules.json) — this hook has no opinion on that, it just
 * subscribes to whatever gameChatPath resolves to and lets a denied read
 * come back empty rather than throwing. */
export function useChatMessages(
  db: Database,
  gameId: string,
  scope: ChatScope,
): ChatMessageWithId[] {
  const [messages, setMessages] = useState<ChatMessageWithId[]>([]);

  useEffect(() => {
    const messagesQuery = query(ref(db, gameChatPath(gameId, scope)), limitToLast(MAX_MESSAGES));
    const unsubscribe = onValue(
      messagesQuery,
      (snapshot) => {
        const val = (snapshot.val() ?? {}) as Record<string, ChatMessage>;
        const list = Object.entries(val)
          .map(([id, msg]) => ({ ...msg, id }))
          .sort((a, b) => a.at - b.at);
        setMessages(list);
      },
      () => setMessages([]),
    );
    return unsubscribe;
  }, [db, gameId, scope]);

  return messages;
}

/** Spec §4.7/§10: only an alive player may write (enforced again, harder,
 * by Security Rules — this trim/length guard is just to fail fast in the
 * UI rather than round-trip a doomed write). */
export async function sendChatMessage(
  db: Database,
  gameId: string,
  scope: ChatScope,
  uid: string,
  text: string,
): Promise<void> {
  const trimmed = text.trim().slice(0, MAX_TEXT_LENGTH);
  if (!trimmed) return;
  await push(ref(db, gameChatPath(gameId, scope)), { uid, text: trimmed, at: Date.now() });
}
