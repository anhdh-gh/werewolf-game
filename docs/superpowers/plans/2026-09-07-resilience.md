# Resilience sub-project — plan

Covers spec §8 (audio + background running), §9 (PWA), §10 (voice/video), and the
"Chơi xa" (remote play) chat pieces of §0/§4.7 — the parts of §3's v1 scope that
Game Engine (`docs/superpowers/plans/2026-09-07-game-engine.md`) explicitly deferred.
Started per direct user request after Game Engine reached spec parity.

## Global constraints (same shape as Game Engine's)

- No live Firebase project reachable from this sandbox (`firebase login` fails, no
  service account key) — same blocker as Game Engine, see its plan for detail.
- No LiveKit Cloud credentials (`LIVEKIT_API_KEY`/`SECRET`) — §10 code can be written
  and typechecked, never live-tested against a real room.
- No FCM service account / VAPID keys — §8.2 push notification code can be written,
  never live-tested against a real device.
- No real phone for §11's explicitly-required pre-build validation ("Âm thanh nền
  trên iOS... thử trên iPhone thật, Safari, đã cài ra màn hình chính" — must be
  tested on real hardware BEFORE building, since a wrong assumption changes the
  design). Building the well-established silent-looping-audio pattern anyway since
  it's a widely-documented, not experimental technique — but flagging clearly that
  this spec-mandated validation step could not run here.
- Every task gets the same verification ceiling as Game Engine: typecheck, `next
  build`, Vitest where the logic is pure/mockable, and a temporary dev-preview route
  + real headless-Chromium screenshot for anything visual (always deleted before the
  commit that follows it).

## Task 1: "Chơi xa" room setting — STATUS: in progress

Add `RoomSettings.remoteMode: boolean` (default `false`), a toggle in RoomLobby next
to the role-settings card, and Security Rules validation for the new field. This
gates everything else in this plan — chat, LiveKit auto-join, and mic/cam publish
permission all read it.

## Task 2: Chat (làng/sói scoped) — STATUS: not started

`/games/{gameId}/chat/{scope}/{msgId}` per spec §7, scope = `village | wolves`.
Wolves' chat readable only by wolf-faction uids (another role-hiding-shaped Security
Rules problem, same family as Task 10's `actions` tree in Game Engine — a wolf-chat
message's mere existence at a wolf-readable path doesn't leak anything since ALL
wolves can already read it, but a non-wolf must never reach it even to prove it's
non-empty). Rendered only when `room.settings.remoteMode` is on (§0: "ngồi cùng bàn
thì nói bằng miệng — bật chat lúc đó chỉ tạo tiếng thông báo vô nghĩa"). Muted
players (§4.7) get their chat input locked when remoteMode is on — the always-on
`MutedBanner` (Game Engine) already covers the non-remote baseline.

## Task 3: Service worker (app shell + audio cache) — STATUS: not started

§9: cache the app shell and `/public/audio/*`, explicitly NOT game data (RTDB owns
that — spec's own explicit warning that a stale cached game state is worse than none).

## Task 4: Background audio keep-alive — STATUS: not started

§8.2: silent looping `<audio>` element as the anchor that keeps the tab alive when
backgrounded (documented iOS/Android technique — a page actively playing audio is
exempt from background throttling). MediaSession API sets lock-screen title to the
current phase ("Đêm 2 — Sói đang thức"). Wake Lock held only during a phase this uid
must act in, released otherwise. Real verification needs §11 point 1's real-device
test, which cannot happen here — built to spec, flagged as such.

## Task 5: TTS narration — STATUS: not started

§8.3: ~20 fixed sentences + count variants (0-16) for "đêm qua có N người chết",
pre-rendered to mp3 at build time, served from `/public/audio`, looked up by
`narration/{seq}` (key + params) written to RTDB. Needs an actual TTS engine to
produce real Vietnamese audio — this sandbox has no such tool available; will
scaffold the RTDB write/read mechanism and the sentence-key catalog, and document
exactly what audio-generation step remains for whoever has TTS access.

## Task 6: Push notifications (FCM) — STATUS: not started

§8.2 safety net. Needs `NEXT_PUBLIC_FIREBASE_VAPID_KEY` + a service worker push
handler + subscribing clients writing their FCM token somewhere the server can read
it to send from. Code-only, like Game Engine's Admin-SDK routes — cannot be
live-verified here.

## Task 7: LiveKit voice/video — STATUS: not started

§10: `POST /api/livekit/token`, auto-joined rooms per phase (`{gameId}-{phaseKey}`),
publish permission withheld for dead players and for anyone whose target phase isn't
a "bàn bạc" phase (WOLVES for the pack, DISCUSSION for everyone alive). Needs
`LIVEKIT_API_KEY`/`LIVEKIT_API_SECRET` — same "written, not live-verified" ceiling as
every Admin-SDK-backed Game Engine route.
