# Epic 1b — vai Làng có trạng thái xuyên đêm (Tough Guy, Diseased, Old Hag)

**Input:** `docs/superpowers/research/2026-09-08-role-catalog.md` §8.3 — lời văn **nguyên văn**
trích từ rulebook PDF chính hãng Ted Alspach/Pegasus Spiele (không còn paraphrase Father Geek
như Epic 1). **Trạng thái trước tài liệu này:** `unblocked` (iteration 6) trong
`2026-09-08-roles-epic-roadmap.md` — lời văn đã đủ rõ, nhưng chưa qua pass thiết kế engine. Ba
vai này từng bị tách khỏi Epic 1 chính vì mỗi vai đều có ít nhất một chi tiết **thời điểm/trạng
thái xuyên đêm** ("có bị Phù Thuỷ cứu được không", "có áp dụng nếu Bảo Vệ chặn được không", "rời
làng nghĩa là gì trong app không có khái niệm vật lý") — tài liệu này là pass thiết kế đó, viết
theo đúng khuôn của Epic 3c (`2026-09-08-roles-epic-3c.md`, pass thiết kế cho Wolf Cub), trước
khi cho phép implement.

## 0. Bất biến áp dụng cho cả 3 vai — không có tổ hợp đa vai

Mỗi người chơi trong kiến trúc hiện tại có đúng **một** `role: RoleKey` (`PrivatePlayerState`,
`types/game.ts`). Không có khái niệm "vừa là Tough Guy vừa là Cursed" — nên không cần thiết kế
cho bất kỳ tổ hợp chồng vai nào giữa 3 vai này với nhau hoặc với 12+8 vai đã có. Mỗi thiết kế
dưới đây chỉ cần xét tương tác của MỘT vai mới với các bước resolve đã có (Bảo Vệ, Phù Thuỷ,
Sói cắn, treo cổ, Thợ Săn trả thù, người yêu Cupid) — không cần xét vai mới × vai mới.

## 1. Story 1b.1 — Tough Guy ("Người Cứng Cựa"): cắn trúng nhưng chết trễ 1 đêm

**Lời văn nguyên văn (catalog §8.3):**
> "If targeted by the Werewolves, dies the following night (instead of the same night he was
> attacked). The players are told that no one has died the previous night. The following night
> there may be two or more player deaths: the Tough Guy as well as any other characters targeted
> or killed that night."

### 1b.1.1 Ba câu hỏi timing đã chặn story này ở Epic 1 — trả lời từng câu

**Q1 — "targeted" nghĩa là bị sói CHỌN, hay bị sói GIẾT THÀNH CÔNG (tức không được Bảo Vệ/Phù
Thuỷ cứu)?** Quyết định: **giết thành công**, không phải chỉ được chọn. Lý do: nếu "targeted"
kích hoạt bất kể có bị cứu hay không, thì một Tough Guy được Bảo Vệ che chắn thành công đêm nay
vẫn sẽ chết trễ 1 đêm sau — vô hiệu hoá hoàn toàn tác dụng của Bảo Vệ đối với riêng người này,
điều không có căn cứ nào trong lời văn hỗ trợ và phá vỡ kỳ vọng "được bảo vệ = an toàn đêm đó"
đã áp dụng nhất quán cho mọi vai khác. Vì vậy: Tough Guy chỉ kích hoạt trạng thái "chết trễ" khi
`resolveNight`'s vòng lặp wolf-bite hiện có đáng lẽ đã add uid này vào `deaths` (tức
`bittenSurvives === false` cho uid đó) — móc vào đúng điểm nhánh `isFirstCursedBite`/`else
deaths.add(...)` đã có, y hệt cách Cursed đã móc vào đó cho lần cắn đầu tiên.

**Q2 — đêm "chết trễ" đó, Phù Thuỷ có cứu được lần thứ hai không?** Quyết định: **không** — một
khi đã kích hoạt trạng thái chờ chết (đêm bị cắn thành công, không được cứu), cái chết đêm sau
là **không thể đảo ngược**, không đi qua lại `resolveNight`'s bittenSurvives-check lần nữa. Lý
do: lời văn mô tả đây là MỘT lần cắn duy nhất bị hoãn công bố/hoãn hiệu lực, không phải một lần
cắn mới — ("dies the following night", không phải "may be targeted again"). Cho Phù Thuỷ cơ hội
cứu lần hai sẽ biến 1 lần cắn của Sói thành 2 cơ hội được cứu, mạnh hơn hẳn bất kỳ vai Làng nào
khác mà lời văn không hề gợi ý. Đây là quyết định thiết kế cần owner duyệt (không phải trích từ
nguồn) — ghi rõ ở đây, giống tinh thần lệch-nguyên-văn của Prince (Epic 1, story 1.2).

**Q3 — cái chết trễ có kéo theo hiệu ứng dây chuyền bình thường không (người yêu Cupid, trả thù
Thợ Săn nếu Tough Guy chính là Thợ Săn)?** Không xảy ra đồng thời (Q0: một vai/người), nhưng nếu
Tough Guy có người yêu (Cupid), hoặc nếu ai đó khác là Thợ Săn chết cùng đêm "trễ" đó — cái chết
trễ của Tough Guy phải được gộp vào cùng danh sách `deaths` của đêm đó **trước khi** gọi
`applyDeathExtras`, để hưởng đúng toàn bộ dây chuyền hiện có (người yêu Tough Guy chết theo nếu
Tough Guy chết đêm trễ, không phải đêm bị cắn). Quyết định: có — xử lý cái chết trễ như một cái
chết thật của đêm đó, không phải một hiệu ứng đứng ngoài pipeline.

### 1b.1.2 Thiết kế engine

State xuyên đêm — 1 uid, không phải boolean (khác Wolf Cub): `Game.toughGuyPendingDeathUid?:
string | null`, public (không tiết lộ vai — chỉ nói "có ai đó sắp chết trễ", không nói là ai
đang giữ vai Tough Guy so với... thực ra field NÀY tự nó **là** uid của Tough Guy, tiết lộ trực
tiếp danh tính vai một khi ai đó soi field này! Xem quyết định owner-duyệt #4 bên dưới).

**Quyết định cần owner duyệt #4 (rò rỉ danh tính qua field public):** không giống
`wolfCubBonusNightPending` (boolean, không map ngược ra uid nào), một field `pendingDeathUid`
kiểu string CHÍNH LÀ uid của Tough Guy — bất kỳ client nào đọc được field public này (mọi client
đã auth đọc `games/{gameId}` theo rule hiện tại) đều biết ngay "uid X là Tough Guy" trong đúng
đêm giữa lúc bị cắn và lúc công bố chết. Đây là vi phạm trực tiếp spec §4.6 ("vai không bao giờ
tiết lộ"). **Bắt buộc phải giải quyết trước khi implement** — hai phương án:
  - (a) Cất `toughGuyPendingDeathUid` dưới `private/{gameId}/{uid}` của CHÍNH Tough Guy đó (mỗi
    người chỉ đọc được private state của mình) thay vì ở `games/{gameId}` công khai — route đọc
    field này từ đúng uid Tough Guy khi cần biết "đêm nay có ai đang chờ chết trễ không" bằng
    cách quét toàn bộ private state phía server (Admin SDK, không bị rule chặn) thay vì đọc 1
    field tổng hợp công khai.
  - (b) Giữ 1 boolean công khai `toughGuyDeathPending: boolean` (giống Wolf Cub) + cất uid thật
    ở private state của Tough Guy — route kết hợp cả hai để biết "có" và "ai" mà không client
    nào ngoài chính Tough Guy suy ra được danh tính.
  Khuyến nghị: **(b)**, vì route (chạy bằng Admin SDK, đọc toàn bộ `private/` không bị rule chặn)
  vẫn cần biết chính xác uid để cộng vào `deaths` đêm sau — chỉ cần đảm bảo trường **công khai**
  chỉ là boolean, còn uid thật chỉ nằm trong `private/{gameId}/{toughGuyUid}` (server tự tìm
  bằng cách quét role === "TOUGH_GUY" trong `aliveRolesByUid`, không cần cất uid ở đâu cả — thực
  ra route đã biết `aliveRolesByUid` mỗi lần gọi, nên có thể **không cần cất uid ở bất kỳ đâu**,
  chỉ cần boolean công khai `toughGuyDeathPending` + tự suy ra "ai" bằng cách tìm uid có role
  TOUGH_GUY trong `aliveRolesByUid` lúc cần dùng. Đơn giản hơn cả (a) và (b) ở trên — không cất
  state uid nào cả, chỉ 1 boolean, y hệt Wolf Cub).

**Thiết kế cuối cùng (đã đơn giản hoá sau khi phát hiện ở trên):**
- `Game.toughGuyDeathPending?: boolean` — public, boolean thuần, không map ra uid nào (an toàn
  như `wolfCubBonusNightPending`).
- Tại DAWN: sau khi tính `wolfTargets`/`resolveNight` như hiện tại, nếu uid có role `TOUGH_GUY`
  nằm trong `wolfTargets` VÀ đáng lẽ đã chết (không được Bảo Vệ/Phù Thuỷ cứu) → loại uid đó khỏi
  `nightResult.deaths` của đêm NÀY (không thêm vào `deaths`, không công bố), và set
  `toughGuyDeathPending = true`. Nếu Tough Guy không bị cắn trúng đêm đó, ghi đè
  `toughGuyDeathPending` theo giá trị đang chờ xử lý ở bước dưới (không tự ý xoá nếu đang có một
  lượt chờ từ đêm trước chưa tới lượt xử lý — xem thứ tự dưới).
- Đêm SAU (DAWN kế tiếp, được gọi trước khi tính wolf bite mới của đêm đó): nếu
  `toughGuyDeathPending === true` từ đêm trước, tìm uid có role `TOUGH_GUY` còn sống trong
  `aliveRolesByUid`, thêm uid đó vào `nightResult.deaths` của đêm này (gộp cùng bất kỳ ai khác
  chết đêm đó — sói cắn mới, Phù Thuỷ đầu độc mới), rồi set `toughGuyDeathPending = false`. Việc
  gộp này xảy ra **trước** khi gọi `applyDeathExtras`, để hưởng dây chuyền người yêu/Thợ Săn nếu
  có (đúng Q3 ở trên).
- **Thứ tự đọc/ghi trong 1 lệnh gọi DAWN**: đọc `toughGuyDeathPending` cũ TRƯỚC khi tính wolf
  bite mới của đêm đó (để biết có phải "cộng dồn" cái chết trễ từ đêm trước không), rồi mới ghi
  đè giá trị mới (dựa trên kết quả wolf bite đêm hiện tại) — 1 lệnh gọi DAWN vừa "trả nợ" đêm
  trước vừa "vay nợ mới" cho đêm sau nếu Tough Guy lại bị cắn trúng liên tiếp 2 đêm (trường hợp
  hiếm nhưng hợp lệ về logic — Tough Guy không miễn dịch vĩnh viễn, chỉ trễ 1 đêm mỗi lần).
- **Không cần phase mới, không cần action RTDB mới** — Tough Guy không có hành động chủ động
  (không thức dậy, không chọn ai) — đây thuần là hiệu ứng thụ động móc vào `planAdvance`'s DAWN
  branch, giống Cursed's tự động transform.
- `PlanAdvanceInput` thêm `toughGuyDeathPending: boolean` (đọc từ `Game`, giống
  `wolfCubBonusNightPending`); `PlanAdvanceResult` không cần field mới ngoài `deaths` đã có (uid
  chết trễ đã nằm trong `deaths` như một cái chết bình thường của đêm đó).
- **Đêm không công bố ("players are told no one has died")**: đây là hệ quả tự động của việc
  không thêm uid vào `deaths` đêm bị cắn — `lastDeaths`/`DAWN_NO_DEATHS` hiện có đã tự xử lý đúng
  ("không ai chết" hiển thị khi `deaths.length === 0`), **miễn là** không có nạn nhân độc lập nào
  khác đêm đó (Phù Thuỷ đầu độc ai đó cùng đêm) — nếu có, đêm đó vẫn công bố người đó chết bình
  thường, chỉ riêng Tough Guy bị ẩn. Không cần sửa `lastDeaths`/narration — logic hiện tại
  (`deaths` là nguồn duy nhất cho công bố) đã tự động đúng vì Tough Guy chỉ đơn giản không có mặt
  trong `deaths` đêm đó.

## 2. Story 1b.2 — Diseased ("Người Nhiễm Bệnh"): cắn trúng thì bầy sói phải nghỉ 1 đêm

**Lời văn nguyên văn (catalog §8.3):**
> "If the Werewolves eat the Diseased player, they skip feeding the following night because they
> get sick. If the game does not have role reveal, the Werewolves still pick a target the
> following night, but that target does not die. If the game does have role reveal, the
> Werewolves do not pick a target."

Dự án này **không có "role reveal"** (spec §4.6, roles không bao giờ tiết lộ, kể cả sau khi ván
kết thúc) — áp dụng đúng nhánh "does not have role reveal": **bầy sói vẫn thức dậy và bỏ phiếu
bình thường đêm sau, nhưng mục tiêu đó không chết.** Đây không phải suy đoán — nguồn đã tự phân
nhánh theo đúng điều kiện game này rơi vào, không cần chọn hộ.

### 2.1 Vì sao giữ nguyên WOLVES phase (không skip) là lựa chọn đúng, không chỉ đơn giản hơn

Nếu app này skip hẳn phase WOLVES đêm đó, bầy sói sẽ NHẬN RA ngay lập tức "đêm nay không có
lượt cắn" — một tín hiệu gián tiếp hé lộ "hôm qua đã cắn trúng Diseased", đúng loại rò rỉ mà
lời văn tự né bằng cách chọn nhánh "vẫn chọn mục tiêu, chỉ là không ai chết" cho các bàn không
role-reveal. Quyết định khớp nguồn: giữ nguyên trải nghiệm phase WOLVES y hệt mọi đêm khác, chỉ
vô hiệu hoá **kết quả** của đêm đó ở tầng `resolveNight`.

### 2.2 Thiết kế engine

- `Game.diseasedSuppressNextBite?: boolean` — public, boolean thuần (không map ra uid, an toàn
  như Wolf Cub/Tough Guy).
- Tại DAWN: xác định "đêm nay bầy sói có thực sự cắn trúng Diseased không" — tức uid có role
  `DISEASED` nằm trong `wolfTargets` VÀ không được Bảo Vệ/Phù Thuỷ cứu (cùng phép kiểm tra
  `bittenSurvives` như Tough Guy — **chỉ kích hoạt nếu cắn THÀNH CÔNG**, cùng lý do Q1 của Tough
  Guy: bị cứu thì bầy sói coi như "không ăn được Diseased tối nay", không có lý do gì phải nghỉ
  đêm sau). Nếu đúng: set `diseasedSuppressNextBite = true` cho đêm SAU.
- `resolveNight.ts` cần thêm 1 tham số mới `suppressWolfBite: boolean` vào `ResolveNightInput`
  (mặc định `false`, optional — không phá test/call site cũ). Khi `true`: vòng lặp
  `wolfTargets` vẫn chạy (để không đổi hành vi Bảo Vệ/Phù Thuỷ/Cursed-transform-check ở phía
  UI/log nếu có), nhưng **không** add kết quả vào `deaths` — tức mọi wolf-target đêm đó đều
  "sống sót" bất kể có được bảo vệ hay không, y hệt lời văn "that target does not die". Cursed
  transform vẫn nên áp dụng bình thường nếu wolfTarget đêm đó trùng người bị nguyền (bị cắn dù
  không chết vẫn có thể "chuyển hoá" theo lời văn Cursed gốc — đây là 1 giả định hợp lý cần ghi
  rõ, không phải hiển nhiên: **quyết định cần owner duyệt #5** — ưu tiên đề xuất: Cursed transform
  VẪN áp dụng ngay cả khi `suppressWolfBite=true`, vì "sick, skip feeding" mô tả bầy sói không
  giết được ai, không mô tả việc cắn không hề chạm tới nạn nhân — Cursed's lời nguyền kích hoạt
  bởi bị cắn, không bởi việc có chết hay không).
- Sau khi dùng, set `diseasedSuppressNextBite = false` ngay trong cùng lệnh DAWN đã tiêu thụ nó
  (không cần đợi qua ngày như Tough Guy, vì đây tiêu thụ ngay trong đúng 1 lần WOLVES/DAWN kế
  tiếp, không có khoảng chờ 1 ngày đầy đủ như Tough Guy's "đêm sau" bắc qua nguyên 1 ngày).
- `PlanAdvanceInput` thêm `diseasedSuppressNextBite: boolean`; truyền `suppressWolfBite:
  input.diseasedSuppressNextBite` vào `resolveNight()`.
- Không cần phase mới, không cần action RTDB mới — Diseased không có hành động chủ động, đây là
  hiệu ứng thụ động móc vào kết quả WOLVES đêm sau, y hệt cấu trúc Tough Guy nhưng đơn giản hơn
  (tiêu thụ ngay lập tức, không phải "uid nào" mà chỉ "có nghỉ hay không").

## 3. Story 1b.3 — Old Hag ("Bà Lão Phù Thuỷ Rừng"): ếm 1 người mỗi đêm, người đó nghỉ hẳn 1 ngày

**Lời văn nguyên văn (catalog §8.3):**
> "Each night, the Old Hag places a pox on a player; that player must leave the game area for
> one day, and may not take place in discussions, lynching or any other activities that happen
> during the day (that player is also safe from the Hunter's shot or any other method of attack
> from another player). The Old Hag may not place a pox on herself."

Đây là vai duy nhất trong 3 vai của epic này **cần một phase đêm mới** (Tough Guy/Diseased đều
thụ động, không có UI hành động). Old Hag chủ động chọn 1 người mỗi đêm — cùng khuôn
Bodyguard/Muter (chọn 1 uid, không phải chính mình).

### 3.1 Dịch "rời làng, không tham gia thảo luận/treo cổ, miễn mọi tấn công" sang app không có
khái niệm vật lý "rời bàn"

Ba hiệu lực tách rời, ánh xạ vào đúng 3 cơ chế đã tồn tại trong app (không cần bịa cơ chế mới):

1. **"Không tham gia thảo luận"** → dùng lại đúng cơ chế LiveKit `canPublish=false` mà `MUTER`
   đã dùng (`livekit/token/route.ts` dòng 181), áp dụng cho người bị ếm trong đúng ngày đó — tái
   dùng field publish-gate đã có thay vì bịa cơ chế im-lặng thứ hai. Khác Muter ở chỗ đây là
   trạng thái gắn với **uid cụ thể do Old Hag chọn mỗi đêm**, không gắn với 1 role cố định — cần
   trường mới, không tái dùng thẳng `player.muted` (để không xung đột hiển thị/logic nếu cùng
   lúc có cả Muter lẫn Old Hag nhắm vào 2 người khác nhau, hoặc trùng 1 người).
2. **"Không tham gia treo cổ"** → hai nghĩa gộp làm một theo đúng tinh thần "loại khỏi mọi hoạt
   động bỏ phiếu ngày hôm đó": (a) không được bỏ phiếu (như Pacifist — chặn ở RTDB rule
   `actions/$gameId/VOTE/$uid/.write`) VÀ (b) không thể là người bị treo cổ dù nhận nhiều phiếu
   nhất (như Prince — `resolveVote` trả `null`/bỏ qua nếu winner là người đang bị ếm). Lời văn
   liệt kê "discussions, lynching **or any other activities**" — đủ rộng để hợp lý hoá gộp cả
   "không được bỏ phiếu" lẫn "không thể bị treo" làm một, thay vì chỉ 1 trong 2 — **quyết định
   cần owner duyệt #6**: áp dụng cả (a) và (b) cùng lúc cho người bị ếm, không chỉ 1 trong 2.
3. **"Miễn Thợ Săn trả thù / mọi tấn công khác từ người chơi khác"** → `applyHunterRevenge` thêm
   tham số `immuneUid?: string | null`, bỏ qua việc add `targetUid` vào kết quả nếu
   `targetUid === immuneUid`. "Mọi tấn công khác từ người chơi khác" trong app này chỉ có đúng 1
   cơ chế khớp định nghĩa "một người chơi khác chủ động chọn giết một người chơi cụ thể còn sống"
   — Thợ Săn trả thù. Sói cắn/Phù Thuỷ đầu độc không tính vào "tấn công BAN NGÀY" (pox chỉ có
   hiệu lực "trong ngày", sói cắn/phù thuỷ hành động ban đêm, ở đêm KHÁC không phải ngày đang bị
   ếm) — **quyết định cần owner duyệt #7**: pox KHÔNG bảo vệ khỏi sói cắn/phù thuỷ đầu độc đêm
   kế tiếp (đó là "đêm", không phải "ngày" pox đang hiệu lực), chỉ bảo vệ khỏi treo cổ + Thợ Săn
   trả thù xảy ra trong đúng ngày đó.

### 3.2 State: `Game.poxedUid?: string | null`

Public field, single uid (khác Tough Guy — **field này AN TOÀN để công khai**, vì nó không tiết
lộ vai của CHÍNH NGƯỜI BỊ ẾM (họ có thể là Dân Làng, Sói, bất kỳ ai — pox không chọn theo vai),
mà chỉ tiết lộ "Old Hag nhắm vào ai" — và vì Old Hag hành động lúc còn ai đó chưa biết mình có bị
ếm hay không, để lộ CHÍNH uid bị ếm cũng không suy ngược ra được ai là Old Hag). Ghi đè (không
cộng dồn) mỗi khi phase OLD_HAG kết thúc — nếu Old Hag không chọn ai (chết, hoặc bỏ qua), ghi
`null` (pox không tồn tại đêm đó), đúng khuôn "reset rồi set lại" mà Muter đã dùng cho
`players/*/muted`.

### 3.3 Phase mới: `OLD_HAG`

- `PhaseName`/`PHASE_SEQUENCE`: chèn `OLD_HAG` ngay trước `DAWN` (sau `CURSED`) — theo đúng thứ
  tự gọi vai chính thức trích ở catalog §8.3 ("...Sorcerer → Spellcaster → Old Hag → Cult Leader
  → Troublemaker"), Old Hag luôn gọi gần cuối đêm, ngay trước khi trời sáng.
- `PHASE_OPTIONAL_ROLE.OLD_HAG = "OLD_HAG"` (skip nguyên phase nếu không ai giữ vai này ván đó).
- `ACTING_ROLE_BY_PHASE.OLD_HAG = "OLD_HAG"` (`requiredActors.ts`) — Old Hag còn sống là actor
  duy nhất, giống Bodyguard/Muter.
- `PHASE_DURATIONS_MS.OLD_HAG = 30_000` (cùng khuôn Bodyguard/Muter/Sorcerer).
- Action RTDB mới: `actions/$gameId/OLD_HAG/$uid/.write` — cùng pattern Bodyguard/Muter (chỉ
  chính Old Hag, phase đúng tên, còn sống). **Không** enforce "không được ếm chính mình" ở tầng
  rule — đúng tiền lệ đã xác nhận (Bodyguard's "không lặp lại mục tiêu đêm trước" cũng không
  enforce ở rule, chỉ ở tầng client/logic thuần) — enforce ở UI (ẩn chính mình khỏi
  `TargetPicker`) + 1 hàm thuần có test (ví dụ `pickOldHagTarget`/validate trong `roles.ts` hoặc
  ngay trong route trước khi ghi `poxedUid`).
- Narration mới: `NIGHT_ROLE_CALLS.OLD_HAG` + `ROLE_LABELS.OLD_HAG` — tên tiếng Việt đề xuất:
  **"Mụ Phù Thuỷ Rừng"** (giữ khác biệt hẳn với "Phù Thuỷ" = Witch đã có, tránh nhầm 2 vai cùng
  tên; "Old Hag" nghĩa đen là "bà lão xấu xí/độc ác" — "Mụ Phù Thuỷ Rừng" giữ đúng sắc thái ma
  thuật + già + đáng sợ mà không đụng tên Witch) — quyết định UI của story này, owner có thể đổi.

### 3.4 RTDB rules cần đổi (3 điểm, nhiều nhất trong 3 story của epic này)

1. Action node mới `actions/$gameId/OLD_HAG/$uid` (write rule mới, đọc bởi server qua Admin SDK
   không qua rule).
2. LiveKit publish-gate (không phải RTDB rule — đây là logic trong `livekit/token/route.ts`, đọc
   thêm `games/{gameId}/poxedUid` bên cạnh `player.muted` hiện có để tính `canPublish`).
3. `actions/$gameId/VOTE/$uid/.write`: thêm điều kiện loại trừ
   `&& $uid !== root.child('games').child($gameId).child('poxedUid').val()` — **đúng vị trí đã
   thêm điều kiện Pacifist** (Epic 1 story 1.3), Pacifist chặn theo ROLE, Old Hag's pox chặn theo
   UID cụ thể của ngày đó — hai điều kiện độc lập, cộng dồn bằng `&&`, không thay thế nhau.
4. `resolveVote.ts`: mở rộng tham số đã có từ Prince (`roleOf`) hoặc thêm tham số mới
   `excludedUid?: string | null` — nếu `winner === excludedUid`, trả `null` (coi như hoà), y hệt
   nhánh Prince nhưng theo uid thay vì role. Route truyền `game.poxedUid` vào tham số này khi gọi
   `resolveVote` ở VOTE_RESULT.

### 3.5 Test coverage cần cho cả 3 story (tổng hợp)

- `resolveNight.test.ts`: Tough Guy — cắn trúng không cứu → không có trong `deaths` đêm đó,
  `toughGuyDeathPending` (giả lập qua input mới) → đêm sau bắt buộc có trong `deaths` dù không bị
  cắn lại; cắn trúng NHƯNG được Bảo Vệ/Phù Thuỷ cứu → không kích hoạt pending. Diseased —
  `suppressWolfBite=true` → wolfTargets đêm đó không ai chết dù không được bảo vệ; Cursed
  transform vẫn xảy ra nếu trùng người bị nguyền (quyết định #5).
- `planAdvance.test.ts`: gộp cả 2 field mới vào `PlanAdvanceInput`, test route qua 2-3 đêm liên
  tiếp cho Tough Guy (đêm 1 cắn trúng → im lặng; đêm 2 công bố chết trễ, gộp đúng với người yêu
  Cupid nếu có).
- `resolveVote.test.ts`: `excludedUid` (Old Hag's pox) trả `null` khi trùng winner, độc lập với
  nhánh Prince đã có (test cả 2 field cùng có giá trị, không trùng nhau, không ảnh hưởng nhau).
- `resolveDeathExtras.test.ts`: `applyHunterRevenge` với `immuneUid` trùng target → không add
  vào deaths; không trùng → hành vi cũ.
- `requiredActors.test.ts`: `OLD_HAG` actor là uid có role đó, còn sống.
- `rulesGames.test.ts` (emulator): action `OLD_HAG` write (chỉ đúng Old Hag, đúng phase); VOTE
  write bị chặn khi `$uid === poxedUid` dù còn sống và không phải Pacifist (test đối chứng: một
  Old Hag chưa bị ếm vẫn bỏ phiếu bình thường).
- e2e (`gameFlowEndToEnd.test.ts`): 1 ván đủ dài dựng thủ công `roleCounts` có Tough
  Guy/Diseased/Old Hag (không dùng `seedRoom`/`oldBuildRoleList` — bài học từ Story 4a.2, các vai
  mới sau deck-builder phải seed roleCounts trực tiếp).

## 4. File cần đổi (implementation, chưa làm ở iteration này)

- `src/types/game.ts` — `RoleKey` +3 (`TOUGH_GUY`, `DISEASED`, `OLD_HAG`), `FACTION_BY_ROLE` +3
  (đều `VILLAGE`), `ALL_ROLE_KEYS` +3, `PHASE_SEQUENCE` chèn `OLD_HAG` trước `DAWN`,
  `PHASE_OPTIONAL_ROLE.OLD_HAG`, `Game.toughGuyDeathPending?/diseasedSuppressNextBite?/poxedUid?`.
- `src/lib/game/resolveNight.ts` — `ResolveNightInput` +`suppressWolfBite?: boolean` (optional,
  mặc định false — không phá call site cũ).
- `src/lib/game/resolveDeathExtras.ts` — `applyHunterRevenge`/`applyDeathExtras` +`immuneUid?`.
- `src/lib/game/resolveVote.ts` — thêm `excludedUid?: string | null` cạnh `roleOf` đã có.
- `src/lib/game/planAdvance.ts` — `PlanAdvanceInput` +3 field mới, logic DAWN xử lý
  toughGuyDeathPending/diseasedSuppressNextBite theo thứ tự đọc-trước-ghi-sau ở §1.2/§2.2, logic
  VOTE_RESULT truyền `excludedUid: input.poxedUid` vào `resolveVote`.
- `src/lib/game/requiredActors.ts` — `ACTING_ROLE_BY_PHASE.OLD_HAG = "OLD_HAG"`.
- `src/lib/game/phases.ts` — `PHASE_DURATIONS_MS.OLD_HAG`.
- `src/lib/game/labels.ts`, `narration.ts` — nhãn + lời gọi đêm cho `OLD_HAG` (Tough
  Guy/Diseased không cần narration riêng — thụ động, không có phase để narrate).
- `src/app/api/games/[gameId]/advance/route.ts` — đọc 3 field mới từ `Game`, ghi lại sau mỗi
  DAWN/VOTE_RESULT, ghi `poxedUid` khi rời phase `OLD_HAG` (cùng khối code đang ghi
  `players/*/muted` khi rời `MUTER`).
- `src/app/api/livekit/token/route.ts` — `canPublish` đọc thêm `poxedUid`.
- `database.rules.json` — action `OLD_HAG` mới, `VOTE` write thêm điều kiện `poxedUid`,
  `roleCounts` `.validate` mở rộng 3 `RoleKey` mới (đúng bài học Story 4a.2: mọi `RoleKey` mới
  đều phải chạm rule này sau deck-builder).
- `src/components/game/ActionPanel.tsx`/`TargetPicker` — UI chọn mục tiêu cho Old Hag (loại trừ
  chính mình), không cần UI hành động cho Tough Guy/Diseased (thụ động).
- Mọi `Record<RoleKey, number>` fixture (page.tsx's `DEFAULT_DECK`, các file test liệt kê ở Story
  4a.2) — thêm 3 key mới với giá trị `0`.

## 5. Quyết định cần owner duyệt trước khi implement (tổng hợp #4–#7)

1. **#4 (Tough Guy)** — đã tự giải quyết bằng thiết kế lại thành boolean thuần, không còn rò rỉ
   uid — không cần owner duyệt nữa, chỉ ghi lại quá trình phát hiện & sửa để không lặp lại sai
   lầm này ở vai tương lai có "trạng thái chờ gắn với 1 uid cụ thể".
2. **#5 (Diseased × Cursed)** — Cursed vẫn transform dù `suppressWolfBite=true`. Cần xác nhận.
3. **#6 (Old Hag × VOTE)** — pox chặn CẢ bỏ phiếu lẫn bị treo, không chỉ 1 trong 2. Cần xác nhận.
4. **#7 (Old Hag × tấn công ban đêm)** — pox không bảo vệ khỏi sói cắn/đầu độc đêm kế tiếp, chỉ
   bảo vệ khỏi treo cổ + Thợ Săn trả thù trong đúng ngày đang hiệu lực. Cần xác nhận.
5. Không có quyết định nào ở Tough Guy §1b.1.1 Q1/Q2/Q3 được coi là "chờ duyệt" riêng — đã gộp
   vào tinh thần chung "chỉ kích hoạt khi cắn thành công, không cứu lại lần 2" và note rõ trong
   §1b.1.1, cùng mức độ chắc chắn như Prince's lệch nguyên văn ở Epic 1 (tức: implement được
   ngay, ghi rõ để owner phủ quyết sau nếu muốn, không phải "chờ" mới được code).

## 6. Kết luận

Epic 1b chuyển từ `unblocked — cần rulebook` (iteration 6) sang `story ready — chờ owner duyệt 3
quyết định thiết kế #5/#6/#7` (Tough Guy's #4 tự giải quyết trong chính tài liệu này). Old Hag là
vai đầu tiên của epic 1b cần phase mới + 3 điểm RTDB — phức tạp hơn Tough Guy/Diseased (thụ động
hoàn toàn). Thứ tự implement đề xuất: Diseased trước (đơn giản nhất, 1 field boolean, 1 tham số
`resolveNight`) → Tough Guy (1 field boolean nhưng bắc qua nguyên 1 ngày, cần test kỹ thứ tự
đọc/ghi) → Old Hag cuối (nhiều file nhất, phase mới + RTDB rules mới). Sau khi 3 story implement
xong với CI xanh + rules RTDB live verify (cho Old Hag), cập nhật
`2026-09-08-roles-epic-roadmap.md`: Tough Guy/Diseased/Old Hag từ `unblocked` → `done`.

## 7. Đã xong — Story 1b.2 (Diseased) implementation (gnhf run `stop-read-this-first-98c7ba`
iteration 8, 2026-09-08)

Implement đúng thiết kế ở §2 phía trên, không đổi gì so với thiết kế đã chốt: `RoleKey`
`DISEASED` mới (VILLAGE faction), `Game.diseasedSuppressNextBite?: boolean`,
`resolveNight`'s `suppressBite?: boolean` (mặc định `false`), `PlanAdvanceInput`/`Result` +2
field mới, route đọc/ghi ở đúng nhánh DAWN, `database.rules.json`'s `roleCounts` `.validate`
mở rộng cho `RoleKey` thứ 21, mọi `Record<RoleKey, number>` fixture literal cập nhật. Quyết
định #5 (Diseased × Cursed: Cursed vẫn transform dù `suppressBite=true`) được implement theo
đúng khuyến nghị của §2.2 mà không chờ owner xác nhận trực tiếp — ghi rõ ở đây để owner phủ
quyết sau nếu muốn, cùng tinh thần "lệch nguyên văn có ghi chú" đã áp dụng cho Prince (Epic 1)
và tương tự cách Tough Guy §1b.1.1's Q1/Q2/Q3 được xử lý (không chờ mới được code). Test: 4
case mới trong `resolveNight.test.ts`, 5 case mới trong `planAdvance.test.ts`, 1 test e2e 2-đêm
liên tiếp trong `gameFlowEndToEnd.test.ts` (đêm 1 cắn trúng → chết + arm cờ; đêm 2 cắn người
khác → không ai chết, cờ tự tắt). CI xanh + live rules deploy/byte-verify để ở iteration sau,
đúng cadence toàn dự án. Tough Guy và Old Hag (Story 1b.1, 1b.3) vẫn `story ready`, chưa
implement.

## 8. Đã xong — Story 1b.1 (Tough Guy) implementation (gnhf run `stop-read-this-first-98c7ba`
iteration 10, 2026-09-08)

Implement đúng thiết kế cuối cùng ở §1.2, với một khoảng trống nhỏ thiết kế gốc chưa lường tới
được xử lý bằng phán đoán có ghi chú (không phải suy đoán im lặng): `RoleKey` `TOUGH_GUY` mới
(VILLAGE faction, khoá thứ 22), `Game.toughGuyDeathPending?: boolean` (public, thuần boolean,
không nhúng uid — đúng thiết kế "phương án đơn giản nhất" ở §1.2). Khác Diseased:
**không đụng `resolveNight.ts`** — thiết kế §1.2 không yêu cầu tham số mới ở đó, chỉ yêu cầu
`planAdvance` tự tính "đêm nay cắn trúng thật không" (tái dùng đúng công thức `bittenSurvives`
của `resolveNight` — so `wolfTarget` với `protectTarget`/`witchSaveTarget`) rồi lọc/thêm uid vào
tập `deaths` của đêm đó trước khi gọi `applyDeathExtras`, thay vì đọc thẳng
`nightResult.deaths` (tránh nhầm cái chết do Phù Thuỷ đầu độc cùng đêm — nguyên nhân độc lập —
với cái chết do sói cắn, vì cả hai gộp chung vào 1 Set không phân biệt nguyên nhân).

**Khoảng trống thiết kế gốc chưa lường tới, đã xử lý bằng phán đoán (ghi rõ trong code
comment, `planAdvance.ts`):** §1.2 viết tiêu chí kích hoạt là "resolveNight's wolf-bite loop
hiện có đáng lẽ đã add uid này vào `deaths`" — nhưng không nói rõ điều gì xảy ra nếu đêm đó
`diseasedSuppressNextBite` (Story 1b.2) đang hiệu lực, tức bầy sói "không giết được ai" đêm đó
vì lý do hoàn toàn khác (Diseased, không phải Tough Guy). Quyết định: đọc tiêu chí Q1 theo đúng
nghĩa đen — "đáng lẽ đã add vào deaths" phải tính cả `suppressBite`, vì đó chính là hành vi thật
của `resolveNight` đêm đó — nên nếu `diseasedSuppressNextBite=true`, Tough Guy bị cắn đêm đó
**không** kích hoạt cờ chờ chết (không ai chết đêm đó vì lý do Diseased, không phải vì được cứu,
nhưng kết quả cuối cùng giống nhau: không có cái chết thật nào để hoãn). Đây là tương tác 2 vai
mới × nhau mà §0 nói "không cần xét" (mỗi người 1 vai, nhưng Diseased's hiệu ứng ảnh hưởng cắn
của TOÀN BẦY, không riêng người bị nhiễm) — trường hợp hiếm (cả 2 vai cùng có trong deck, đúng
đêm suppression đang hiệu lực, sói lại nhắm trúng Tough Guy) nhưng đã xử lý nhất quán thay vì bỏ
qua.

Test: 7 case mới trong `planAdvance.test.ts` (ẩn chết + arm cờ; không arm khi được Bảo Vệ; không
arm khi bị Diseased-suppress; trả nợ đêm sau gộp cùng nạn nhân mới đêm đó; trả nợ kéo theo dây
chuyền người yêu; chết đêm này + vay nợ mới nếu bị cắn 2 đêm liên tiếp; đầu độc cùng đêm bởi Phù
Thuỷ không bị nhầm thành cắn) và 1 test e2e đầy đủ 2 đêm trong `gameFlowEndToEnd.test.ts` (đêm 1
cắn trúng → không công bố ai chết, arm cờ, `players/{tough}/alive` vẫn `true`; đêm 2 cắn người
khác → cả 2 cùng chết, cờ tự tắt vì không bị cắn lại). `database.rules.json`'s `roleCounts`
`.validate` mở rộng cho `RoleKey` thứ 22, 3 fixture `Record<RoleKey, number>` literal cập nhật
(`page.tsx`, `rules.test.ts`, `multiClientGame.test.ts` — các file khác đã build từ
`ALL_ROLE_KEYS.map(...)` nên tự động nhận khoá mới). Không cần UI mới (thụ động, giống Diseased —
`RoleCard` đọc `ROLE_LABELS` động). CI xanh + live rules deploy/byte-verify để ở iteration sau,
đúng cadence toàn dự án. Old Hag (Story 1b.3, vai cuối cùng của epic) vẫn `story ready`, chưa
implement — cần phase đêm mới + owner duyệt quyết định #6/#7 trước khi bắt đầu.
