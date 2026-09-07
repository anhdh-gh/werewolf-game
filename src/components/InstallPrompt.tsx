"use client";

import { useEffect, useState } from "react";

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
      <button
        onClick={async () => {
          await deferredPrompt.prompt();
          setDeferredPrompt(null);
        }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded bg-red-700 px-4 py-2 text-sm"
      >
        Cài đặt Ma Sói
      </button>
    );
  }

  if (showIosHint) {
    return (
      <p className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded bg-neutral-800 px-4 py-2 text-center text-xs">
        Để nhận thông báo, bấm Chia sẻ → Thêm vào MH chính
      </p>
    );
  }

  return null;
}
