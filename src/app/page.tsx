"use client";

import { useAuth } from "@/lib/auth/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <p>Xin chào {user.displayName}</p>
      <Button variant="secondary" onClick={signOut}>
        Đăng xuất
      </Button>
    </main>
  );
}
