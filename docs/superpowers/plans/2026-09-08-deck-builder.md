# Deck builder — room creator picks the exact role deck (thay cho công thức auto-compute)

**Nguồn:** chỉ thị trực tiếp của owner, 2026-09-08 ("STOP — READ THIS FIRST" ở đầu
`.gnhf/runs/stop-read-this-first-98c7ba/prompt.md`): *"Cho phép chọn nhân vật kèm số lượng
nữa. Không để BE tự sinh số lượng hay phân vai đâu nhé. Người tạo phòng quyết định hết."*
Đây là thay đổi nền tảng, phải làm **trước** khi tiếp tục epic mở rộng vai (roadmap ở
`2026-09-08-roles-epic-roadmap.md`, hiện đang dừng ở Epic 4a Story 4a.2/Beholder `story
ready`) — lý do: một hệ thống auto-fill theo công thức không thể quyết định hợp lý "ván 10
người có nên có Sorcerer mới thêm hay không", nên deck-builder thủ công phải là nền trước khi
tích hợp thêm nhiều vai nữa, tránh phải làm lại tích hợp sau.

**Bất biến KHÔNG đổi (việc duy nhất phải giữ nguyên tuyệt đối):** ai trong số người đã join
nhận vai nào vẫn ngẫu nhiên và giấu kín y hệt hiện tại — `assignRoles`'s `shuffle()` không đổi
logic, chỉ đổi input nó nhận (deck tường minh thay vì deck tự tính). Epic này KHÔNG cho người
tạo phòng chọn ai nhận vai nào — chỉ chọn deck có bao nhiêu lá mỗi loại.

## 1. Trạng thái hiện tại (đọc đầy đủ trước khi thiết kế, theo đúng yêu cầu owner)

- `src/lib/game/roles.ts`: `wolfCount(n) = floor((n-1)/4)+1`; `buildRoleList(n, rolesEnabled)`
  luôn thêm wolves + SEER + WITCH + ≥1 VILLAGER bắt buộc, rồi lấp `OPTIONAL_ROLE_KEYS`
  (`src/types/room.ts`, 15 vai phụ theo đúng thứ tự ưu tiên spec §4.2) theo thứ tự cố định,
  bỏ qua vai bị tắt. `assignRoles(uids, rolesEnabled)` = `shuffle(buildRoleList(...))` rồi
  gán tuần tự — đây là phần **duy nhất** phải giữ nguyên tinh thần (random + giấu kín).
- `src/types/room.ts`: `RoomSettings = { maxPlayers, rolesEnabled: Record<OptionalRoleKey,
  boolean>, remoteMode }`. `rolesEnabled` chỉ là on/off cho 15 vai phụ — WEREWOLF/SEER/WITCH/
  VILLAGER không có công tắc, luôn bắt buộc theo công thức.
- `src/lib/rooms/createRoom.ts`: nhận `maxPlayers` từ form tạo phòng, tự set
  `rolesEnabled = DEFAULT_ROLES_ENABLED` (tất cả `true`) — không có bước chọn deck ở đây.
- `src/lib/rooms/joinRoom.ts`: chặn join khi `memberCount >= room.settings.maxPlayers`
  (`FULL`) — room đã chờ đúng đến khi đủ `maxPlayers`, hành vi này **giữ nguyên**, chỉ đổi
  nguồn của con số (từ input riêng sang derive từ deck, xem §3).
- `src/components/RoomLobby.tsx`: panel "Cài đặt vai" (collapsible, mặc định đóng) — mọi
  thành viên (không có chủ phòng, spec §3) có thể bật/tắt từng vai phụ bất cứ lúc nào trong
  LOBBY qua `Switch`. Nút "Bắt đầu" chỉ cần `members.length >= 4`, không so với `maxPlayers`.
- `src/app/api/rooms/[code]/start/route.ts`: đọc `uids = Object.keys(room.members)`, gọi
  `assignRoles(uids, room.settings.rolesEnabled)` — **không hề đọc `maxPlayers`**, số vai luôn
  khớp đúng số người đã join tại thời điểm bấm Start (không phải deck cố định trước).
- `database.rules.json` (`rooms/$code/settings`): `.write` cho phép khi còn `status ===
  'LOBBY'` và người ghi là thành viên; `.validate` yêu cầu `hasChildren(['maxPlayers',
  'rolesEnabled', 'remoteMode'])` + `rolesEnabled.hasChildren([8 trong 15 khoá optional cũ —
  đã lạc hậu, thiếu MASON/PRINCE/PACIFIST/VILLAGE_IDIOT/SORCERER/WOLF_MAN/WOLF_CUB])`. Ghi
  chú: rule này đã trôi khỏi `OPTIONAL_ROLE_KEYS` thật từ lâu (không phải lỗi do epic này gây
  ra) — deck-builder thay hẳn field này nên không cần vá riêng cái cũ.
- `src/lib/game/labels.ts`: `ROLE_LABELS` (đủ 19 `RoleKey`) và `FACTION_LABELS` (`WOLF` →
  "Phe Sói", `VILLAGE` → "Phe Làng", `TANNER` → "Chán Đời") đã có sẵn — dùng thẳng cho UI
  group-by-faction, không cần thêm map mới.
- `src/types/game.ts`: `FACTION_BY_ROLE: Record<RoleKey, Faction>` đã có, dùng để tính "có ít
  nhất 1 vai phe Sói" (§4 dưới) và để group UI theo phe.

## 2. Trả lời các câu hỏi mở owner giao cho judgment (ghi rõ quyết định, không đoán ngầm)

### 2.1 Deck cố định — không chỉnh khi người chơi đang vào (owner đã chốt)

Owner đã chốt: deck soạn TRƯỚC/NGOÀI lúc phòng lấp đầy, "không phải thứ chỉnh sống khi người
chơi vào dần". Điều này KHÔNG mâu thuẫn với "không có chủ phòng" (spec §3) nếu hiểu đúng: deck
vẫn có thể sửa bởi bất kỳ thành viên nào (giữ nguyên mô hình quyền hiện tại của
`rolesEnabled`/`remoteMode` — không ai có đặc quyền riêng), nhưng **cổng chặn Bắt đầu** đổi từ
"đủ ≥4 người" sang "đủ ĐÚNG số người bằng tổng deck" — đây chính là cách "phòng chờ đủ đúng N
người" được thực thi cụ thể trong code, không cần khoá field settings sau khi tạo phòng (khoá
riêng sẽ tạo ra khái niệm "chủ phòng" ngầm mà spec §3 đã cố tình loại bỏ). Quyết định: giữ
nguyên quyền chỉnh settings hiện có (bất kỳ thành viên, khi `status === 'LOBBY'`), đổi điều
kiện Start.

Vị trí bước soạn deck trong luồng: bước tạo phòng (`page.tsx`/`createRoom.ts`) vẫn là nơi
soạn deck LẦN ĐẦU (thay vì chỉ nhập một số `maxPlayers` trần), panel "Cài đặt vai" trong
`RoomLobby.tsx` (đổi UI từ switch sang stepper) vẫn là nơi TIẾP TỤC chỉnh nếu cần, trước khi
đủ người bấm Start — thống nhất một component logic, không tách hai luồng chỉnh deck khác
nhau.

### 2.2 Ràng buộc cứng duy nhất: ≥1 vai phe Sói (owner đã chốt)

"Server reject bắt đầu ván nếu deck có 0 vai phe Sói" — dùng thẳng `FACTION_BY_ROLE` đã có:
đếm số lá mà `FACTION_BY_ROLE[role] === 'WOLF'` (tự động đúng cho WEREWOLF/TRAITOR/SORCERER/
WOLF_MAN/WOLF_CUB — bất kỳ vai Sói nào thêm sau này tự động được tính, không cần liệt kê tay
lại danh sách này ở chỗ thứ hai — bài học "một nguồn sự thật duy nhất" đã áp dụng cho
`isPackVisible` ở Epic 3, iteration 15). KHÔNG thêm ràng buộc ngầm nào khác — bỏ hẳn "luôn có
SEER/WITCH/≥1 VILLAGER" của công thức cũ, đúng chỉ thị "mọi yêu cầu auto-fill cũ khác đều bị
bỏ, người tạo phòng toàn quyền ngoài ràng buộc Sói này".

Chặn ở đâu: **route `/api/rooms/[code]/start`** (Admin SDK, bỏ qua Security Rules hoàn toàn —
comment sẵn có trong route.ts xác nhận đây là "the only writer Security Rules ever allow" cho
`status`/`currentGameId`) — đúng nghĩa đen "server reject start" owner yêu cầu, trả 400 kèm
thông báo tiếng Việt rõ ràng nếu deck không có Sói. KHÔNG chặn ở RTDB `.validate` cho việc ghi
`settings` (chỉnh deck) — chặn ở đó sẽ khoá cứng cả những chỉnh sửa TẠM THỜI hợp lệ giữa chừng
(ví dụ đang gõ dở, chưa kịp thêm Sói) trước khi bấm Start, một trải nghiệm tồi không cần thiết
vì Admin SDK không đọc rule này khi Start chạy thật.

### 2.3 Room cũ giữa chừng khi ship — xác nhận lại (owner đã lưu ý xác nhận, không giả định)

Cần lệnh live để xác nhận không còn room `LOBBY` cũ ở format cũ tồn tại lâu dài trong RTDB
trước khi coi assumption này là an toàn — để dành cho iteration implement (cần credential
Admin SDK để đọc `rooms/*`, hiện chưa xác nhận được từ iteration nghiên cứu/thiết kế thuần
này). Ghi chú lại rõ ràng thay vì lặng lẽ giả định.

## 3. Thiết kế dữ liệu

`RoomSettings` (`src/types/room.ts`):

```ts
export interface RoomSettings {
  /** Deck tường minh: đúng bao nhiêu lá mỗi vai, người tạo phòng quyết định toàn bộ.
   * Không còn maxPlayers riêng — tổng roleCounts CHÍNH LÀ số người chơi mục tiêu (§3.1). */
  roleCounts: Record<RoleKey, number>;
  remoteMode: boolean;
}
```

Bỏ hẳn `OPTIONAL_ROLE_KEYS`/`OptionalRoleKey` (mọi `RoleKey`, kể cả WEREWOLF/SEER/WITCH/
VILLAGER, giờ đều là "optional" theo nghĩa người tạo phòng gõ số — không còn khái niệm
"bắt buộc theo công thức" nữa). `ROLE_LABELS`/`FACTION_BY_ROLE` (đã có, đủ 19 khoá) đủ để lặp
UI theo toàn bộ `RoleKey` thay vì `OPTIONAL_ROLE_KEYS`.

### 3.1 `deckSize()` — một nguồn sự thật duy nhất cho "số người chơi mục tiêu"

```ts
export function deckSize(roleCounts: Record<RoleKey, number>): number {
  return Object.values(roleCounts).reduce((sum, n) => sum + n, 0);
}
```

Không lưu `maxPlayers` như một field riêng nữa (tránh 2 nguồn có thể lệch nhau — đúng bài học
`isPackVisible` đã trích ở §2.2). Mọi chỗ đang đọc `room.settings.maxPlayers` đổi sang gọi
`deckSize(room.settings.roleCounts)`:
  - `joinRoom.ts`: `memberCount >= deckSize(room.settings.roleCounts)` → `FULL`.
  - `RoomLobby.tsx`: thanh tiến trình + text "X / Y người chơi", và nút Bắt đầu đổi điều kiện
    từ `members.length >= 4` sang **`members.length === deckSize(...)`** (đủ ĐÚNG, không phải
    ≥ — đúng ngữ nghĩa "phòng chờ đủ đúng N người" ở §2.1). Giữ validate tối thiểu 4 người ở
    tầng deck-builder (tổng phải ≥ 4) chứ không phải ở nút Start nữa.

### 3.2 `buildRoleList` / `assignRoles`

```ts
export function buildRoleList(roleCounts: Record<RoleKey, number>): RoleKey[] {
  const roles: RoleKey[] = [];
  for (const [role, count] of Object.entries(roleCounts) as [RoleKey, number][]) {
    for (let i = 0; i < count; i++) roles.push(role);
  }
  return roles; // thứ tự không quan trọng — assignRoles sẽ shuffle
}

export function assertValidDeck(roleCounts: Record<RoleKey, number>): void {
  const size = deckSize(roleCounts);
  if (size < 4 || size > 16) throw new Error("Số người chơi phải từ 4 đến 16");
  const wolfCount = (Object.entries(roleCounts) as [RoleKey, number][])
    .filter(([role]) => FACTION_BY_ROLE[role] === "WOLF")
    .reduce((sum, [, n]) => sum + n, 0);
  if (wolfCount < 1) throw new Error("Deck phải có ít nhất một vai phe Sói");
}
```

`assignRoles(uids, roleCounts)` giữ nguyên logic (`shuffle(buildRoleList(roleCounts))`, gán
tuần tự) — chỉ đổi input. `wolfCount(n)` (công thức cũ) và mảng `OPTIONAL_ROLE_KEYS` (thứ tự
lấp cũ) bị xoá hoàn toàn khỏi `roles.ts`/`types/room.ts` — không còn ai gọi.

### 3.3 `start/route.ts`

Thêm `assertValidDeck(room.settings.roleCounts)` ngay sau khi đọc `room`, trước khi tính
`assignment` — trả 400 với thông báo tiếng Việt nếu ném lỗi (giữ đúng pattern try/error hiện
có của route này). Đổi điều kiện `uids.length < 4` (400 "Cần ít nhất 4 người chơi") thành
`uids.length !== deckSize(room.settings.roleCounts)` (400, thông báo kiểu "Cần đúng N người
chơi, hiện có M" — phòng khi ai đó rời/vào lệch giữa lúc `RoomLobby` cho phép bấm Start và lúc
route thực thi, tương tự race window đã ghi nhận trong `joinRoom.ts`'s comment). Bỏ hẳn tham
chiếu `wolfCount`/`OPTIONAL_ROLE_KEYS`.

## 4. RTDB rules (`database.rules.json`)

Đổi `.validate` cho `rooms/$code/settings`:

```json
"newData.hasChildren(['roleCounts', 'remoteMode']) && newData.child('remoteMode').isBoolean() && newData.child('roleCounts').hasChildren([<19 RoleKey>]) && <mỗi child roleCounts là number, 0..16> && <tổng 19 child trong khoảng 4..16>"
```

19 khoá liệt kê tay trong `hasChildren` + 19 điều kiện `isNumber() && val() >= 0 && val() <=
16` nối `&&` + 1 biểu thức tổng 19 số hạng `... >= 4 && ... <= 16` — dài nhưng đúng kiểu biểu
thức RTDB rule đã dùng ở project này (rule cũ đã có 8 `hasChildren` + 4 điều kiện lồng, đây là
tiếp nối cùng phong cách, không phải kỹ thuật mới). KHÔNG thêm điều kiện "≥1 Sói" vào rule này
— lý do đã giải thích ở §2.2. `.write` (yêu cầu là thành viên + `status === 'LOBBY'`) giữ
nguyên, không đổi.

Đây là "RTDB rules implications của creator-controlled settings write" mà owner yêu cầu xét —
kết luận: cần đổi `.validate` (shape field đổi hẳn), không cần đổi `.write` (quyền ai được ghi
không đổi).

## 5. UI — deck-builder (owner: tránh "trông như sinh viên code", dùng Kahoot/Jackbox/Among Us
làm gốc tham chiếu, invoke `ui-ux-pro-max` khi tới bước implement UI này — KHÔNG bỏ qua)

Vị trí: thay hẳn nội dung panel "Cài đặt vai" hiện có trong `RoomLobby.tsx` (giữ vỏ
collapsible + vị trí, đổi nội dung bên trong) VÀ dùng lại UI đó ngay ở bước tạo phòng
(`page.tsx`) thay vì input `maxPlayers` trần hiện tại — một component dùng chung cho cả hai
chỗ, tránh viết 2 UI riêng cho cùng một khái niệm.

- Group theo phe dùng `FACTION_LABELS`/`FACTION_BY_ROLE` sẵn có: "Phe Sói" → "Phe Làng" →
  "Chán Đời" (thứ tự — cùng tinh thần ưu tiên spec §4.2 cũ dù không còn bắt buộc theo công
  thức, vẫn hợp lý làm thứ tự hiển thị).
  - Mỗi hàng: `ROLE_LABELS[role]` + stepper (nút trừ / số / nút cộng, tối thiểu 0) — không
    phải input số trần (tell "student project" owner đã nêu — số trần không có big-tap-target,
    dễ gõ sai trên di động).
- Tổng đang chọn hiển thị nổi bật ("N người chơi") — không so với một mục tiêu cố định nào
  khác nữa (chính nó LÀ mục tiêu, xem §3.1), nhưng validate trực quan: đỏ/cảnh báo nếu
  `< 4`, `> 16`, hoặc 0 vai phe Sói — vô hiệu hoá nút xác nhận/Bắt đầu tương ứng cho tới khi
  hợp lệ (client-side UX, server vẫn là nguồn sự thật cuối theo `assertValidDeck`).
- Seed mặc định khi tạo phòng: dùng công thức CŨ (`wolfCount`, luôn có SEER/WITCH/1 VILLAGER)
  chỉ để ĐIỀN SẴN giá trị khởi tạo cho một cỡ phòng mặc định hợp lý (ví dụ 8 người) — người
  tạo phòng thấy ngay một deck hợp lệ, chỉnh tiếp tuỳ ý, không bắt đầu từ deck rỗng. Đây thuần
  là UX convenience, KHÔNG phải logic enforce — công thức cũ không còn tồn tại trong
  `roles.ts` (đã xoá ở §3.2), giá trị seed này sống ở tầng UI component (hằng số cục bộ), tính
  một lần lúc mount, không tính lại tự động khi đổi field khác.

## 6. Test coverage cần cho iteration implement

- `roles.test.ts`: viết lại toàn bộ theo API mới (`buildRoleList(roleCounts)`,
  `assertValidDeck`, `assignRoles(uids, roleCounts)`) — xoá test dựa trên `wolfCount`/
  `OPTIONAL_ROLE_KEYS`. Test riêng: deck 0 Sói → ném lỗi; deck tổng <4/>16 → ném lỗi; deck hợp
  lệ → đúng số lá mỗi loại, đúng tổng.
- `createRoom.test.ts`: input đổi từ `maxPlayers` sang `roleCounts` — test tạo phòng với deck
  seed mặc định.
- `joinRoom.test.ts`: `FULL` giờ dựa trên `deckSize(roleCounts)` thay vì `maxPlayers` field.
- `gameFlowEndToEnd.test.ts`/`multiClientGame.test.ts`: mọi fixture `rolesEnabled: Record<
  OptionalRoleKey, boolean>` đổi sang `roleCounts: Record<RoleKey, number>` tường minh — ảnh
  hưởng nhiều fixture (đã dùng lặp lại xuyên Epic 1–4a), cần rà soát hết chứ không phải chỉ
  vài chỗ. Thêm test route-level: Start route trả 400 khi deck 0 Sói; trả 400 khi số người
  join ≠ deckSize (kể cả khi ≥4).
- `rules.test.ts` (emulator): test `.validate` mới cho `settings/roleCounts` (thiếu khoá →
  reject; số âm → reject; tổng ngoài 4..16 → reject; deck hợp lệ → accept). Test cũ dựa trên
  `rolesEnabled.hasChildren([8 khoá cũ])` cần thay hẳn.
- `useRoom.test.ts`: cập nhật fixture `Room`/`RoomSettings` nếu có định nghĩa type cứng ở đó.

## 7. Việc tiếp theo

Thiết kế đã đủ rõ để implement — không còn câu hỏi mở nào cần owner trả lời thêm (2 câu hỏi
owner nêu đều đã được owner tự chốt sẵn trong chỉ thị gốc, xem §2.1/§2.2; §2.3 là việc cần xác
nhận bằng lệnh live ở đầu iteration implement, không phải câu hỏi thiết kế). Iteration kế tiếp:
implement theo đúng danh sách file ở §3/§4/§5/§6 — theo đúng tiền lệ "1 iteration = pass thiết
kế, iteration sau = implement" đã dùng cho Epic 3c/Epic 4a. Build/test/lint trước khi coi xong,
verify CI xanh + deploy `database.rules.json` lên RTDB live + byte-compare (đúng quy trình lặp
lại xuyên mọi epic trước) trước khi coi deck-builder là `done`. Sau khi `done`, roadmap vai
(`2026-09-08-roles-epic-roadmap.md`) tiếp tục đúng checkpoint hiện tại của nó (Story 4a.2
Beholder, `story ready`, chưa implement).

## 8. Đã xong (iteration 3, 2026-09-08)

CI cho commit implement (`d85f167`) xanh (`vitest`/`rules.test.ts` chạy trên emulator, bao
gồm toàn bộ test case `.validate` mới ở §4). §2.3 xác nhận: `firebase database:get /rooms
--shallow --project werewolf-game-2026` TRƯỚC khi deploy tìm thấy đúng 2 room format cũ
(`EUXNJX`, `PYTLSM` — cả 2 đơn-thành-viên, chủ sở hữu chính tài khoản đang thao tác, offline,
`status: LOBBY`, `settings.{maxPlayers, rolesEnabled}` cũ) — xác nhận giả định "không còn room
cũ" ở §2.3 SAI, không phải đúng như dự đoán. Đã xoá cả 2 (`firebase database:remove ... --force`)
trước khi deploy rules mới, vì client mới sẽ crash khi đọc `settings.roleCounts` undefined trên
2 room đó (`deckSize(undefined)` ném lỗi) — quyết định có chủ đích, không phải side-effect âm
thầm, theo đúng yêu cầu ghi rõ quyết định ở learnings iteration 2. Sau đó `firebase deploy
--only database --project werewolf-game-2026` thành công, và `firebase database:get
/.settings/rules` byte-so khớp CHÍNH XÁC với `database.rules.json` local (so bằng
`JSON.stringify` deep-equal, không phải diff văn bản thô vì JSON một dòng luôn "khác" theo
diff dòng). Deck-builder chính thức `done` — roadmap vai (`2026-09-08-roles-epic-roadmap.md`)
tiếp tục từ Story 4a.2 (Beholder, `story ready`) ở iteration kế tiếp.
