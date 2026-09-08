// Spec §9: cache the app shell and audio files, NEVER game data — RTDB owns
// that, and a stale cached snapshot of a game would be worse than none.
// RTDB itself talks over a WebSocket, not fetch(), so it never passes
// through this file at all; the explicit skips below are for the handful
// of same-origin HTTP calls (API routes, Firebase Auth REST calls) that
// could otherwise get caught by an over-broad fetch handler.

const CACHE_VERSION = "v2"; // narration audio (37 clips) rendered 2026-09-08 — bust the cache
const CACHE_NAME = `masoi-shell-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

/** Never intercept: API routes (server-authoritative, always fresh),
 * anything cross-origin (Firebase Auth/RTDB's own REST/WebSocket calls,
 * Google's avatar CDN, fonts) — this service worker only ever touches this
 * app's own static shell and audio files. */
function shouldBypass(url) {
  if (!isSameOrigin(url)) return true;
  if (url.pathname.startsWith("/api/")) return true;
  return false;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (shouldBypass(url)) return;

  const isAudio = url.pathname.startsWith("/audio/");
  const isNavigation = request.mode === "navigate";

  if (isAudio) {
    // Spec §8.3: pre-rendered narration files are immutable once built —
    // cache-first, and cache whatever wasn't precached yet on first play.
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          }),
      ),
    );
    return;
  }

  if (isNavigation) {
    // Network-first for the app shell's HTML: whoever has a connection
    // always gets the current build; only falls back to the cached shell
    // when genuinely offline (spec §2's "cất điện thoại vào túi" case still
    // needs SOME shell to render before RTDB reconnects and repaints it).
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then((cached) => cached || caches.match("/"))),
    );
    return;
  }

  // Everything else same-origin and static (_next/static bundles, icons,
  // manifest): cache-first, since these are content-hashed and immutable
  // per build.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }),
    ),
  );
});

// Spec §8.2's push safety net (Resilience Task 6). One service worker
// handles both the shell/audio caching above and this — see
// src/lib/notifications/push.ts's own comment for why the client reuses
// this same registration instead of registering a separate
// firebase-messaging-sw.js.
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }
  const title = payload.notification?.title || payload.title || "Ma Sói";
  const body = payload.notification?.body || payload.body || "Đến lượt bạn";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/");
    }),
  );
});
