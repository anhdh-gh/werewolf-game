"use client";

import { useEffect } from "react";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/useAuth";
import { useRoom } from "@/lib/rooms/useRoom";
import { attachPresence, detachPresence } from "@/lib/presence/presence";
import { ref, update, remove } from "firebase/database";
import { roomMemberPath } from "@/lib/rooms/paths";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RoomLobby({ code }: { code: string }) {
  const { user } = useAuth();
  const { room, loading } = useRoom(db, code);
  const router = useRouter();

  useEffect(() => {
    if (!user || !room?.members?.[user.uid]) return;
    const detach = attachPresence(db, user.uid, code);
    return () => detach();
  }, [user, code, room]);

  if (loading) return <p className="p-6 text-muted-foreground">Đang tải phòng...</p>;
  if (!room) return <p className="p-6 text-muted-foreground">Không tìm thấy phòng {code}</p>;
  if (!room.members || !room.settings)
    return <p className="p-6 text-muted-foreground">Không tìm thấy phòng {code}</p>;
  if (!user) return null;

  const toggleReady = () => {
    const currentlyReady = room.members[user.uid]?.ready ?? false;
    update(ref(db, roomMemberPath(code, user.uid)), { ready: !currentlyReady });
  };

  const leave = async () => {
    await remove(ref(db, roomMemberPath(code, user.uid)));
    await detachPresence(db, user.uid, code);
    router.push("/");
  };

  const members = Object.entries(room.members);

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-3xl tracking-widest">{code}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-center text-muted-foreground">
            {members.length} / {room.settings.maxPlayers} người
          </p>
          <ul className="space-y-2">
            {members.map(([uid, member]) => (
              <li
                key={uid}
                className={`flex justify-between rounded-md px-3 py-2 ${
                  member.online ? "bg-secondary" : "bg-muted text-muted-foreground"
                }`}
              >
                <span>{member.name}</span>
                <span>{!member.online ? "đang vắng" : member.ready ? "sẵn sàng" : "chờ"}</span>
              </li>
            ))}
          </ul>
          <div className="flex gap-3">
            <Button onClick={toggleReady} className="flex-1">
              {room.members[user.uid]?.ready ? "Huỷ sẵn sàng" : "Sẵn sàng"}
            </Button>
            <Button variant="secondary" onClick={leave} className="flex-1">
              Rời phòng
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
