"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/useAuth";
import { useRoom } from "@/lib/rooms/useRoom";
import { attachPresence, detachPresence } from "@/lib/presence/presence";
import { ref, update } from "firebase/database";
import { roomMemberPath } from "@/lib/rooms/paths";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, Circle, Copy, DoorOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

const AVATAR_TINTS = [
  "bg-red-500/20 text-red-300",
  "bg-amber-500/20 text-amber-300",
  "bg-emerald-500/20 text-emerald-300",
  "bg-sky-500/20 text-sky-300",
  "bg-violet-500/20 text-violet-300",
  "bg-pink-500/20 text-pink-300",
];

function tintFor(uid: string): string {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) hash = (hash * 31 + uid.charCodeAt(i)) >>> 0;
  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
}

function MemberAvatar({
  name,
  photoURL,
  uid,
}: {
  name: string;
  photoURL: string | null;
  uid: string;
}) {
  if (photoURL) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoURL}
        alt={name}
        className="size-9 shrink-0 rounded-full ring-1 ring-border"
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-medium",
        tintFor(uid),
      )}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function CenteredState({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 animate-in fade-in-0 duration-300">
      {children}
    </main>
  );
}

export function RoomLobby({ code }: { code: string }) {
  const { user } = useAuth();
  const { room, loading } = useRoom(db, code);
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    const detach = attachPresence(db, user.uid, code);
    return () => detach();
  }, [user, code]);

  if (loading) {
    return (
      <CenteredState>
        <Logo size={44} className="opacity-80" />
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </CenteredState>
    );
  }

  if (!room) {
    return (
      <CenteredState>
        <Logo size={44} className="opacity-60" />
        <p className="text-muted-foreground">Không tìm thấy phòng {code}</p>
        <Button variant="secondary" onClick={() => router.push("/")}>
          Về trang chủ
        </Button>
      </CenteredState>
    );
  }

  if (!user) return null;

  const toggleReady = () => {
    const currentlyReady = room.members[user.uid]?.ready ?? false;
    update(ref(db, roomMemberPath(code, user.uid)), { ready: !currentlyReady });
  };

  const leave = async () => {
    setLeaving(true);
    await detachPresence(db, user.uid, code);
    router.push("/");
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — the code is already on screen, nothing more to do
    }
  };

  const members = Object.entries(room.members).sort(([, a], [, b]) => a.joinedAt - b.joinedAt);
  const isReady = room.members[user.uid]?.ready ?? false;
  const fillRatio = Math.min(1, members.length / room.settings.maxPlayers);

  return (
    <main className="flex min-h-dvh flex-col items-center gap-6 p-6">
      <div className="w-full max-w-sm animate-in fade-in-0 slide-in-from-bottom-3 duration-500">
        <Card>
          <CardHeader className="items-center gap-3 pb-2">
            <button
              onClick={copyCode}
              className="group flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors hover:bg-muted"
              aria-label="Sao chép mã phòng"
            >
              <span className="font-heading text-3xl tracking-[0.35em]">{code}</span>
              {copied ? (
                <Check className="size-4 text-emerald-400" />
              ) : (
                <Copy className="size-4 text-muted-foreground group-hover:text-foreground" />
              )}
            </button>

            <div className="flex w-full flex-col gap-1.5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${fillRatio * 100}%` }}
                />
              </div>
              <p className="text-center text-xs text-muted-foreground">
                {members.length} / {room.settings.maxPlayers} người chơi
              </p>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <ul className="flex flex-col gap-1.5">
              {members.map(([uid, member]) => (
                <li
                  key={uid}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-2.5 py-2 transition-opacity duration-300",
                    !member.online && "opacity-50",
                  )}
                >
                  <MemberAvatar name={member.name} photoURL={member.photoURL} uid={uid} />
                  <span className="flex-1 truncate text-sm">
                    {member.name}
                    {uid === user.uid && (
                      <span className="ml-1.5 text-xs text-muted-foreground">(bạn)</span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                      !member.online
                        ? "bg-muted text-muted-foreground"
                        : member.ready
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-secondary text-secondary-foreground",
                    )}
                  >
                    {!member.online ? "đang vắng" : member.ready ? "sẵn sàng" : "chờ"}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex gap-3">
              <Button onClick={toggleReady} className="flex-1 gap-1.5">
                {isReady ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
                {isReady ? "Đã sẵn sàng" : "Sẵn sàng"}
              </Button>
              <Button
                variant="secondary"
                onClick={leave}
                disabled={leaving}
                className="flex-1 gap-1.5"
              >
                {leaving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <DoorOpen className="size-4" />
                )}
                Rời phòng
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
