# Lộ trình mở rộng bộ vai — sơ đồ epic (2026-09-08)

**Input:** `docs/superpowers/research/2026-09-08-role-catalog.md` (Task 1 — danh mục vai có
nguồn, đã đóng vòng nghiên cứu web thông thường). Tài liệu này là bước "plan" theo đúng thứ tự
owner yêu cầu: nghiên cứu → **lập epic/story** → mới implement.

**Vì sao không chạy `bmad-create-epics-and-stories` nguyên bản:** skill đó là một workflow
step-file *tương tác* (`.claude/skills/bmad-create-epics-and-stories/steps/step-01-*.md`),
bắt buộc dừng ở menu chờ người dùng chọn `[C]` sau mỗi bước, và đòi hỏi input là
`{planning_artifacts}/*prd*.md` + `*architecture*.md` (theo `_bmad/bmm/config.yaml`,
`planning_artifacts: docs/planning` — thư mục này chưa từng được dùng, dự án này luôn dùng
`docs/superpowers/{specs,plans,research}` thay vào đó, kể cả trước khi có epic vai). gnhf chạy
không có người ngồi trả lời menu, nên chạy skill nguyên bản sẽ treo ngay ở bước 1. Quyết định:
giữ đúng **tinh thần** BMAD (Epic → Story với Given/When/Then AC, epics-template.md) nhưng viết
trực tiếp vào `docs/superpowers/plans/` theo đúng định dạng Task-based mà
`2026-09-07-game-engine.md` và `2026-09-07-resilience.md` đã dùng — đây chính là "matching how
the rest of this project was planned" mà owner yêu cầu, vì đó là cách toàn bộ phần còn lại của
dự án *thực sự* được lập kế hoạch (không phải qua hội thoại BMAD tương tác).

## Phạm vi thực tế đã xác nhận (catalog §7)

Tổng chính thức: **141 vai** trên toàn bộ dòng Ultimate Werewolf. Sau 2 phiên nghiên cứu,
**~52/141 vai có nguồn đủ tin cậy** để lập epic/story (Tier 1 + Tier 2 của catalog); **94/141
vai (Bonus Roles + Pro Roles) không tìm được tên riêng lẻ qua tìm kiếm web thông thường** sau
>15 nguồn khác nhau — đây là kết luận đã kiểm chứng, không phải giả định. Roadmap dưới đây vì
vậy chia thành các epic **có thể lập story ngay** và các epic **treo lại chờ nguồn mới**, ghi
rõ ràng chứ không giấu.

## Sơ đồ epic

| Epic | Nội dung | Số vai | Trạng thái | Tài liệu |
|---|---|---|---|---|
| **Epic 1** | Vai Làng thụ động, không cần phase đêm mới (Mason, Prince, Pacifist) | 3 | **`done`** — cả 3 story CI xanh, merged vào main, rules RTDB live đã deploy và byte-compare khớp repo (2026-09-08) | `2026-09-08-roles-epic-1.md` |
| **Epic 1b** | Vai Làng thụ động nhưng cần thêm 1 vòng xác nhận cơ chế trước khi viết story an toàn (Tough Guy, Diseased, Old Hag — xem lý do treo ở cuối mục này) | 3 | Chưa viết story — cần làm rõ timing trước | chưa có |
| **Epic 2** | Vai Sói đồng minh cần phase đêm mới, cơ chế đủ rõ để viết story ngay (Sorcerer/Sorceress) | 1 | **`done`** — CI xanh (run 34219156728, commit 9395543, `typecheck`/`test`/`build` đều `success`), rules RTDB live đã deploy và byte-compare khớp repo (2026-09-08) | `2026-09-08-roles-epic-2.md` |
| **Epic 2b** | Vai có khái niệm rõ nhưng paraphrase để lại mơ hồ thời điểm/trạng thái xuyên đêm hoặc điều kiện thắng chính xác — cùng loại vấn đề đã chặn Epic 1b (Doppelgänger, Hoodlum) | 2 | Chưa viết story — cần rulebook gốc | chưa có |
| **Epic 3** | Vai Sói thật tham gia cắn cùng bầy WOLVES, cơ chế đủ rõ để viết story ngay (Wolf Man → "Lang Nhân") | 1 | **`done`** — CI xanh (run 34221621075, commit 62e1052, `typecheck`/`test`/`build` đều `success`, sau khi iteration 14 sửa 1 bug đếm quân trong test fixture của run trước đó bị fail), rules RTDB live đã deploy và byte-compare khớp repo (2026-09-08) | `2026-09-08-roles-epic-3.md` |
| **Epic 3b** | Vai Sói có khái niệm rõ nhưng paraphrase mơ hồ thời điểm xuyên đêm hoặc điều kiện thắng chính xác — cùng loại vấn đề đã chặn Epic 1b/2b (Dire Wolf, Lone Wolf) | 2 | Chưa viết story — cần rulebook gốc | chưa có |
| **Epic 3c** | Vai cần khả năng engine mới ("cắn 2 mạng/đêm", chưa có trong pipeline WOLVES/WITCH/resolveNight hiện tại) — Wolf Cub | 1 | **`code written, CI + live-rules-verification pending`** (2026-09-08, iteration 17) — implement xong theo doc, gồm 1 fix thiết kế thật (thời điểm xoá cờ) phát hiện lúc trace tay trước khi viết test | `2026-09-08-roles-epic-3c.md` |
| **Epic 4** | Vai cần rulebook gốc để phân biệt khỏi vai đã có, **không suy đoán** (Priest vs Bảo Vệ, Huntress vs Thợ Săn, Revealer vs Tiên Tri, Village Idiot, Drunk, Troublemaker, Insomniac, Apprentice Seer, Aura Seer, Paranormal Investigator, Beholder) | ~11 | **Chặn lại** — cần nghiên cứu thêm (không phải "thêm web search thông thường" nữa, xem catalog §6 mục 4) | chưa có |
| **Epic 5 (kiến trúc)** | Phe thứ 3 mới hoàn toàn — Vampire, Cult Leader (cần thiết kế điều kiện thắng + UI phe mới dùng chung trước khi có vai nào trong nhóm này implement được) | 2 | Chặn lại — cần một `bmad-architecture` pass riêng trước khi có story | chưa có |
| **Epic 6** | Tier 2 — Night Terrors, Urban Legends, Classic Movie Monsters (tên xác nhận, **lời văn năng lực chưa có nguồn chính hãng**) | ~14 | Chặn lại — cần nghiên cứu lại lời văn trước khi viết story (catalog §5, §6 mục 4) | chưa có |
| **Epic Z (cuối roadmap, không phải tier chờ implement)** | Bonus Roles (44) + Pro Roles (50+) | 94 | **Chặn vĩnh viễn cho tới khi có nguồn mới** — không lặp lại tìm kiếm web thông thường (catalog §1.1 kết luận) | chưa có |
| *Loại khỏi phạm vi* | Legacy (kiến trúc campaign 16 phiên), Artifacts (cơ chế item-overlay, không phải vai), Daybreak (thuộc One Night, khác kiến trúc), "Village" (không xác nhận tồn tại) | — | Không lập epic — ghi rõ lý do ở catalog §2 | — |

**Thứ tự triển khai đề xuất:** Epic 1 → Epic 2 → Epic 3 → Epic 1b/2b/3b (khi có nghiên cứu
rulebook giải quyết được mơ hồ) → (Epic 3c/Epic 4 sau khi có nghiên cứu/thiết kế engine mới) →
(Epic 5 sau khi có kiến trúc phe thứ 3) → (Epic 6 sau khi có lời văn Tier 2) → Epic Z chỉ khi
owner tự cung cấp nguồn mới (ảnh chụp thẻ bài vật lý, liên hệ Bezier Games). Đây đúng là thứ tự
"phổ biến nhất trước, hiếm nhất sau cùng" owner yêu cầu — vai càng rõ nguồn và càng đơn giản về
kiến trúc thì càng lên trước, không phải theo thứ tự bảng chữ cái hay theo độ khó code. Epic 2
(Sorcerer/Sorceress) và Epic 3 (Wolf Man) đứng trước Epic 1b/2b/3b vì đã có story sẵn sàng ngay,
trong khi các epic "b" vẫn đang chờ một nguồn rulebook mới chưa tìm ra.

### Vì sao Epic 2 chỉ còn 1/4 vai dự kiến ban đầu

Khi viết story chi tiết cho Epic 2 (`2026-09-08-roles-epic-2.md`), soi kỹ từng vai theo đúng
mức độ rà soát đã áp dụng cho Epic 1b phát hiện 3/4 vai gốc dự kiến ("cơ chế đã đủ rõ") thực ra
không đủ rõ: **Doppelgänger** và **Hoodlum** có cùng loại mơ hồ thời điểm/điều kiện xuyên đêm đã
chặn Tough Guy/Diseased/Old Hag lại (chuyển sang Epic 2b, cùng nhóm với Epic 1b về bản chất vấn
đề); **Cult Leader** không phải vấn đề mơ hồ mà là cần **phe thứ 3 mới hoàn toàn** giống hệt
Vampire — gộp vào Epic 5. Chỉ **Sorcerer/Sorceress** (paraphrase "soi ra ai là Tiên Tri" có đúng
một cách hiện thực hợp lý, tái dùng khuôn Tiên Tri có sẵn) đủ điều kiện viết story ngay. Bài học
lặp lại từ Epic 1b: một vai nghe "cơ chế rõ" ở mức liệt kê tên/khái niệm không có nghĩa là đủ rõ
để viết story an toàn — luôn cần soi từng vai riêng lẻ trước khi gộp vào một epic "sẵn sàng".

### Vì sao Epic 3 chỉ còn 1/4 vai dự kiến ban đầu

Cùng kỷ luật soi từng vai đã áp dụng cho Epic 1b và Epic 2: **Dire Wolf** ("số phận gắn với 1
bạn đồng hành, bạn đó chết thì Dire Wolf cũng chết") có mơ hồ thời điểm/điều kiện y hệt lớp vấn
đề đã chặn Epic 1b/2b (chết bằng cách nào tính, chọn bạn đồng hành lúc nào) — chuyển sang Epic
3b. **Lone Wolf** ("thắng riêng nếu là sói cuối cùng còn sống") có mơ hồ điều kiện thắng chính
xác (thắng ngay khi nào, ưu tiên thế nào so với thứ tự kiểm tra Tanner/Sói-team hiện có trong
`checkWinner.ts`) — cùng loại vấn đề đã chặn Hoodlum ở Epic 2b, chuyển sang Epic 3b. **Wolf
Cub** ("bị giết thì đêm sau bầy cắn thêm 1 mạng") không phải vấn đề mơ hồ mà là thiếu **khả
năng engine**: toàn bộ pipeline đêm hiện tại (`tallyMajorityVote`, `WITCH_SAVE`/`WITCH_KILL`,
`resolveNight.ts`, `checkWinner.ts`) giả định đúng 1 nạn nhân sói/đêm xuyên suốt — "cắn 2 mạng"
cần một pass thiết kế riêng, không phải chỉ thêm field mới; chuyển sang Epic 3c. Chi tiết đầy đủ
từng vai (bao gồm lý do loại một fan site không đáng tin làm nguồn cho Dire Wolf) ở
`2026-09-08-roles-epic-3.md`. Chỉ **Wolf Man** ("cắn cùng bầy nhưng Tiên Tri soi ra là dân") đủ
rõ để viết story ngay — tổ hợp 2 cơ chế đã có sẵn (tham gia WOLVES như Werewolf, đọc-là-Dân khi
bị soi như cách Traitor đã hoạt động), không cần bịa chi tiết nào.

### Vì sao Epic 1b bị tách khỏi Epic 1 thay vì gộp chung

Tough Guy ("sống thêm 1 ngày sau khi bị sói cắn"), Diseased ("sói cắn trúng thì đêm sau sói
phải nhịn"), Old Hag ("chỉ định 1 người phải rời làng hôm sau") đều xuất hiện ở catalog Tier 1
(tên + khái niệm đã xác nhận), nhưng cả ba đều có một chi tiết **thời điểm/trạng thái xuyên
đêm** mà đoạn paraphrase từ review Father Geek không đủ rõ để code chính xác mà không đoán:
Tough Guy có bị Phù Thuỷ cứu được ở đêm "sống thêm" đó không? Diseased có áp dụng nếu Bảo Vệ đã
che chắn thành công không (tức sói không cắn trúng)? Old Hag "rời làng" nghĩa là chết, là mất
quyền bỏ phiếu, hay gì khác trong một app không có khái niệm vật lý "rời bàn"? Theo đúng quy
tắc sourcing của owner ("không suy đoán, ghi biết tên chưa xác nhận lời văn rồi bỏ qua"), ba vai
này **không đủ điều kiện để viết story an toàn ngay bây giờ** — tách thành Epic 1b, cần một
vòng xác nhận thêm (ưu tiên: tìm rulebook PDF gốc; nếu không có, hỏi owner có bản vật lý nào để
đọc thẳng lời thẻ bài không) trước khi viết story, thay vì implement theo phỏng đoán.

## Bảng theo dõi tiến độ theo vai (dùng thay sprint-status vì dự án chưa có sprint-status.yaml)

Dự án này chưa dùng `bmad-sprint-planning`'s `sprint-status-template.yaml` ở đâu khác (không có
tiền lệ) — theo đúng gợi ý của owner ("nếu chưa có gì, catalog doc từ Task 1 đóng vai trò
tracker"), bảng dưới đây là tracker chính thức, cập nhật mỗi khi một vai đổi trạng thái. Chỉ
liệt kê vai đã có epic xác định (không lặp lại toàn bộ ~141 vai — xem catalog cho danh sách đầy
đủ).

| Vai | Epic | Trạng thái |
|---|---|---|
| Mason | 1 | `done` — CI xanh (run 34215788171, commit 6c6e469), merged vào main |
| Prince | 1 | `done` — CI xanh (run trên commit 7917ac9, `typecheck`/`test`/`build` đều `success`), merged vào main |
| Pacifist | 1 | `done` — CI xanh (run 34216872017, commit 85c9299, `typecheck`/`test`/`build` đều `success`), merged vào main. Rules RTDB live đã deploy (`firebase deploy --only database --project werewolf-game-2026`, 2026-09-08) và byte-compare khớp 100% với `database.rules.json` trong repo (`firebase database:get /.settings/rules` sau deploy diff rỗng) |
| Tough Guy | 1b | `blocked` — cần xác nhận timing |
| Diseased | 1b | `blocked` — cần xác nhận timing |
| Old Hag | 1b | `blocked` — cần xác nhận khái niệm "rời làng" |
| Sorcerer/Sorceress ("Pháp Sư") | 2 | `done` — CI xanh (run 34219156728, commit 9395543, `typecheck`/`test`/`build` đều `success`), merged vào main. Rules RTDB live đã deploy (`firebase deploy --only database --project werewolf-game-2026`, 2026-09-08) và byte-compare khớp 100% với `database.rules.json` trong repo (node action `SORCERER` xác nhận có mặt sau deploy, diff chỉ lệch newline cuối file) |
| Doppelgänger, Hoodlum | 2b | `blocked` — cần rulebook gốc (mơ hồ thời điểm/điều kiện thắng xuyên đêm) |
| Wolf Man ("Lang Nhân") | 3 | `done` — CI xanh (run 34221621075, commit 62e1052, `typecheck`/`test`/`build` đều `success`; commit gốc d82648a từng fail 1 test do lỗi đếm quân trong fixture, sửa ở iteration 14). Rules RTDB live đã deploy (`firebase deploy --only database --project werewolf-game-2026`, 2026-09-08) và byte-compare khớp 100% với `database.rules.json` trong repo (2 rule WOLVES/wolves-chat mở rộng `WOLF_MAN` xác nhận có mặt sau deploy) |
| Dire Wolf, Lone Wolf | 3b | `blocked` — cần rulebook gốc (mơ hồ thời điểm bạn đồng hành / điều kiện thắng chính xác) |
| Wolf Cub | 3c | `code written, CI + live-rules-verification pending` (2026-09-08, iteration 17) — `resolveNight`/`tallyMajorityVote` tổng quát hoá sang `tallyTopNVotes`/`wolfTargets: string[]`, `planAdvance` nhận `wolfCubBonusNightPending` + trả `deathsThisRoundRoles`, route đọc/set cờ đúng 2 điểm DAWN/VOTE_RESULT (KHÔNG ở "Leaving WOLVES" như thiết kế gốc — xem fix bug bên dưới), `database.rules.json` mở rộng rule WOLVES + wolves-chat, full test coverage (unit + route-level e2e + emulator rules) |
| Priest, Huntress, Revealer, Village Idiot, Drunk, Troublemaker, Insomniac, Apprentice Seer, Aura Seer, Paranormal Investigator, Beholder | 4 | `blocked` — cần rulebook gốc |
| Vampire, Cult Leader | 5 | `blocked` — cần kiến trúc phe thứ 3 |
| Thing, The Count, Beholder*, Insomniac*, Bogeyman, vai thứ 6 chưa rõ (Night Terrors); Bloody Mary, Chupacabra, Wolf Man*, Leprechaun, Sasquatch, Nostradamus (Urban Legends); The Blob, The Mummy, Dracula, The Zombie, Frankenstein's Monster (Classic Movie Monsters) | 6 | `blocked` — cần lời văn năng lực |
| Bonus Roles (44), Pro Roles (50+) | Z | `blocked` — cần nguồn mới ngoài web search |

\* Beholder/Insomniac/Wolf Man xuất hiện ở cả Tier 1 (review Extreme) lẫn tên expansion gốc
(Night Terrors/Urban Legends) trong catalog — xếp epic theo lần xuất hiện đầu (Epic 4/3), không
lặp lại ở Epic 6.

## Phán đoán "có thể không bao giờ hoàn thành 100%" (điều khoản dừng của run này)

Nêu thẳng theo đúng yêu cầu owner: với tổng 141 vai chính thức, **94 vai (Bonus + Pro Roles,
~67% tổng số) đã được xác nhận qua 2 phiên nghiên cứu độc lập là không thể lập story có nguồn
đúng chuẩn "canonical Bezier Games" bằng công cụ tìm kiếm web hiện có.** Đây không phải rủi ro
giả định — là kết luận đã kiểm chứng (catalog §1.1, §6, §7). Nghĩa là roadmap này, nếu chỉ dùng
tìm kiếm web, **sẽ dừng tự nhiên ở khoảng 52/141 vai (Epic 1–6) chứ không bao giờ chạm mốc
141/141**, trừ khi owner tự cung cấp một nguồn khác hẳn (ảnh chụp thẻ bài vật lý mua về, hoặc
liên hệ trực tiếp Bezier Games xin rulebook). Epic Z ghi nhận đúng thực trạng này thay vì âm
thầm bỏ qua — quyết định có coi 52/141 là đủ để "xong" epic mở rộng vai, hay tiếp tục đầu tư vào
việc lấy nguồn cho 94 vai còn lại, **là của owner**, không tự ý chọn ở đây.

Điều này KHÔNG có nghĩa là dừng toàn bộ epic mở rộng vai ngay bây giờ — Epic 1 (3 vai) và Epic 2
(1 vai) đều đã `done`, và Epic 3 (1 vai, Wolf Man) có đường đi rõ ràng không cần nguồn mới, story
đã viết xong. Epic 1b, Epic 2b, Epic 3b (7 vai) hiện đang chờ một nguồn rulebook mới, và Epic 3c
(1 vai, Wolf Cub) chờ một pass thiết kế engine riêng — không tự tin nói "không cần nguồn/thiết kế
mới" cho các epic này nữa như bản roadmap trước đã ghi nhầm cho toàn bộ Epic 3. "Không bao giờ
hoàn thành 100%" áp dụng chắc chắn cho Epic Z (94 vai), và có thể áp dụng cho Epic 1b/2b/3b nếu
không tìm ra rulebook gốc — tất cả cần owner theo dõi, không chỉ Epic Z.

## Việc tiếp theo sau tài liệu này

1. Implement Epic 1 (3 story trong `2026-09-08-roles-epic-1.md`), mỗi story một commit riêng,
   build+test trước mỗi commit, verify CI xanh + (nếu có RTDB rules mới) verify rules deploy
   thật trên Firebase live, không chỉ emulator — đúng bài học đã ghi trong
   `2026-09-07-resilience.md`. **Xong (2026-09-08)**, xem `2026-09-08-roles-epic-1.md`.
2. Implement Epic 2 (story 2.1, Sorcerer/Sorceress → "Pháp Sư", trong
   `2026-09-08-roles-epic-2.md`) — vai đầu tiên cần một phase đêm mới và một node action RTDB
   mới; deploy + verify rules live sau khi CI xanh, cùng bài học Pacifist. **Xong (2026-09-08)**,
   xem `2026-09-08-roles-epic-2.md` và tracker ở trên (CI run 34219156728, rules RTDB live đã
   deploy và byte-compare khớp repo).
3. Epic 3 đã qua bước soi từng vai (iteration 12, áp dụng đúng bài học Epic 1b/2b): chỉ Wolf Man
   đủ rõ để viết story, đã viết xong (`2026-09-08-roles-epic-3.md`, story 3.1). Dire Wolf/Lone
   Wolf tách sang Epic 3b (cần rulebook gốc), Wolf Cub tách sang Epic 3c (cần thiết kế engine
   "cắn 2 mạng/đêm"). **Code viết xong (iteration 13, 2026-09-08)**: 4 điểm lọc-theo-role mở
   rộng đúng như story doc (`RoleKey`/`FACTION_BY_ROLE`, `requiredActors.ts`'s nhánh WOLVES,
   `advance/route.ts`'s rebuild pack sau Cursed, 2 rule `database.rules.json`), cộng 1 điểm story
   doc bỏ sót phát hiện khi soi code: `GameScreen.tsx`'s `isWolfFaction` (gate hiển thị UI chat
   Sói ở client) cũng cần thêm `|| role === "WOLF_MAN"`, nếu không Wolf Man sẽ không thấy được
   kênh chat Sói dù rule RTDB đã cho phép ghi/đọc — đã sửa cùng lúc. Test mới: unit
   (`requiredActors.test.ts`, `seerCheck.test.ts`), route-level (2 test mới trong
   `gameFlowEndToEnd.test.ts` — chờ đủ 2 actor mới rời phase WOLVES, và pack rebuild sau Cursed
   giữ Wolf Man), emulator (`rulesGames.test.ts` — action WOLVES và chat wolves cho Wolf Man).
   **Xong (2026-09-08)**: commit gốc (d82648a, iteration 13) fail 1 test do lỗi đếm quân trong
   fixture "Cursed pack rebuild" (4 Sói vs chỉ 3 dân còn sống kích hoạt thắng sớm của phe Sói
   trước khi test kịp assert phase DAWN) — sửa ở iteration 14 (commit 62e1052, thêm 2 dân vào
   fixture để khôi phục tỉ lệ 4-vs-5), CI xanh (run 34221621075), rules RTDB live đã deploy và
   byte-compare khớp repo. Epic 3 giờ là `done`.
4. Song song hoặc xen kẽ, có thể thử tìm lại rulebook gốc để gỡ chặn Epic 1b/2b/3b (7 vai) nếu
   có thời gian, nhưng implement Wolf Man không cần chờ việc đó.
5. **Đã sửa (iteration 15, 2026-09-08)**: nợ kỹ thuật phát hiện khi soi code cho Epic 3 (xem
   `2026-09-08-roles-epic-3.md` mục "Ghi chú nợ kỹ thuật") xác nhận đúng là bug thật —
   `start/route.ts`'s `wolfFactionUids` dùng filter generic theo `FACTION_BY_ROLE`, cấp
   `packUids` cho Sorcerer lúc ván bắt đầu dù story 2.1 đã quyết định Sorcerer không nên có.
   Sửa bằng hàm dùng chung `isPackVisible()` (mới, `types/game.ts`) thay cho cả filter generic
   ở `start/route.ts` lẫn danh sách hardcode ở `advance/route.ts`'s rebuild-pack-sau-Cursed —
   một nguồn sự thật duy nhất thay vì 2 chỗ có thể lệch nhau. Test mới bằng `callStart` thật
   trong `gameFlowEndToEnd.test.ts` xác nhận Sorcerer không có `packUids` sau khi ván bắt đầu.
6. Trước khi viết story cho bất kỳ epic nào sau Epic 3, tiếp tục áp dụng đúng bài học đã lặp lại
   3 lần (Epic 1b, Epic 2, Epic 3): soi kỹ paraphrase từng vai riêng lẻ để phát hiện mơ hồ thời
   điểm/trạng thái/điều kiện thắng — hoặc thiếu khả năng engine — trước khi coi cả epic là
   "story ready".
7. Cập nhật bảng theo dõi tiến độ ở trên mỗi khi một vai đổi trạng thái.
8. **Xong (iteration 16, 2026-09-08)**: pass thiết kế engine cho Epic 3c (Wolf Cub, "cắn 2
   mạng/đêm") — `2026-09-08-roles-epic-3c.md`. Tổng quát hoá `resolveNight`/`tallyMajorityVote`
   sang top-N nạn nhân/đêm (n=1 mặc định, n=2 khi có cờ đêm thưởng), thêm state xuyên đêm
   `games/{gameId}/wolfCubBonusNightPending` set/đọc/xoá ở tầng route (planAdvance vẫn pure).
   Xác nhận `resolveDeathExtras.ts` đã generic sẵn theo mảng, không cần đổi. 3 quyết định thiết
   kế chưa có trong lời văn nguồn được ghi rõ trong doc (điều kiện kích hoạt = chết bất kỳ cách
   nào; cờ đêm thưởng public nhưng không lộ vai; đêm thưởng lấy top-2 của cùng 1 lượt phiếu thay
   vì cho mỗi sói chọn 2 mục tiêu) — theo đúng tiền lệ deviation của Prince (Epic 1, story 1.2):
   ghi rõ để owner review qua git history, không chặn việc implement chờ trả lời trực tiếp (run
   này không tương tác được với owner giữa chừng). Epic 3c chuyển từ `blocked` sang
   `story ready`. Việc tiếp theo: implement theo danh sách file ở mục 5 của
   `2026-09-08-roles-epic-3c.md` — chưa làm ở iteration 16 để giữ mỗi iteration là 1 đơn vị công
   việc nhỏ, độc lập review được (design pass riêng, implementation riêng), đúng tinh thần Epic 1
   viết story 1 iteration rồi implement iteration sau.
9. **Xong (iteration 17, 2026-09-08)**: implement Epic 3c (Wolf Cub, "Sói Con") end-to-end theo
   danh sách file ở mục 5 của `2026-09-08-roles-epic-3c.md`. **Phát hiện và sửa 1 bug thiết kế
   thật** trước khi viết code (không phải sau khi CI fail): bản thiết kế gốc định xoá cờ
   `wolfCubBonusNightPending` ở block "Leaving WOLVES" — sai, vì Witch luôn có mặt trong mọi ván
   thật nên `WITCH_SAVE`/`WITCH_KILL` luôn nằm giữa `WOLVES` và `DAWN`, nghĩa là cờ sẽ bị xoá
   `false` ở một lần gọi `advance()` SỚM HƠN lần gọi thực sự tính `resolveNight` — đêm thưởng sẽ
   không bao giờ kích hoạt được trong một ván thật. Phát hiện bằng cách trace tay toàn bộ chuỗi
   `advance()` một đêm đầy đủ trước khi viết test route-level, đúng khuyến nghị "viết route-level
   test trước khi coi story xong" ở mục 5 của story doc. Sửa: chỉ chạm cờ ở đúng 2 điểm
   `decision.nextPhase === "DAWN"` (ghi đè không điều kiện — vừa tiêu thụ giá trị cũ vừa tái kích
   hoạt nếu Wolf Cub chết đêm đó) và `"VOTE_RESULT"` (chỉ được phép set `true`, không bao giờ xoá
   — nếu không sẽ vô tình xoá cờ DAWN vừa set trước khi đêm tiếp theo kịp dùng). Đã cập nhật
   `2026-09-08-roles-epic-3c.md` §2.4/§5 ghi rõ bug + fix. Route-level test mới trong
   `gameFlowEndToEnd.test.ts` chạy trọn 2 đêm + 1 ngày qua route thật, xác nhận: đêm thường 1
   nạn nhân → Wolf Cub chết (poison) → cờ `true` → 1 lần VOTE_RESULT không đụng Wolf Cub (không
   bị xoá cờ) → đêm thưởng cắn đúng 2 nạn nhân (phiếu 2-1 tách biệt) → cờ về `false`. Cũng thêm
   test emulator (Wolf Cub ghi được action WOLVES + chat wolves) và cập nhật mọi fixture
   `Record<OptionalRoleKey,...>` + capacity test ở n=16 (giờ 5 vai miss slot: Pacifist, Sorcerer,
   Wolf Man, Wolf Cub, Tanner). Epic 3c chuyển từ `story ready` sang
   `code written, CI + live-rules-verification pending`. Việc tiếp theo: xác nhận CI xanh rồi
   `firebase deploy --only database` + byte-compare, đúng pattern đã dùng cho Epic 1/2/3.

   **Gap phát hiện nhưng chưa sửa (out of scope cho iteration này, để không phình to đổi thay
   một iteration):** `advance/route.ts`'s "Leaving WOLVES" block viết `pendingWolfTarget` cho
   Witch bằng `tallyMajorityVote(wolfVotes)` (luôn n=1), không đổi theo cờ đêm thưởng — nghĩa là
   vào đúng đêm thưởng (2 nạn nhân), Witch's `WITCH_SAVE` UI chỉ thấy được 1 trong 2 mục tiêu
   (mục tiêu có phiếu cao nhất), không có cách nào thấy/cứu mục tiêu còn lại dù cô ấy chỉ có 1
   bình cứu cho cả đêm nên hệ quả thực tế nhỏ (không đổi được kết quả nếu cô ấy vẫn muốn cứu
   đúng mục tiêu top-1). Vẫn là một gap UI thật, giống pattern bug Sorcerer packUids ở Epic 2/3
   (phát hiện ở iteration 12, sửa ở iteration 15) — nên xử lý như một fix riêng, không phải một
   phần bắt buộc để coi Epic 3c "xong".
