"use client";

import { useEffect, useRef } from "react";
import type { PhaseName } from "@/types/game";
import { PHASE_LABELS } from "./labels";

/** Spec §8.2: a page actively playing audio is exempt from most mobile
 * browsers' background-tab throttling — this is the anchor that keeps the
 * WebSocket (and phase timers) alive when the screen locks or the app is
 * backgrounded, per spec §2's core constraint ("ván đấu phải chạy tiếp khi
 * màn hình tắt"). The file itself is true silence — a 1-second zero-
 * amplitude PCM loop (public/audio/keepalive-silence.wav) — nothing is
 * audible; only the "is this tab playing audio" flag the OS checks. */
export function useBackgroundAudioKeepAlive(active: boolean): void {
  useEffect(() => {
    if (!active) return;

    const audio = new Audio("/audio/keepalive-silence.wav");
    audio.loop = true;
    audio.volume = 1;

    let retryHandler: (() => void) | null = null;
    const tryPlay = () => {
      audio.play().catch(() => {
        // Autoplay was blocked (no prior user gesture this navigation) —
        // the very next tap/click anywhere on the page counts as one.
        retryHandler = () => {
          audio.play().catch(() => {});
        };
        document.addEventListener("pointerdown", retryHandler, { once: true });
      });
    };
    tryPlay();

    return () => {
      audio.pause();
      audio.src = "";
      if (retryHandler) document.removeEventListener("pointerdown", retryHandler);
    };
  }, [active]);
}

const NIGHT_PHASES = new Set<PhaseName>([
  "NIGHT_FALLS",
  "SEER",
  "BODYGUARD",
  "MUTER",
  "WOLVES",
  "WITCH_SAVE",
  "WITCH_KILL",
  "CURSED",
  "DAWN",
]);
const DAY_PHASES = new Set<PhaseName>(["DISCUSSION", "VOTE", "VOTE_RESULT"]);

/** Spec §8.2: "Màn hình khoá hiện như đang phát nhạc... đặt tiêu đề theo
 * phase hiện tại: 'Đêm 2 — Sói đang thức'." Lets a glance at the lock
 * screen say where the game is without unlocking the phone. */
export function usePhaseMediaSession(
  phase: { name: PhaseName } | undefined,
  dayNumber: number | undefined,
): void {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (!phase) return;

    const label = PHASE_LABELS[phase.name];
    const prefix = NIGHT_PHASES.has(phase.name)
      ? `Đêm ${dayNumber} — `
      : DAY_PHASES.has(phase.name)
        ? `Ngày ${dayNumber} — `
        : "";

    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${prefix}${label}`,
      artist: "Ma Sói",
    });
  }, [phase?.name, dayNumber]);
}

/** Spec §8.2: "Giữ màn sáng chỉ khi đến lượt" — Wake Lock held only while
 * this uid is the one required to act (the exact condition GameScreen
 * already computes for whether to show ActionPanel), released the moment
 * that's no longer true. The OS auto-releases a Wake Lock whenever the
 * document goes hidden, so this re-acquires on visibilitychange rather
 * than assuming a lock taken once stays held for the rest of the phase. */
export function useAutoActionWakeLock(shouldHold: boolean): void {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    if (!shouldHold) {
      lockRef.current?.release().catch(() => {});
      lockRef.current = null;
      return;
    }

    let cancelled = false;
    const acquire = async () => {
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (cancelled) {
          lock.release().catch(() => {});
          return;
        }
        lockRef.current = lock;
      } catch {
        // Not critical — the phase clock/RTDB keep working without it, the
        // screen just might dim on its own timeout while waiting.
      }
    };
    acquire();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && shouldHold && !lockRef.current) {
        acquire();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      lockRef.current?.release().catch(() => {});
      lockRef.current = null;
    };
  }, [shouldHold]);
}

/** Spec §8.2: "Đến lượt bạn thì máy gọi: một đoạn chuông riêng cắt vào
 * luồng nền, kèm rung trên Android." This is the in-app alert for while
 * the tab is still alive (backgrounded or foregrounded) — distinct from
 * the FCM push in useNotifications/advance route, which only fires once
 * the OS has killed the tab outright. Fires exactly once on the
 * false -> true edge of `isRequired`, never on mount if the phase already
 * required this uid before the component ever rendered (opening the app
 * to a turn you already knew about — e.g. from the FCM push itself —
 * shouldn't double-alert), and never again while it stays true. */
export function useTurnChime(isRequired: boolean): void {
  const wasRequiredRef = useRef(isRequired);

  useEffect(() => {
    const wasRequired = wasRequiredRef.current;
    wasRequiredRef.current = isRequired;
    if (!isRequired || wasRequired) return;

    new Audio("/audio/turn-chime.wav").play().catch(() => {
      // autoplay blocked — the useBackgroundAudioKeepAlive loop already
      // playing (if it got past autoplay itself) means this one usually
      // won't be blocked in practice, but there's nothing more to do if it is
    });
    if ("vibrate" in navigator) {
      navigator.vibrate([200, 100, 200]); // spec: "kèm rung trên Android"
    }
  }, [isRequired]);
}
