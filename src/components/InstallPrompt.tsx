"use client";

import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    if (isIos()) {
      setShowIosHint(true);
      return;
    }

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (deferredPrompt) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
        <Button
          onClick={async () => {
            await deferredPrompt.prompt();
            setDeferredPrompt(null);
          }}
          size="lg"
          className="gap-2 rounded-full shadow-lg"
        >
          <Download className="size-4" />
          Cài đặt Ma Sói
        </Button>
      </div>
    );
  }

  if (showIosHint) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
        <p className="flex max-w-[min(22rem,90vw)] items-center gap-2 rounded-2xl bg-card px-4 py-2.5 text-left text-xs text-card-foreground shadow-lg ring-1 ring-border">
          <Share className="size-3.5 shrink-0 text-muted-foreground" />
          Bấm Chia sẻ → Thêm vào MH chính để nhận được thông báo đẩy trên iPhone
        </p>
      </div>
    );
  }

  return null;
}
