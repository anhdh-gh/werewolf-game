# Epic 3c — engine capability pass: nhiều nạn nhân sói/đêm (Wolf Cub)

**Input:** `docs/superpowers/research/2026-09-08-role-catalog.md` (Wolf Cub, dòng "Nếu Wolf Cub
bị giết, đêm hôm sau bầy sói được cắn thêm 1 mạng", nguồn: review Father Geek đã dùng cho toàn
bộ Tier 1). **Trạng thái trước iteration này:** `blocked` trong
`2026-09-08-roles-epic-roadmap.md` — "cần một pass thiết kế engine riêng trước khi viết story"
vì toàn bộ pipeline đêm hiện tại giả định đúng 1 nạn nhân sói/đêm. Tài liệu này là chính pass
thiết kế đó, cộng story Wolf Cub viết ngay sau khi khả năng engine đã có chỗ đứng rõ ràng.

## 1. Vì sao đây là vấn đề engine, không phải vấn đề nguồn

Không giống Epic 1b/2b/3b (mơ hồ *lời văn*, cần rulebook gốc mới gỡ được), Wolf Cub có lời văn
đủ rõ để implement — vấn đề là **kiến trúc hiện tại không có chỗ để biểu diễn "đêm nay bầy sói
cắn 2 người thay vì 1"**:

- `resolveNight.ts`'s `ResolveNightInput.wolfTarget: string | null` — một trường, một giá trị.
- `resolveNight.ts`'s `tallyMajorityVote(votes): string | null` — trả về đúng 1 uid thắng cuộc
  hoặc `null` (hòa phiếu = "bầy không đồng thuận"), không có khái niệm "top-2".
- `planAdvance.ts` gọi cả hai với input/output số ít, không có chỗ nào mang state "đêm nay có
  phải đêm thưởng không" xuyên qua giữa 2 lần gọi `planAdvance()` (nó vốn là pure function,
  không có bộ nhớ giữa các lần gọi — state xuyên đêm phải sống ở tầng route/DB).

## 2. Thiết kế: tổng quát hoá sang "top-N nạn nhân/đêm"

### 2.1 `resolveNight.ts`

Đổi `wolfTarget: string | null` thành `wolfTargets: string[]` (0, 1, hoặc 2 phần tử tuỳ đêm).
Vòng lặp hiện có (bittenSurvives / isFirstCursedBite / deaths.add) chạy **độc lập cho từng
phần tử** — không có tương tác chéo giữa 2 nạn nhân (Bảo Vệ/Phù Thuỷ cứu chỉ áp dụng cho đúng
uid họ chọn, y hệt logic hiện tại, chỉ là chạy 2 lần thay vì 1):

```ts
export interface ResolveNightInput {
  wolfTargets: string[]; // 0-2 phần tử; xem tallyTopNVotes
  protectTarget: string | null;
  witchSaveTarget: string | null;
  witchPoisonTarget: string | null;
  cursedUids: string[];
  alreadyTransformedCursed: string[];
}

// bên trong resolveNight():
for (const wolfTarget of input.wolfTargets) {
  const bittenSurvives = wolfTarget === protectTarget || wolfTarget === witchSaveTarget;
  if (bittenSurvives) continue;
  const isFirstCursedBite =
    cursedUids.includes(wolfTarget) && !alreadyTransformedCursed.includes(wolfTarget);
  if (isFirstCursedBite) transformed.push(wolfTarget);
  else deaths.add(wolfTarget);
}
```

Gọi bình thường (không có Wolf Cub hoặc chưa kích hoạt đêm thưởng) truyền `wolfTargets` với 0
hoặc 1 phần tử — hành vi y hệt hiện tại, không có regression.

### 2.2 `tallyMajorityVote` → `tallyTopNVotes`

Thay vì viết thêm một hàm riêng, tổng quát hoá hàm hiện có:

```ts
export function tallyTopNVotes(votes: Record<string, string>, n: number): string[] {
  const counts = new Map<string, number>();
  for (const target of Object.values(votes)) {
    counts.set(target, (counts.get(target) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const result: string[] = [];
  for (let i = 0; i < n && i < sorted.length; i++) {
    const [target, count] = sorted[i];
    const nextCount = sorted[i + 1]?.[1];
    if (count === nextCount) break; // hòa ở vị trí cuối = dừng, giữ nguyên tinh thần cũ
    result.push(target);
  }
  return result;
}

export function tallyMajorityVote(votes: Record<string, string>): string | null {
  return tallyTopNVotes(votes, 1)[0] ?? null;
}
```

Giữ nguyên `tallyMajorityVote` như một helper mỏng gọi `tallyTopNVotes(votes, 1)` — mọi call
site hiện tại (`planAdvance.ts`, `advance/route.ts`'s "Leaving WOLVES" pendingWolfTarget) không
đổi. **Lưu ý tie-break khi n=2:** nếu #1 và #2 hòa phiếu, dừng ngay ở vị trí đó (giống hệt logic
hòa hiện tại ở n=1) — nghĩa là một đêm thưởng có thể vẫn chỉ cắn được 1 người nếu phiếu bầu
không đủ tách biệt. Đây không phải bug, là hệ quả tự nhiên của việc tái dùng đúng quy tắc hòa đã
có, không cần quy tắc mới.

**Quyết định thiết kế cần owner duyệt (#1):** bầy sói vẫn bỏ phiếu qua đúng 1 lượt WOLVES/đêm
với UI hiện tại (mỗi sói chọn 1 mục tiêu) — đêm thưởng lấy **top-2 của cùng một lượt phiếu**,
không phải mỗi sói chọn 2 mục tiêu riêng biệt. Bezier's board game vật lý để bầy sói tự thảo
luận chọn 2 nạn nhân trực tiếp; paraphrase nguồn không mô tả chi tiết cơ chế chọn 2 mục tiêu
trong 1 lượt tại bàn thật, nên quyết định này chọn giải pháp tái dùng UI/rule hiện có thay vì
thêm luồng "chọn 2 mục tiêu" mới — đơn giản hơn, ít rủi ro hơn, hành vi cuối cùng (bầy giết được
2 người trong đêm đó, hòa phiếu thì không) tương đương về bản chất.

### 2.3 `planAdvance.ts`

`PlanAdvanceInput.actions` thêm không cần đổi field (`wolfVotes` vẫn là `Record<string,string>`
như cũ). Thêm 1 field mới ở top-level input: `wolfCubBonusNightPending: boolean`. Trong nhánh
`next === "DAWN"`:

```ts
const n = input.wolfCubBonusNightPending ? 2 : 1;
const wolfTargets = tallyTopNVotes(input.actions.wolfVotes, n);
const nightResult = resolveNight({ wolfTargets, ... });
```

### 2.4 State xuyên đêm: `games/{gameId}/wolfCubBonusNightPending`

`planAdvance()` là pure, không giữ state giữa 2 lần gọi — cờ "đêm mai là đêm thưởng" phải sống ở
`Game` (public state, xem lý do public bên dưới) và được set/đọc/xoá ở tầng route
(`advance/route.ts`), đúng pattern đã dùng cho `lastProtectedUid`/potions:

- **Set:** ngay sau khi `decision` tính xong (DAWN hoặc VOTE_RESULT), nếu
  `deathsThisRoundRoles` (đã có sẵn trong `planAdvance`, cần export ra `PlanAdvanceResult` — xem
  §2.5) chứa `WOLF_CUB`, route ghi `updates['games/{gameId}/wolfCubBonusNightPending'] = true`.
- **Đọc:** route đọc `game.wolfCubBonusNightPending` (đã có sẵn trong `game` snapshot đầu hàm)
  và truyền vào `planAdvance()` mỗi lần gọi.
- **Xoá:** ngay khi rời phase WOLVES của đêm thưởng đó (route đã có block "Leaving WOLVES" ở
  dòng ~249) — set lại `false`, bất kể đêm đó có cắn được 2 người thật hay chỉ 1 (do hòa phiếu).
  Tiêu thụ đúng 1 lần, không cộng dồn nếu 2 Wolf Cub cùng tồn tại (không xảy ra — role đơn, xem
  §3) hoặc nếu route bị gọi lại nhiều lần cho cùng version (idempotency guard hiện có đã chặn
  double-processing).

**Quyết định thiết kế cần owner duyệt (#2 — công khai cờ này):** `wolfCubBonusNightPending` nằm
ở `games/{gameId}` (đọc được bởi mọi client đã auth, giống `lastProtectedUid`/`dayNumber`), NHÔNG
đọc riêng lẻ nào của trường này tiết lộ vai trò ai — nó chỉ nói "đêm nay bầy sói cắn 2 thay vì 1",
và việc Wolf Cub đã chết vốn đã public từ trước đó (`players/{uid}/alive = false`). Không vi phạm
nguyên tắc "không tiết lộ vai trò" (spec §4.6) vì bản thân trường không map ngược lại uid nào là
Wolf Cub.

**Quyết định thiết kế cần owner duyệt (#3 — điều kiện kích hoạt):** cờ được set khi Wolf Cub có
mặt trong `deathsThisRoundRoles` của **bất kỳ** resolution nào (đêm — sói cắn/Phù Thuỷ đầu độc —
hoặc treo cổ ban ngày), không giới hạn "chỉ chết vì bị sói cắn". Lời văn nguồn ("nếu Wolf Cub bị
giết") không giới hạn cách chết, và không có câu hỏi trạng thái xuyên đêm nào cần làm rõ thêm
(khác với Tough Guy/Diseased/Old Hag ở Epic 1b, nơi câu hỏi "Phù Thuỷ có cứu được không"/"Bảo Vệ
có chặn được không" thực sự thay đổi kết quả) — vì vậy đây được xếp là một diễn giải hợp lý theo
đúng phạm vi lời văn đã có, không phải một suy đoán ngoài phạm vi nguồn, nhưng vẫn ghi rõ ở đây
để owner có thể bác nếu có bản rulebook gốc nói khác.

### 2.5 `PlanAdvanceResult` cần thêm `deathsThisRoundRoles`

`planAdvance()` hiện tính `deathsThisRoundRoles: RoleKey[]` nội bộ (dùng cho `checkWinner`) rồi
bỏ đi — route không nhìn thấy nó. Thêm field này vào `PlanAdvanceResult` để route đọc được (thay
vì route tự tính lại từ `decision.deaths` + `aliveRolesByUid`, vốn cũng khả thi nhưng trùng lặp
logic — dùng lại giá trị `planAdvance` đã tính sẵn gọn hơn).

## 3. Vai trò Wolf Cub trong bảng dữ liệu

- `RoleKey`: thêm `"WOLF_CUB"`.
- `FACTION_BY_ROLE.WOLF_CUB = "WOLF"`.
- `SEER_SEES_AS_WOLF`: **có** `WOLF_CUB` (đọc là Sói khi bị Tiên Tri soi — khác Wolf Man, đây là
  một Sói thật, không phải biến thể "đọc nhầm là Dân").
- `PACK_VISIBLE_ROLES` (`isPackVisible`): **có** `WOLF_CUB` — xuất hiện trong `packUids` của
  đồng đội và ngược lại, giống Werewolf/Wolf Man.
- `requiredActorsForPhase`'s nhánh `WOLVES`: mở rộng điều kiện thành
  `role === "WEREWOLF" || role === "WOLF_MAN" || role === "WOLF_CUB"` — Wolf Cub thức dậy và bỏ
  phiếu cùng bầy mỗi đêm y hệt Werewolf, không có phase riêng.
- `database.rules.json`: mở rộng 2 rule đã có `|| role === WOLF_MAN` (action `WOLVES` write, chat
  `wolves` read/write) thêm `|| role === WOLF_CUB`, đúng pattern Wolf Man đã dùng.
- `GameScreen.tsx`'s `isWolfFaction` client-side gate: thêm `WOLF_CUB` (bài học từ Wolf Man —
  đừng bỏ sót điểm này lần nữa).
- `OPTIONAL_ROLE_KEYS` (types/room.ts): thêm `WOLF_CUB`, theo đúng vị trí trước `TANNER` như mọi
  vai optional gần đây — capacity-overflow ở n=16 tiếp tục là hệ quả đã biết, không cần thiết kế
  gì thêm (cập nhật capacity test là đủ, xem bài học iteration 6/7/10/13).
- `ROLE_LABELS.WOLF_CUB` = **"Sói Con"** (dịch trực tiếp "Wolf Cub", tự nhiên trong tiếng Việt,
  đúng tinh thần labels.ts hiện có — không cần narration riêng, dùng chung
  `DAWN_DEATHS_PREFIX`/`DAWN_NO_DEATHS` hiện có vì số lượng nạn nhân đêm đó vốn đã hiển thị qua
  `count`, không cần câu thoại riêng cho "đêm thưởng").

## 4. Given/When/Then

**AC1 — đêm thường không đổi hành vi.** Given không có Wolf Cub trong ván hoặc Wolf Cub còn
sống, When bầy sói rời phase WOLVES, Then `resolveNight` nhận `wolfTargets` với tối đa 1 phần tử
— hành vi giống hệt trước khi có thay đổi này (regression test bắt buộc: mọi test hiện có của
`resolveNight`/`tallyMajorityVote`/`planAdvance` phải xanh nguyên trạng sau khi đổi chữ ký hàm).

**AC2 — Wolf Cub chết kích hoạt đêm thưởng.** Given Wolf Cub bị giết ở bất kỳ resolution nào
(đêm hoặc treo cổ), When resolution đó xử lý xong, Then
`games/{gameId}/wolfCubBonusNightPending` được set `true`.

**AC3 — đêm thưởng cắn 2 mạng.** Given `wolfCubBonusNightPending === true`, When bầy sói rời
phase WOLVES đêm tiếp theo với phiếu bầu đủ tách biệt (không hòa ở vị trí #2), Then cả 2 mục
tiêu có phiếu cao nhất đều được xử lý qua `resolveNight` độc lập (có thể 1 hoặc cả 2 sống sót
nếu được Bảo Vệ/Phù Thuỷ cứu, y hệt logic 1-nạn-nhân hiện tại áp dụng riêng từng người).

**AC4 — cờ tiêu thụ đúng 1 lần.** Given đêm thưởng đã xử lý xong (dù cắn được 2 hay chỉ 1 do
hòa phiếu), When phase rời khỏi WOLVES, Then `wolfCubBonusNightPending` trở lại `false` và đêm
kế tiếp là đêm thường (1 nạn nhân) trừ khi một Wolf Cub khác lại chết (không thể — chỉ 1 Wolf Cub
mỗi ván, vai optional không nhân bản).

**AC5 — Wolf Cub tham gia WOLVES như Werewolf.** Given Wolf Cub còn sống, When phase WOLVES bắt
đầu, Then `requiredActorsForPhase("WOLVES", ...)` bao gồm uid của Wolf Cub, và phase chỉ kết
thúc sớm khi mọi Werewolf + Wolf Man + Wolf Cub còn sống đã bỏ phiếu.

**AC6 — Tiên Tri soi Wolf Cub ra Sói.** Given Tiên Tri soi Wolf Cub, When kết quả được ghi vào
`hints`, Then `result === "WOLF"`.

## 5. File cần đổi (implementation, chưa làm ở iteration này)

- `src/lib/game/resolveNight.ts` — `wolfTarget` → `wolfTargets`, vòng lặp, `tallyTopNVotes` mới.
- `src/lib/game/planAdvance.ts` — input mới `wolfCubBonusNightPending`, gọi `tallyTopNVotes`,
  export `deathsThisRoundRoles` trong `PlanAdvanceResult`.
- `src/lib/game/resolveNight.test.ts`, `planAdvance.test.ts` — test cho n=1 (regression) và n=2
  (đêm thưởng, có/không hòa phiếu ở vị trí #2, tương tác với Bảo Vệ/Phù Thuỷ trên từng nạn nhân
  riêng).
- `src/types/game.ts` — `RoleKey` thêm `WOLF_CUB`, `FACTION_BY_ROLE`, `SEER_SEES_AS_WOLF`,
  `PACK_VISIBLE_ROLES`, `Game.wolfCubBonusNightPending?: boolean`.
- `src/types/room.ts` — `OPTIONAL_ROLE_KEYS` thêm `WOLF_CUB`.
- `src/lib/game/requiredActors.ts` — nhánh `WOLVES` thêm `|| role === "WOLF_CUB"`.
- `src/lib/game/labels.ts` — `ROLE_LABELS.WOLF_CUB = "Sói Con"`.
- `src/app/api/games/[gameId]/advance/route.ts` — đọc `game.wolfCubBonusNightPending` vào
  `planAdvance()`; sau khi có `decision`, set cờ `true` nếu `WOLF_CUB` nằm trong
  `decision.deathsThisRoundRoles` (DAWN hoặc VOTE_RESULT); xoá cờ (`false`) trong block "Leaving
  WOLVES" hiện có.
- `database.rules.json` — 2 rule (`actions/$gameId/WOLVES/$uid/.write`,
  `chat/$gameId/wolves` read + `$msgId/.write`) thêm `|| role === WOLF_CUB`; validate
  `games/$gameId/wolfCubBonusNightPending` schema (boolean, optional) nếu file dùng
  `.validate`/`hasChildren` cho `Game` — kiểm tra pattern hiện có trước khi thêm, không tự bịa
  cấu trúc mới nếu repo không strict-validate mọi field public.
- `src/components/GameScreen.tsx` — `isWolfFaction` thêm `WOLF_CUB`.
- Test fixtures: mọi `Record<OptionalRoleKey,...>` (roles.test.ts, rules.test.ts x4,
  gameFlowEndToEnd.test.ts, multiClientGame.test.ts) + capacity test ở n=16 (5 vai optional giờ
  miss slot: Pacifist, Sorcerer, Wolf Man, Wolf Cub, Tanner).
- Route-level test mới: Wolf Cub chết ở DAWN → `wolfCubBonusNightPending=true` → đêm sau WOLVES
  với đủ phiếu tách biệt → 2 người chết ở DAWN kế tiếp → cờ về `false`.
- Emulator test mới (`rulesGames.test.ts`): Wolf Cub có thể ghi action `WOLVES` và chat `wolves`,
  giống Wolf Man.

## 6. Rủi ro/điều cần xác nhận trước khi implement

1. **#1/#2/#3 ở trên** là 3 quyết định thiết kế chưa có trong lời văn nguồn từng câu — cần owner
   duyệt trước khi coi story này "an toàn để code", theo đúng tinh thần deviation của Prince
   (Epic 1, story 1.2) chứ không tự ý coi là hiển nhiên.
2. Đổi chữ ký `resolveNight`/`tallyMajorityVote` là **breaking change nội bộ** — mọi call site
   hiện có (`planAdvance.ts`, `advance/route.ts`'s dòng 252 `pendingWolfTarget`) phải cập nhật
   cùng lúc trong 1 commit, không tách nhỏ, để tránh trạng thái build lỗi giữa chừng.
3. **Đã xác nhận (đọc trực tiếp `resolveDeathExtras.ts` ở iteration này), không còn là rủi ro
   mở:** `applyLoverDeaths`/`applyHunterRevenge`/`applyDeathExtras` đều nhận và trả về
   `deaths: string[]` không giới hạn độ dài — không có giả định "tối đa 1 người chết đêm nay" ở
   đâu trong 3 hàm này (chúng vốn đã phải xử lý danh sách nhiều người ngay cả hiện tại, vì cắn +
   đầu độc Phù Thuỷ cùng đêm đã là 2 nạn nhân độc lập từ trước). Đêm thưởng 2-nạn-nhân của Wolf
   Cub không cần đổi gì ở tầng này.

## 7. Kết luận

Epic 3c chuyển từ `blocked — cần thiết kế engine` sang `story ready — chờ owner duyệt 3 quyết
định thiết kế ở §2`. Không giống Epic 1b/2b/3b (chờ nguồn ngoài, không tự gỡ được), việc chặn ở
đây đã được gỡ hoàn toàn bằng thiết kế nội bộ — bước tiếp theo là implement theo đúng danh sách
file ở §5, sau khi (hoặc song song, ghi rõ là giả định chờ duyệt) xác nhận 3 quyết định thiết kế.
