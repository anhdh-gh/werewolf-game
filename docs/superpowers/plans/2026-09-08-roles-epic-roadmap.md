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
| **Epic 2** | Vai Sói đồng minh cần phase đêm mới, cơ chế đủ rõ để viết story ngay (Sorcerer/Sorceress) | 1 | Code viết xong (iteration 10) — chờ CI xanh + deploy/verify live rules RTDB (node action `SORCERER` mới) trước khi coi là `done` | `2026-09-08-roles-epic-2.md` |
| **Epic 2b** | Vai có khái niệm rõ nhưng paraphrase để lại mơ hồ thời điểm/trạng thái xuyên đêm hoặc điều kiện thắng chính xác — cùng loại vấn đề đã chặn Epic 1b (Doppelgänger, Hoodlum) | 2 | Chưa viết story — cần rulebook gốc | chưa có |
| **Epic 3** | Vai Sói mới ngoài Kẻ Phản Bội (Dire Wolf, Lone Wolf, Wolf Man, Wolf Cub) | 4 | Chưa viết story | chưa có |
| **Epic 4** | Vai cần rulebook gốc để phân biệt khỏi vai đã có, **không suy đoán** (Priest vs Bảo Vệ, Huntress vs Thợ Săn, Revealer vs Tiên Tri, Village Idiot, Drunk, Troublemaker, Insomniac, Apprentice Seer, Aura Seer, Paranormal Investigator, Beholder) | ~11 | **Chặn lại** — cần nghiên cứu thêm (không phải "thêm web search thông thường" nữa, xem catalog §6 mục 4) | chưa có |
| **Epic 5 (kiến trúc)** | Phe thứ 3 mới hoàn toàn — Vampire, Cult Leader (cần thiết kế điều kiện thắng + UI phe mới dùng chung trước khi có vai nào trong nhóm này implement được) | 2 | Chặn lại — cần một `bmad-architecture` pass riêng trước khi có story | chưa có |
| **Epic 6** | Tier 2 — Night Terrors, Urban Legends, Classic Movie Monsters (tên xác nhận, **lời văn năng lực chưa có nguồn chính hãng**) | ~14 | Chặn lại — cần nghiên cứu lại lời văn trước khi viết story (catalog §5, §6 mục 4) | chưa có |
| **Epic Z (cuối roadmap, không phải tier chờ implement)** | Bonus Roles (44) + Pro Roles (50+) | 94 | **Chặn vĩnh viễn cho tới khi có nguồn mới** — không lặp lại tìm kiếm web thông thường (catalog §1.1 kết luận) | chưa có |
| *Loại khỏi phạm vi* | Legacy (kiến trúc campaign 16 phiên), Artifacts (cơ chế item-overlay, không phải vai), Daybreak (thuộc One Night, khác kiến trúc), "Village" (không xác nhận tồn tại) | — | Không lập epic — ghi rõ lý do ở catalog §2 | — |

**Thứ tự triển khai đề xuất:** Epic 1 → Epic 2 → Epic 1b/2b (khi có nghiên cứu rulebook giải
quyết được mơ hồ) → Epic 3 → (Epic 4 sau khi có nghiên cứu rulebook mới) → (Epic 5 sau khi có
kiến trúc phe thứ 3) → (Epic 6 sau khi có lời văn Tier 2) → Epic Z chỉ khi owner tự cung cấp
nguồn mới (ảnh chụp thẻ bài vật lý, liên hệ Bezier Games). Đây đúng là thứ tự "phổ biến nhất
trước, hiếm nhất sau cùng" owner yêu cầu — vai càng rõ nguồn và càng đơn giản về kiến trúc thì
càng lên trước, không phải theo thứ tự bảng chữ cái hay theo độ khó code. Epic 2 (Sorcerer/
Sorceress) đứng trước Epic 1b vì đã có story sẵn sàng ngay, trong khi Epic 1b vẫn đang chờ một
nguồn rulebook mới chưa tìm ra.

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
| Sorcerer/Sorceress ("Pháp Sư") | 2 | `in progress` — code viết xong (iteration 10: RoleKey/phase mới/rules.json node/UI/test), CI + live-rules-verification còn thiếu |
| Doppelgänger, Hoodlum | 2b | `blocked` — cần rulebook gốc (mơ hồ thời điểm/điều kiện thắng xuyên đêm) |
| Dire Wolf, Lone Wolf, Wolf Man, Wolf Cub | 3 | `not started` |
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

Điều này KHÔNG có nghĩa là dừng toàn bộ epic mở rộng vai ngay bây giờ — Epic 1 (3 vai, đã
`done`) và Epic 2 (1 vai) đã có story sẵn sàng/đã implement, và Epic 3 có đường đi rõ ràng không
cần nguồn mới. Epic 1b và Epic 2b (5 vai) hiện đang chờ một nguồn rulebook mới — không tự tin
nói "không cần nguồn mới" cho hai epic này nữa như bản roadmap trước đã ghi nhầm. "Không bao giờ
hoàn thành 100%" áp dụng chắc chắn cho Epic Z (94 vai), và có thể áp dụng cho Epic 1b/2b nếu
không tìm ra rulebook gốc — cả hai cần owner theo dõi, không chỉ Epic Z.

## Việc tiếp theo sau tài liệu này

1. Implement Epic 1 (3 story trong `2026-09-08-roles-epic-1.md`), mỗi story một commit riêng,
   build+test trước mỗi commit, verify CI xanh + (nếu có RTDB rules mới) verify rules deploy
   thật trên Firebase live, không chỉ emulator — đúng bài học đã ghi trong
   `2026-09-07-resilience.md`. **Xong (2026-09-08)**, xem `2026-09-08-roles-epic-1.md`.
2. Implement Epic 2 (story 2.1, Sorcerer/Sorceress → "Pháp Sư", trong
   `2026-09-08-roles-epic-2.md`) — vai đầu tiên cần một phase đêm mới và một node action RTDB
   mới; deploy + verify rules live sau khi CI xanh, cùng bài học Pacifist.
3. Sau khi Epic 2 xong: Epic 1b/2b (nếu tìm được rulebook giải quyết được mơ hồ) hoặc Epic 3
   (không phụ thuộc nghiên cứu thêm) — ưu tiên epic nào không bị chặn trước.
4. Cập nhật bảng theo dõi tiến độ ở trên mỗi khi một vai đổi trạng thái.
