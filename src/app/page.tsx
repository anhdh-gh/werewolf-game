"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { db } from "@/lib/firebase/client";
import { createRoom } from "@/lib/rooms/createRoom";
import { joinRoom, JoinRoomError } from "@/lib/rooms/joinRoom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const router = useRouter();
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Đang tải...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Ma Sói</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={signInWithGoogle} className="w-full">
              Đăng nhập với Google
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const handleCreate = async () => {
    setError(null);
    try {
      const code = await createRoom(db, {
        uid: user.uid,
        name: user.displayName ?? "Ẩn danh",
        photoURL: user.photoURL,
        maxPlayers,
      });
      router.push(`/room/${code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được phòng");
    }
  };

  const handleJoin = async () => {
    setError(null);
    try {
      await joinRoom(db, joinCode.toUpperCase(), {
        uid: user.uid,
        name: user.displayName ?? "Ẩn danh",
        photoURL: user.photoURL,
      });
      router.push(`/room/${joinCode.toUpperCase()}`);
    } catch (err) {
      if (err instanceof JoinRoomError) {
        setError(err.message);
      } else {
        setError("Không vào được phòng");
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <p>Xin chào {user.displayName}</p>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Tạo phòng</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="maxPlayers">Số người chơi</Label>
            <Input
              id="maxPlayers"
              type="number"
              min={4}
              max={16}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
            />
          </div>
          <Button onClick={handleCreate}>Tạo phòng</Button>
        </CardContent>
      </Card>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Vào phòng</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Input
            placeholder="Mã phòng"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            className="text-center uppercase"
          />
          <Button variant="secondary" onClick={handleJoin}>
            Vào phòng
          </Button>
        </CardContent>
      </Card>

      {error && <p className="text-destructive">{error}</p>}

      <Button variant="link" onClick={signOut} className="text-muted-foreground">
        Đăng xuất
      </Button>
    </main>
  );
}
