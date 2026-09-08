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
| **Epic 1b** | Vai Làng có trạng thái xuyên đêm (Tough Guy, Diseased, Old Hag — xem lý do treo ở cuối mục này) | 3 | Story 1b.2 (Diseased): **implemented in code** (2026-09-08, iteration 8) — CI/live-verify còn ở iteration sau; Tough Guy/Old Hag: `story ready`, chưa implement | `2026-09-08-roles-epic-1b.md` |
| **Epic 2** | Vai Sói đồng minh cần phase đêm mới, cơ chế đủ rõ để viết story ngay (Sorcerer/Sorceress) | 1 | **`done`** — CI xanh (run 34219156728, commit 9395543, `typecheck`/`test`/`build` đều `success`), rules RTDB live đã deploy và byte-compare khớp repo (2026-09-08) | `2026-09-08-roles-epic-2.md` |
| **Epic 2b** | Vai có khái niệm rõ nhưng paraphrase để lại mơ hồ thời điểm/trạng thái xuyên đêm hoặc điều kiện thắng chính xác — cùng loại vấn đề đã chặn Epic 1b (Doppelgänger, Hoodlum) | 2 | Chưa viết story — cần rulebook gốc | chưa có |
| **Epic 3** | Vai Sói thật tham gia cắn cùng bầy WOLVES, cơ chế đủ rõ để viết story ngay (Wolf Man → "Lang Nhân") | 1 | **`done`** — CI xanh (run 34221621075, commit 62e1052, `typecheck`/`test`/`build` đều `success`, sau khi iteration 14 sửa 1 bug đếm quân trong test fixture của run trước đó bị fail), rules RTDB live đã deploy và byte-compare khớp repo (2026-09-08) | `2026-09-08-roles-epic-3.md` |
| **Epic 3b** | Vai Sói có khái niệm rõ nhưng paraphrase mơ hồ thời điểm xuyên đêm hoặc điều kiện thắng chính xác — cùng loại vấn đề đã chặn Epic 1b/2b (Dire Wolf, Lone Wolf) | 2 | Chưa viết story — cần rulebook gốc | chưa có |
| **Epic 3c** | Vai cần khả năng engine mới ("cắn 2 mạng/đêm", chưa có trong pipeline WOLVES/WITCH/resolveNight hiện tại) — Wolf Cub | 1 | **`done`** — CI xanh (run 34224670711, commit e1deedd, `typecheck`/`test`/`build` đều `success`), rules RTDB live đã deploy và byte-compare khớp repo (2026-09-08, iteration 18) | `2026-09-08-roles-epic-3c.md` |
| **Epic 4a** | Vai Làng thụ động/sửa VOTE, soi riêng từ Epic 4 và đủ rõ để viết story ngay (Village Idiot, Beholder) — cùng khuôn kiến trúc Epic 1 (Prince/Pacifist/Mason) | 2 | **`done`** — Story 4a.1 (Village Idiot): CI xanh (run 34227270895, commit 96d1a72), rules RTDB live deploy + byte-compare khớp repo (2026-09-08, iteration 22); Story 4a.2 (Beholder): CI xanh (run 34258090368, commit c60aa5c), rules RTDB live deploy + byte-compare khớp repo (2026-09-08, iteration 5) — cả 2 story trong epic đều `done` | `2026-09-08-roles-epic-4.md` |
| **Epic 4b** | Phần còn lại của Epic 4 sau khi soi riêng: Priest, Huntress, Revealer, Aura Seer (trùng/xung đột vai đã có, không có lời văn phân biệt); Drunk, Apprentice Seer (mơ hồ thời điểm, cùng lớp 1b/2b/3b); Troublemaker (thiếu khả năng engine + thiếu lời văn, cùng lớp 3c); Insomniac (khái niệm "hàng xóm" không tồn tại trong kiến trúc hiện tại) | 9 | **Chặn lại** — cần nghiên cứu thêm, 4 loại lý do khác nhau (xem `2026-09-08-roles-epic-4.md` bảng soi từng vai) | `2026-09-08-roles-epic-4.md` |
| **Epic 5** | Phe thứ 3 mới — Vampire, Cult Leader. **Kiến trúc đã xong (2026-09-08, iteration 19)**: pass thiết kế xác nhận template "1 phase đêm cho 1 vai đơn lẻ" đã tồn tại sẵn (Sorcerer đã chứng minh), `checkWinner` chỉ cần thêm 1 branch mới (không refactor), "đổi phe hiệu lực" đã có tiền lệ ngầm từ Cursed. Không có gì bị chặn ở tầng kỹ thuật nữa. | 2 | Chặn lại — **đổi lý do sang "cần nguồn"**: Vampire thiếu hoàn toàn lời văn điều kiện thắng; Cult Leader thiếu chi tiết cơ chế xuyên đêm (cùng lớp mơ hồ Epic 1b/2b/3b) | `2026-09-08-roles-epic-5.md` |
| **Epic 6** | Tier 2 — Night Terrors, Urban Legends, Classic Movie Monsters (tên xác nhận, **lời văn năng lực chưa có nguồn chính hãng**) | ~14 | Chặn lại — cần nghiên cứu lại lời văn trước khi viết story (catalog §5, §6 mục 4) | chưa có |
| **Epic Z (cuối roadmap, không phải tier chờ implement)** | Bonus Roles (44) + Pro Roles (50+) | 94 | **Chặn vĩnh viễn cho tới khi có nguồn mới** — không lặp lại tìm kiếm web thông thường (catalog §1.1 kết luận) | chưa có |
| *Loại khỏi phạm vi* | Legacy (kiến trúc campaign 16 phiên), Artifacts (cơ chế item-overlay, không phải vai), Daybreak (thuộc One Night, khác kiến trúc), "Village" (không xác nhận tồn tại) | — | Không lập epic — ghi rõ lý do ở catalog §2 | — |

**Thứ tự triển khai đề xuất:** Epic 1 → Epic 2 → Epic 3 → Epic 3c (đã `done`, 2026-09-08) →
Epic 4a (đã `done`, 2026-09-08 — cả Story 4a.1 Village Idiot và Story 4a.2 Beholder verify
xong CI + rules RTDB live) →
Epic 1b (story doc xong, 2026-09-08 iteration 7 — `story ready`, chờ owner duyệt rồi implement)
→ Epic 2b/3b/4b/5 (khi có story doc riêng — lời văn đã đủ từ iteration 6, chỉ còn thiếu pass
thiết kế engine như Epic 1b vừa làm) →
(Epic 6 sau khi có lời văn Tier 2) → Epic Z chỉ khi
owner tự cung cấp nguồn mới (ảnh chụp thẻ bài vật lý, liên hệ Bezier Games). Đây đúng là thứ tự
"phổ biến nhất trước, hiếm nhất sau cùng" owner yêu cầu — vai càng rõ nguồn và càng đơn giản về
kiến trúc thì càng lên trước, không phải theo thứ tự bảng chữ cái hay theo độ khó code. Epic 2
(Sorcerer/Sorceress) và Epic 3 (Wolf Man) đứng trước Epic 1b/2b/3b vì đã có story sẵn sàng ngay,
trong khi các epic "b" vẫn đang chờ một nguồn rulebook mới chưa tìm ra. Epic 5 chuyển từ nhóm
"chờ kiến trúc riêng" sang xếp cùng nhóm 1b/2b/3b/4 (chờ nguồn) kể từ khi kiến trúc phe thứ 3
được xác nhận là không cần pass riêng nữa (iteration 19, `2026-09-08-roles-epic-5.md`).

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
| Tough Guy | 1b | `story ready` (2026-09-08, iteration 7) — thiết kế "chết trễ 1 đêm" xong (`2026-09-08-roles-epic-1b.md` §1), chờ implement |
| Diseased | 1b | **implemented in code** (2026-09-08, iteration 8) — `diseasedSuppressNextBite`/`suppressBite` wired through planAdvance/resolveNight/advance route, unit + e2e tests added; CI green + live rules deploy still pending (deck-builder's `roleCounts` shape check also extended for the new `DISEASED` RoleKey, matching Story 4a.2's precedent) |
| Old Hag | 1b | `story ready` (2026-09-08, iteration 7) — thiết kế phase OLD_HAG + pox mới xong, cần owner duyệt 2 quyết định (#6/#7) trước implement (`2026-09-08-roles-epic-1b.md` §3) |
| Sorcerer/Sorceress ("Pháp Sư") | 2 | `done` — CI xanh (run 34219156728, commit 9395543, `typecheck`/`test`/`build` đều `success`), merged vào main. Rules RTDB live đã deploy (`firebase deploy --only database --project werewolf-game-2026`, 2026-09-08) và byte-compare khớp 100% với `database.rules.json` trong repo (node action `SORCERER` xác nhận có mặt sau deploy, diff chỉ lệch newline cuối file) |
| Doppelgänger, Hoodlum | 2b | `unblocked` (2026-09-08, iteration 6) — lời văn chính hãng đầy đủ tìm thấy cho cả 2 (catalog §8.3), sẵn sàng viết story |
| Wolf Man ("Lang Nhân") | 3 | `done` — CI xanh (run 34221621075, commit 62e1052, `typecheck`/`test`/`build` đều `success`; commit gốc d82648a từng fail 1 test do lỗi đếm quân trong fixture, sửa ở iteration 14). Rules RTDB live đã deploy (`firebase deploy --only database --project werewolf-game-2026`, 2026-09-08) và byte-compare khớp 100% với `database.rules.json` trong repo (2 rule WOLVES/wolves-chat mở rộng `WOLF_MAN` xác nhận có mặt sau deploy) |
| Lone Wolf | 3b | `unblocked` (2026-09-08, iteration 6) — lời văn chính hãng đầy đủ tìm thấy (catalog §8.3), sẵn sàng viết story |
| Dire Wolf | 3b | `blocked` — vẫn không tìm thấy trong PDF nguồn mới (catalog §8.4), cần rulebook gốc khác |
| Wolf Cub | 3c | `done` — CI xanh (run 34224670711, commit e1deedd, `typecheck`/`test`/`build` đều `success`), merged vào main. Rules RTDB live đã deploy (`firebase deploy --only database --project werewolf-game-2026`, 2026-09-08) và byte-compare khớp 100% với `database.rules.json` trong repo (rule WOLVES/wolves-chat mở rộng `WOLF_CUB` và field `wolfCubBonusNightPending` xác nhận có mặt sau deploy, diff rỗng) — `resolveNight`/`tallyMajorityVote` tổng quát hoá sang `tallyTopNVotes`/`wolfTargets: string[]`, `planAdvance` nhận `wolfCubBonusNightPending` + trả `deathsThisRoundRoles`, route đọc/set cờ đúng 2 điểm DAWN/VOTE_RESULT (KHÔNG ở "Leaving WOLVES" như thiết kế gốc), full test coverage (unit + route-level e2e + emulator rules) |
| Village Idiot ("Gã Khờ") | 4a | `done` — CI xanh (run 34227270895, commit 96d1a72, `typecheck`/`test`/`build` đều `success`), merged vào main. Rules RTDB live đã deploy (`firebase deploy --only database --project werewolf-game-2026`, 2026-09-08) và byte-compare khớp 100% với `database.rules.json` trong repo (rule VOTE mở rộng điều kiện `VILLAGE_IDIOT` xác nhận có mặt sau deploy, diff chỉ lệch newline cuối file) |
| Beholder ("Kẻ Quan Sát") | 4a | `done` — CI xanh (run 34258090368, commit c60aa5c). `beholderSeerUid` viết vào `private/{gameId}/{uid}` lúc chia vai (`buildBeholderTargets`, khuôn `buildMasonLinks`), không cần rule RTDB mới (`private/` đã `.write: false`) — nhưng `roleCounts` `.validate` (thêm `BEHOLDER` là RoleKey thứ 20) đã deploy (`firebase deploy --only database --project werewolf-game-2026`, 2026-09-08, iteration 5) và byte-compare khớp 100% với `database.rules.json` trong repo |
| Priest, Aura Seer | 4b | `unblocked` (2026-09-08, iteration 6) — lời văn chính hãng đầy đủ tìm thấy cho cả 2, kèm câu phân biệt rõ Priest vs Bodyguard (catalog §8.3), sẵn sàng viết story |
| Huntress, Revealer | 4b | `blocked` — vẫn không tìm thấy trong PDF nguồn mới (catalog §8.4), cần rulebook gốc khác |
| Apprentice Seer | 4b | `unblocked` (2026-09-08, iteration 6) — lời văn chính hãng đầy đủ tìm thấy, kèm bản Alternate (catalog §8.3), sẵn sàng viết story |
| Drunk | 4b | `blocked` — chỉ thấy tên trong scenario list (catalog §8.5), không tìm được trang lời văn riêng |
| Troublemaker | 4b | `unblocked` (2026-09-08, iteration 6) — lời văn chính hãng tìm thấy; xác nhận đúng nghi ngờ cũ: cần thiết kế engine mới (chèn 1 chu kỳ VOTE thứ 2 trong cùng ngày sau lần treo cổ đầu tiên) trước khi viết story — không chỉ "sẵn sàng ngay" như Priest/Aura Seer/Apprentice Seer (catalog §8.3) |
| Insomniac, Paranormal Investigator | 4b | `blocked` (P.I. lời văn đã rõ, catalog §8.3) — cả 2 vẫn cần khái niệm "hàng xóm"/thứ tự chỗ ngồi (seating order) không tồn tại trong kiến trúc hiện tại; catalog §8.4 gợi ý 1 story kiến trúc `seatOrder` dùng chung gỡ chặn cả 2 cùng lúc |
| Vampire | 5 | `blocked`, thu hẹp đáng kể (2026-09-08, iteration 6) — không còn "chưa có nổi 1 câu paraphrase": PDF xác nhận Vampire là phe riêng, cơ chế cắn/giết ban đêm giống hệt Werewolf, xuất hiện trong thứ tự gọi vai chính thức ngay sau Werewolves (catalog §8.3). Suy luận hợp lý (chưa phải trích nguyên văn) là điều kiện thắng đối xứng với Werewolf — cần 1 câu xác nhận trực tiếp trước khi viết story, không tự suy đoán thành sự thật |
| Cult Leader | 5 | `unblocked` (2026-09-08, iteration 6) — lời văn chính hãng đầy đủ tìm thấy, xác nhận không có "kháng cự" (catalog §8.3), sẵn sàng viết story |
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

Điều này KHÔNG có nghĩa là dừng toàn bộ epic mở rộng vai ngay bây giờ — Epic 1 (3 vai), Epic 2
(1 vai), Epic 3 (1 vai, Wolf Man) và Epic 3c (1 vai, Wolf Cub) đều đã `done` (2026-09-08,
iteration 18 đóng nốt Epic 3c). Epic 1b, Epic 2b, Epic 3b, Epic 5 (9 vai) hiện đang chờ một
nguồn rulebook mới — không có epic nào còn "code written nhưng chưa verify" nữa; mọi việc đã
unblock qua nghiên cứu/thiết kế engine (không cần nguồn owner) đều đã implement và verify xong,
**kể cả phần kiến trúc phe thứ 3** (iteration 19 xác nhận Epic 5 không còn cần một pass kiến
trúc riêng — xem `2026-09-08-roles-epic-5.md`). "Không bao giờ hoàn thành 100%" áp dụng chắc
chắn cho Epic Z (94 vai), và có thể áp dụng cho Epic 1b/2b/3b/4/5/6 nếu không tìm ra rulebook
gốc mới — tất cả cần owner theo dõi, không chỉ Epic Z.

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

10. **Xong (iteration 18, 2026-09-08)**: xác nhận CI xanh cho commit Wolf Cub (e1deedd, run
    34224670711 — `typecheck`/`test`/`build` đều `success`), sau đó `firebase deploy --only
    database --project werewolf-game-2026` (live ruleset trước deploy còn thiếu field
    `wolfCubBonusNightPending` và 2 clause `WOLF_CUB` trong rule WOLVES/wolves-chat) và
    `firebase database:get /.settings/rules` byte-compare sau deploy khớp 100% với
    `database.rules.json` trong repo (diff rỗng). Epic 3c giờ `done` — không còn epic nào ở
    trạng thái "code written, verification pending". Việc tiếp theo cho epic mở rộng vai: mọi
    epic còn chưa `done` (1b, 2b, 3b, 4, 5, 6, Z) đều chặn ở nguồn/thiết kế owner cần tham gia
    (rulebook gốc, kiến trúc phe thứ 3, hoặc — cho Epic Z — hoàn toàn ngoài tầm web search) —
    không còn "story ready, chưa implement" nào tồn đọng để làm tiếp mà không cần owner/nguồn
    mới. Xem mục "Phán đoán" ở trên: 6/141 vai (Mason, Prince, Pacifist, Sorcerer/Sorceress,
    Wolf Man, Wolf Cub) hiện `done`; roadmap hiện tại không có việc "chỉ cần code" nào còn lại
    cho tới khi owner cung cấp nguồn mới hoặc quyết định 52/141 (hay ít hơn) là đủ.

11. **Xong (iteration 19, 2026-09-08)**: pass kiến trúc Epic 5 (`2026-09-08-roles-epic-5.md`),
    đúng việc iteration 18 xác định là bước tự-giải-quyết-được kế tiếp. Kết quả: giả định "phe
    thứ 3 cần kiến trúc engine mới hoàn toàn" (viết khi lập roadmap ban đầu, chưa soi code) chỉ
    đúng một nửa khi kiểm chứng lại trực tiếp trên code — template "1 phase đêm cho 1 vai đơn
    lẻ" đã tồn tại sẵn và đã chứng minh 2 lần (Seer → Sorcerer), `checkWinner.ts` chỉ cần thêm 1
    branch tuần tự mới (không refactor gì), và "đổi phe hiệu lực xuyên ván" đã có tiền lệ ngầm
    từ cách Cursed's `transformedToWolf` được xử lý ở `planAdvance.ts`. Không có năng lực engine
    nào còn thiếu cho phe thứ 3. Nhưng **không vai nào chuyển sang `story ready`** — cả Vampire
    (thiếu hoàn toàn lời văn điều kiện thắng, không có nổi 1 câu paraphrase, khác mọi vai Tier 1
    khác) và Cult Leader (điều kiện thắng rõ nhưng cơ chế "kéo người vào giáo phái" mỗi đêm mơ
    hồ thời điểm/kháng cự — cùng lớp vấn đề Epic 1b/2b/3b) vẫn `blocked`, nhưng lý do đổi từ
    "chờ kiến trúc" sang "chờ nguồn", xếp cùng nhóm 1b/2b/3b/4. Không có code thay đổi ở iteration
    này — thuần tài liệu thiết kế + cập nhật roadmap. Việc tiếp theo cho epic mở rộng vai: không
    còn epic nào tự-giải-quyết-được nữa (đã hết cả loại "cần thiết kế engine" lẫn loại "code
    written chưa verify") — mọi epic còn lại (1b, 2b, 3b, 4, 5, 6, Z) chờ đúng một thứ duy nhất:
    owner cung cấp nguồn rulebook gốc mới. Nếu run này tiếp tục mà không có nguồn mới từ owner,
    các iteration sau nên nêu rõ điều đó thay vì cố tìm việc tự chế ra để làm.

12. **Xong (iteration 20, 2026-09-08)**: trước khi kết luận hẳn "không còn việc tự-giải-quyết-được",
    thử lại 2 việc: (a) 3 đầu mối web nghiên cứu owner nêu tên trong prompt gốc (BGG filepage
    99038, fandom wiki, beziergames.com per-expansion) — tất cả xác nhận vẫn chết y hệt kết luận
    iteration 1 (fandom wiki vẫn HTTP 402; công cụ WebFetch của phiên này tự chặn hẳn domain
    `archive.org` nên không dùng được Wayback Machine dù tìm thấy snapshot hợp lệ qua API; phát
    hiện thêm 1 nguồn mới — `gridbeast.gg` có cấu trúc 1 trang/vai — nhưng trang Wolf Cub thực tế
    ghi "Content coming soon", không có lời văn); (b) áp dụng đúng kỷ luật "soi từng vai riêng lẻ"
    (đã dùng 3 lần cho Epic 1b/2b/3b) cho 11 vai của **Epic 4** — việc này roadmap gốc chưa từng
    làm, chỉ gộp chung "Chặn lại" ở mức tên epic. Kết quả: soi trực tiếp trên code (`resolveVote.ts`,
    `roles.ts`'s `buildMasonLinks`, `types/game.ts`'s "Tiên Tri luôn có mặt") tìm ra **2 vai
    story-ready mà không cần nguồn mới nào** — Village Idiot (đối lập gương của Pacifist, chặn
    ballot `null` thay vì chặn ghi hoàn toàn) và Beholder (thông tin thụ động đúng khuôn Mason,
    biết uid của Tiên Tri — vai luôn có mặt nên không có case rỗng) — tách thành **Epic 4a**
    (`2026-09-08-roles-epic-4.md`, story ready, chưa implement). 9 vai còn lại tách thành Epic 4b,
    phân loại lại theo 4 lý do chặn khác nhau (trùng vai đã có / mơ hồ thời điểm / thiếu khả năng
    engine / khái niệm kiến trúc không tồn tại) thay vì 1 dòng chung chung. Việc tiếp theo cho epic
    mở rộng vai: implement Story 4a.1 + 4a.2 (mỗi story 1 commit, build+test trước mỗi commit,
    verify CI xanh + rules RTDB live cho Story 4a.1 sau khi deploy — Story 4a.1 chạm
    `database.rules.json`). Đồng thời: kết luận "mọi epic còn lại chỉ chờ nguồn owner" ở mục 11
    (iteration 19) **chưa hoàn toàn đúng** — vẫn còn việc tự-giải-quyết-được dạng "soi từng vai"
    cho các epic multi-role chưa được soi kỹ (chính Epic 4 là ví dụ), nên các iteration sau, trước
    khi coi một epic là "blocked, chờ owner", nên tự hỏi đã soi từng vai riêng lẻ trong đó chưa,
    không chỉ tin theo phân loại epic ban đầu.

13. **Xong (iteration 21, 2026-09-08)**: implement Story 4a.1 (Village Idiot) đúng theo story
    doc's kiến trúc — thêm `VILLAGE_IDIOT` vào `RoleKey`/`FACTION_BY_ROLE`/`OPTIONAL_ROLE_KEYS`/
    `ROLE_LABELS` ("Gã Khờ"), thêm điều kiện vào `database.rules.json`'s rule VOTE, ẩn nút "Bỏ
    phiếu trắng" ở `ActionPanel.tsx` khi vai là Village Idiot, và test coverage đầy đủ
    (`rulesGames.test.ts` emulator test đối xứng với test Pacifist đã có, `roles.test.ts` cập
    nhật 2 fixture + comment capacity n=16, `gameFlowEndToEnd.test.ts`/`multiClientGame.test.ts`
    cập nhật fixture `NO_OPTIONAL_ROLES`). **Bắt được 1 lỗi thật trong chính thiết kế của story
    doc trước khi viết test**: story doc §"Kiến trúc" đề xuất điều kiện rule
    `newData.val() !== null`, nhưng node `.write` này nằm ở `$uid` (không phải `$uid/target`) —
    client luôn ghi cả object `{target, done, at}` (`submitAction` trong `actions.ts`), không
    bao giờ ghi giá trị `null` trần ở cấp `$uid`, nên `newData.val()` luôn là 1 object và điều
    kiện đề xuất sẽ không bao giờ chặn được gì. Sửa thành `newData.child('target').val() !==
    null` — đúng đường dẫn nơi giá trị `null`/uid thật sự nằm. Story 4a.2 (Beholder) **chưa
    implement** ở iteration này (giữ đúng "1 iteration = 1 đơn vị việc"). Việc còn lại cho Story
    4a.1: verify CI xanh, sau đó deploy + byte-verify `database.rules.json` lên RTDB live (đúng
    quy trình đã lặp lại cho Epic 1/2/3/3c) trước khi coi 4a.1 là `done`.

14. **Xong (iteration 22, 2026-09-08)**: xác nhận CI xanh cho commit Village Idiot (96d1a72, run
    34227270895, `typecheck`/`test`/`build` đều `success` — run này còn `in_progress` lúc iteration
    21 kết thúc, iteration này poll tới khi hoàn tất). Deploy `database.rules.json` lên RTDB live
    (`firebase deploy --only database --project werewolf-game-2026`) — pre-deploy diff xác nhận
    rules live còn thiếu điều kiện `VILLAGE_IDIOT`; post-deploy `firebase database:get
    /.settings/rules` byte-compare khớp repo (chỉ lệch newline cuối file). Epic 4a Story 4a.1
    (Village Idiot) giờ là `done` đầy đủ theo mọi tiêu chí của objective. Không có thay đổi code
    nào ở iteration này — thuần verification, đúng khuôn mẫu iteration 8/11/15/18. Việc kế tiếp
    chưa bị chặn: Story 4a.2 (Beholder) đã `story ready` từ iteration 20, sẵn sàng implement ở
    iteration sau.
15. **Xong (gnhf run `stop-read-this-first-98c7ba` iteration 5, 2026-09-08)**: Story 4a.2
    (Beholder, implemented ở iteration 4 của run này sau khi deck-builder detour đóng vòng)
    xác nhận CI xanh (commit c60aa5c, run 34258090368, `success`). Deploy `database.rules.json`
    lên RTDB live (`firebase deploy --only database --project werewolf-game-2026`) — pre-deploy
    check xác nhận rules live còn thiếu key `BEHOLDER` trong `roleCounts` validate (0 lần xuất
    hiện); post-deploy `firebase database:get /.settings/rules` byte-compare
    (`JSON.stringify` deep-equal, không phải line-diff) khớp 100% repo. **Epic 4a giờ `done`
    đầy đủ** — cả Story 4a.1 và 4a.2 đã qua CI + rules-live verification. Không có thay đổi
    code nào ở iteration này — thuần verification, đúng khuôn mẫu mọi story trước. Epic 4a
    (2 story) là toàn bộ nội dung Epic 4 (9 vai còn lại vẫn `blocked`, xem bảng ở đầu file);
    việc kế tiếp cho role-catalog epic là Epic 1b/2b/3b/4b/5 khi có nghiên cứu rulebook mới,
    theo đúng "Thứ tự triển khai đề xuất" ở trên — không có story nào khác đang `story ready`
    chờ implement ngay lúc này.
16. **Xong (gnhf run `stop-read-this-first-98c7ba` iteration 6, 2026-09-08)**: tìm được PDF
    rulebook chính hãng đầy đủ ("Ultimate Werewolf: Ultimate Edition Official Rules", Ted
    Alspach/Pegasus Spiele — xem `2026-09-08-role-catalog.md` §8 cho toàn bộ chi tiết + trích
    dẫn nguyên văn), gỡ chặn **10 vai** (Old Hag, Tough Guy, Diseased, Doppelgänger, Hoodlum,
    Lone Wolf, Priest, Aura Seer, Apprentice Seer, Cult Leader — tất cả `unblocked`, sẵn sàng
    viết story) và thu hẹp đáng kể 2 vai khác (Troublemaker — có lời văn nhưng cần thiết kế
    engine mới trước khi viết story; Vampire — không còn "chưa có 1 câu paraphrase nào", cần 1
    câu xác nhận nhỏ). Insomniac/P.I. vẫn `blocked` nhưng nay biết chính xác lý do dùng chung:
    cả 2 cần khái niệm "hàng xóm"/seating order chưa có trong kiến trúc — gợi ý gộp thành 1
    story kiến trúc chung. Dire Wolf, Huntress, Revealer, Drunk, Mayor vẫn `blocked` — không
    tìm thấy trong PDF này (không suy đoán). Thuần nghiên cứu, không có thay đổi code — việc kế
    tiếp là chọn một trong các vai `unblocked` ở trên (khuyến nghị bắt đầu bằng nhóm 4b Priest/
    Aura Seer/Apprentice Seer vì không cần thiết kế engine mới, giống khuôn Epic 1/2/3c) và viết
    story doc riêng trước khi implement, đúng kỷ luật "research → plan → implement" của owner.
17. **Xong (gnhf run `stop-read-this-first-98c7ba` iteration 7, 2026-09-08)**: viết
    `2026-09-08-roles-epic-1b.md` — pass thiết kế engine đầy đủ cho cả 3 vai Epic 1b (Tough Guy,
    Diseased, Old Hag), theo đúng khuôn Epic 3c (pass thiết kế trước khi cho phép implement).
    Giải quyết dứt điểm 3 câu hỏi timing đã chặn epic này ở Epic 1 (cắn thành công vs. chỉ bị
    chọn, có được cứu lần 2 không, "rời làng" ánh xạ vào cơ chế nào đã có sẵn) bằng cách móc vào
    đúng các điểm resolve đã có (`bittenSurvives` trong `resolveNight`, `applyHunterRevenge`,
    `resolveVote`'s `roleOf` pattern từ Prince) thay vì viết pipeline mới. Phát hiện và tự sửa 1
    lỗi thiết kế giữa chừng tài liệu (quyết định #4): thiết kế nháp đầu tiên định cất
    `toughGuyPendingDeathUid` (string) công khai ở `games/{gameId}` — bản thân giá trị field ĐÓ
    chính là uid của Tough Guy, vi phạm trực tiếp spec §4.6 "vai không bao giờ tiết lộ"; sửa
    thành 1 boolean thuần (`toughGuyDeathPending`, không map ra uid nào) trước khi chốt thiết
    kế, không mang lỗi này sang bước implement. Còn 3 quyết định cần owner duyệt trước khi code
    (#5 Diseased×Cursed, #6 Old Hag chặn cả vote lẫn bị-treo, #7 Old Hag không bảo vệ khỏi
    tấn công ban đêm) — ghi rõ trong doc, không tự ý chọn thay owner. Không có thay đổi code nào
    ở iteration này — thuần thiết kế, đúng cadence "1 iteration thiết kế, iteration sau
    implement" đã dùng cho deck-builder (iteration 1) và Epic 3c. Việc kế tiếp: implement Epic
    1b theo đúng thứ tự đề xuất trong doc (Diseased → Tough Guy → Old Hag), HOẶC bắt đầu bằng
    nhóm 4b (Priest/Aura Seer/Apprentice Seer) nếu owner muốn ưu tiên vai không cần phase mới
    trước — cả hai đường đều hợp lệ, chưa có gì bắt buộc phải chọn 1b trước 4b ngoài thứ tự số.

18. **Xong (gnhf run `stop-read-this-first-98c7ba` iteration 8, 2026-09-08)**: implement Story
    1b.2 (Diseased) end-to-end theo đúng thứ tự "đơn giản nhất trước" mà iteration 17's doc đề
    xuất — vai thứ nhất trong 3 vai Epic 1b được code, chưa đụng Tough Guy/Old Hag. Thêm
    `DISEASED` vào `RoleKey`/`FACTION_BY_ROLE`/`ALL_ROLE_KEYS`/`ROLE_LABELS` (nhãn "Người Nhiễm
    Bệnh"); `resolveNight` nhận thêm tham số optional `suppressBite` (mặc định `false`, không
    phá call site cũ) — khi `true`, mọi wolf-target đêm đó sống sót nhưng Cursed vẫn transform
    bình thường (áp dụng đúng khuyến nghị #5 của doc: lời nguyền kích hoạt bởi bị cắn, không bởi
    có chết hay không — quyết định này chưa qua owner duyệt trực tiếp, nhưng doc iteration 17 đã
    lập luận rõ và đề xuất mức tin cậy ngang Prince's lệch-nguyên-văn, nên implement luôn theo
    tinh thần "ghi rõ để owner phủ quyết sau" thay vì chờ). `planAdvance` tính
    `diseasedSuppressNextBite` mới mỗi lần DAWN (đọc field cũ làm input cho `suppressBite` đêm
    này, tính field mới từ "sói có cắn trúng Diseased đêm này không, có được cứu không" độc lập
    với việc đêm này có bị suppress hay không) và trả về trong `PlanAdvanceResult`; route
    `advance/route.ts` đọc/ghi field này ở DAWN, mirror y hệt cách `wolfCubBonusNightPending` đã
    làm. Mở rộng `database.rules.json`'s `roleCounts` `.validate` rule cho `RoleKey` thứ 21
    (đúng bài học Story 4a.2), cập nhật mọi `Record<RoleKey, number>` fixture literal
    (`page.tsx`, `rules.test.ts`, `multiClientGame.test.ts` — 3 file dùng literal object, các
    file test khác đã build từ `ALL_ROLE_KEYS` nên tự động nhận field mới). Thêm test: 4 case
    mới trong `resolveNight.test.ts` (suppressBite voids kill, không cản poison, không cản
    Cursed transform, áp dụng cả 2 mục tiêu đêm bonus Wolf Cub), 5 case mới trong
    `planAdvance.test.ts` (arm/không-arm cờ theo từng tình huống, cờ đã arm thực sự vô hiệu hoá
    cắn đêm sau), 1 test e2e mới trong `gameFlowEndToEnd.test.ts` (2 đêm liên tiếp qua route thật
    — đêm 1 cắn trúng Diseased chết bình thường + arm cờ, đêm 2 cắn trúng người khác nhưng không
    ai chết, cờ tự tắt). Không chạy được `npm test`/`typecheck`/`build` trên máy này (PRoot) —
    xác nhận bằng đọc lại kỹ từng diff + `node -e` xác nhận `database.rules.json` vẫn là JSON hợp
    lệ; CI xanh + live rules deploy/byte-verify để lại cho iteration sau, đúng cadence đã dùng
    cho mọi story trước (Village Idiot, Beholder, Wolf Cub, Sorcerer, Wolf Man). Việc kế tiếp:
    xác nhận CI xanh cho commit này rồi deploy+byte-verify `database.rules.json` live, sau đó
    tiếp tục Tough Guy (vai thứ 2 của Epic 1b theo đúng thứ tự đề xuất).
