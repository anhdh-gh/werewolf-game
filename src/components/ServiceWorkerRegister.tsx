"use client";

import { useEffect } from "react";

/** Spec §9: registers /public/sw.js (see that file's own comments for what
 * it does and — just as importantly — what it deliberately never touches).
 * Silently no-ops in any environment without the API (older browsers, some
 * in-app webviews) — this is a caching nicety, not something the app's
 * correctness depends on. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // best-effort — the app works fine without it, just without the
      // offline-shell/audio-cache benefit
    });
  }, []);

  return null;
}
