"use client";

import "@livekit/components-styles";
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from "@livekit/components-react";
import type { User } from "firebase/auth";
import { useCallToken } from "@/lib/livekit/useCallToken";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Spec §10: auto-joined per-phase call room, video and audio both.
 * `title` is just the section label the caller wants shown above it
 * (matching PackInfo/ChatPanel's own convention) — WOLVES vs. DISCUSSION
 * wording is the caller's job, this component only knows "here's a token,
 * join and render it."
 *
 * NOT LIVE-VERIFIED: needs a real LiveKit Cloud project this sandbox
 * doesn't have. `useCallToken`'s HTTP round-trip and the token route
 * itself are covered separately (livekitToken.test.ts, offline JWT
 * verification) — this component is the one piece of Resilience that
 * genuinely cannot be exercised at all here, not even partially, since it
 * needs a live WebRTC connection.
 */
export function CallRoom({
  user,
  gameId,
  enabled,
  title,
}: {
  user: User | null;
  gameId: string;
  enabled: boolean;
  title: string;
}) {
  const { callToken, error } = useCallToken(user, gameId, enabled);

  if (!enabled) return null;

  if (error) {
    return (
      <Card>
        <CardContent className="py-4 text-center text-sm text-muted-foreground">
          {error}
        </CardContent>
      </Card>
    );
  }

  if (!callToken) {
    return (
      <Card>
        <CardContent className="py-4 text-center text-sm text-muted-foreground">
          Đang kết nối phòng gọi…
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <p className="bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">{title}</p>
      <LiveKitRoom
        serverUrl={callToken.url}
        token={callToken.token}
        // Only ever request camera/mic from the browser when the server
        // actually granted publish — a dead player or a non-wolf during
        // WOLVES gets a subscribe-only (or no) token, and there's no
        // reason to prompt them for permissions they can't use anyway.
        audio={callToken.canPublish}
        video={callToken.canPublish}
        connect
        style={{ height: 320 }}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
