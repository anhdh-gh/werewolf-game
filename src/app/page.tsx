"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, LogOut, Minus, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth/useAuth";
import { db } from "@/lib/firebase/client";
import { createRoom } from "@/lib/rooms/createRoom";
import { joinRoom, JoinRoomError } from "@/lib/rooms/joinRoom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.4 0-13.8 4.1-17.1 10.1z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-1.9 14.3-5.2l-6.6-5.6C29.6 34.9 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.9 39.6 16.4 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.6C41.4 36.5 44 30.9 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center p-6">
      {children}
    </main>
  );
}

export default function HomePage() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center gap-4 animate-in fade-in-0 duration-500">
          <Logo size={48} className="opacity-80" />
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!user) {
    const handleSignIn = async () => {
      setSigningIn(true);
      setError(null);
      try {
        await signInWithGoogle();
      } catch {
        setError("Đăng nhập thất bại, thử lại nhé");
      } finally {
        setSigningIn(false);
      }
    };

    return (
      <AppShell>
        <div className="flex w-full max-w-sm flex-col items-center gap-6 animate-in fade-in-0 slide-in-from-bottom-3 duration-500">
          <Logo size={72} />
          <div className="flex flex-col items-center gap-1.5 text-center">
            <h1 className="font-heading text-3xl tracking-wide text-foreground">Ma Sói</h1>
            <p className="text-sm text-muted-foreground">
              Chơi cùng bàn hoặc từ xa, chỉ cần một mã phòng
            </p>
          </div>

          <Card className="w-full">
            <CardContent className="flex flex-col gap-3 pt-1">
              <Button onClick={handleSignIn} disabled={signingIn} className="w-full gap-2" size="lg">
                {signingIn ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <span className="flex size-4 items-center justify-center rounded-full bg-white">
                    <GoogleIcon />
                  </span>
                )}
                Đăng nhập với Google
              </Button>
              {error && (
                <p className="flex items-center justify-center gap-1.5 text-center text-xs text-destructive">
                  <AlertCircle className="size-3.5 shrink-0" />
                  {error}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  const handleCreate = async () => {
    setError(null);
    setSubmitting(true);
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
      setSubmitting(false);
    }
  };

  const handleJoin = async () => {
    setError(null);
    const code = joinCode.trim().toUpperCase();
    if (code.length === 0) {
      setError("Nhập mã phòng trước đã");
      return;
    }
    setSubmitting(true);
    try {
      await joinRoom(db, code, {
        uid: user.uid,
        name: user.displayName ?? "Ẩn danh",
        photoURL: user.photoURL,
      });
      router.push(`/room/${code}`);
    } catch (err) {
      setError(err instanceof JoinRoomError ? err.message : "Không vào được phòng");
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="flex w-full max-w-sm flex-col gap-5 animate-in fade-in-0 slide-in-from-bottom-3 duration-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={36} />
            <span className="font-heading text-lg tracking-wide">Ma Sói</span>
          </div>
          <div className="flex items-center gap-2">
            {user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoURL}
                alt={user.displayName ?? "Bạn"}
                className="size-8 rounded-full ring-1 ring-border"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                {(user.displayName ?? "?").charAt(0).toUpperCase()}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              aria-label="Đăng xuất"
              className="text-muted-foreground"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="sr-only">Tạo hoặc vào phòng</CardTitle>
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("create");
                  setError(null);
                }}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  mode === "create"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Tạo phòng
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("join");
                  setError(null);
                }}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  mode === "join"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Vào phòng
              </button>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            {mode === "create" ? (
              <div
                key="create"
                className="flex flex-col gap-4 animate-in fade-in-0 duration-200"
              >
                <div className="flex flex-col items-center gap-2">
                  <Label htmlFor="maxPlayers" className="text-muted-foreground">
                    Số người chơi
                  </Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setMaxPlayers((n) => Math.max(4, n - 1))}
                      disabled={maxPlayers <= 4}
                      aria-label="Giảm"
                    >
                      <Minus className="size-4" />
                    </Button>
                    <span
                      id="maxPlayers"
                      className="font-heading w-12 text-center text-3xl tabular-nums"
                    >
                      {maxPlayers}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setMaxPlayers((n) => Math.min(16, n + 1))}
                      disabled={maxPlayers >= 16}
                      aria-label="Tăng"
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                  <span className="text-xs text-muted-foreground">4 đến 16 người</span>
                </div>
                <Button onClick={handleCreate} disabled={submitting} size="lg">
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  Tạo phòng
                </Button>
              </div>
            ) : (
              <div key="join" className="flex flex-col gap-3 animate-in fade-in-0 duration-200">
                <Input
                  autoFocus
                  placeholder="MÃ PHÒNG"
                  value={joinCode}
                  maxLength={6}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  className="h-14 text-center font-heading text-2xl tracking-[0.3em]"
                />
                <Button
                  variant="secondary"
                  onClick={handleJoin}
                  disabled={submitting}
                  size="lg"
                >
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  Vào phòng
                </Button>
              </div>
            )}

            {error && (
              <p className="flex items-center gap-1.5 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="size-3.5 shrink-0" />
                {error}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
