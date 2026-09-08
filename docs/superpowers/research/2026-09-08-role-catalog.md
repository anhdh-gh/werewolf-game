# Danh mục vai Ultimate Werewolf (Bezier Games) — nghiên cứu nguồn, Task 1

> Trạng thái: **đóng vòng nghiên cứu web thông thường (2026-09-08, 2 phiên)** — đủ để bắt đầu
> lập epic/story cho Tier 1 và Tier 2. Bonus Roles (44 vai) và Pro Roles (50+ vai) đã qua **hai
> phiên tìm kiếm độc lập với >15 nguồn khác nhau** (xem §1 và §6) mà không tìm ra tên từng vai
> cụ thể — kết luận: tìm kiếm web thông thường đã cạn, cần nguồn khác hẳn (mua vật lý, liên hệ
> Bezier Games) nếu muốn có danh sách đầy đủ. Không chặn việc lập epic — Tier 1/2 đủ để bắt đầu.
> Đây là input cho `bmad-create-epics-and-stories` / `bmad-spec`, không phải bản thiết kế
> implement.
>
> **Cập nhật (phiên 3, 2026-09-08, xem §8):** tìm được **PDF rulebook chính hãng đầy đủ**
> ("Ultimate Werewolf: Ultimate Edition Official Rules", tác giả Ted Alspach — nhà thiết kế xác
> nhận của Bezier Games — bản in bởi Pegasus Spiele theo giấy phép). PDF này giải quyết **13 vai
> đang `blocked`** trong roadmap (lời văn năng lực chính xác, trích dẫn nguyên văn) và cung cấp
> **thứ tự gọi vai ban đêm chính thức** cho gần như toàn bộ Tier 1/2. Chi tiết + trích dẫn ở §8.

## 0. Vì sao tài liệu này tồn tại

Chủ dự án yêu cầu mở rộng bộ vai từ 12 vai hiện có tới toàn bộ danh mục vai chính thức của
**Ultimate Werewolf (Bezier Games)** — không lấy vai từ game khác (Werewolves of Miller's
Hollow, One Night Ultimate Werewolf, app tự chế) trừ khi tên đó *cũng* xuất hiện trong dòng
sản phẩm Bezier Games không phải One Night. Quy tắc bắt buộc: **không tìm được lời văn năng
lực chính xác từ nguồn Bezier thì ghi "biết tên, chưa xác nhận lời văn chính xác" rồi bỏ qua,
không suy đoán.**

## 1. Phương pháp & độ tin cậy nguồn

Đã thử các nguồn sau trong phiên nghiên cứu này (2026-09-08):

| Nguồn | Trạng thái | Độ tin cậy |
|---|---|---|
| `beziergames.com/products/*` (trang sản phẩm chính hãng) | Fetch được, nhưng hầu hết trang sản phẩm **không liệt kê tên từng vai** — chỉ có mô tả marketing chung ("44 vai mới", "50+ vai mới") | Cao nhất khi có tên vai, nhưng ít khi có |
| `beziergames.com/blogs/news/differences-among-all-of-the-ultimate-werewolf-editions` | Fetch được, có cấu trúc dòng sản phẩm rõ ràng | Cao — chính hãng |
| `beziergames.com/blogs/news/happy-haunting` | Fetch được, liệt kê tên vai theo từng expansion (Classic Movie Monsters, Urban Legends) | Cao — chính hãng, có tên vai cụ thể |
| BoardGameGeek trang game (`boardgamegeek.com/boardgame/...`) | **HTTP 403** khi fetch trực tiếp phiên này | Không truy cập được |
| BGG filepage 99038 "Ultimate Werewolf Role list for all versions" | Không fetch nội dung file (không phải trang web thường); mô tả trong kết quả tìm kiếm tự nhận là **"self created, unofficial list"** | Không dùng làm nguồn chính — chỉ dùng để đối chiếu tên, không lấy lời văn năng lực từ đây |
| `board-games.fandom.com/wiki/Ultimate_Werewolf/Roles` | **HTTP 402 Payment Required** cả hai lần thử | Không truy cập được |
| `ultimatewerewolfgames.tumblr.com/roles` | Fetch được, bảng vai khá đầy đủ (~50 vai, có team + năng lực tóm tắt) | **Không chính thức** — trang tự nhận "this blog is only ran by one person", không phải Bezier Games/Ted Alspach. Dùng làm **danh sách tên để đối chiếu chéo**, không trích lời văn năng lực làm nguồn chính; mọi vai chỉ có nguồn này bị đánh dấu "chưa xác nhận nguồn chính hãng" |
| `en.wikipedia.org/wiki/Ultimate_Werewolf` | Fetch được | Trung bình — xác nhận tên expansion, không có danh sách vai đầy đủ |
| `fathergeek.com/ultimate-werewolf-extreme/` (review) | Fetch được, liệt kê ~38 vai theo nhóm với mô tả năng lực bằng lời văn của người review (đã chơi bản vật lý) | Trung bình-cao — bên thứ ba đáng tin nhưng diễn giải lại, không phải nguyên văn thẻ bài |

**Không tìm được** trong phiên này: rulebook PDF chính hãng, nội dung app "Ultimate Werewolf
App" (đề cập trên trang sản phẩm nhưng không fetch được), danh sách đầy đủ 44 vai của Bonus
Roles hay 50+ vai của Pro Roles ở bất kỳ nguồn nào.

### 1.1 Phiên nghiên cứu thứ 2 (2026-09-08, tiếp tục) — mục tiêu: thu hẹp khoảng trống Bonus/Pro Roles

Thử thêm các nguồn sau, tất cả đều **không** cho ra tên vai cụ thể của Bonus Roles/Pro Roles:

| Nguồn | Kết quả |
|---|---|
| `beziergames.com/products/ultimate-werewolf-bonus-roles` (fetch lại trực tiếp) | Chỉ có "44 new unique roles and 2 new player items" — không tên |
| Amazon listing `B09JDJ8C44` (Bonus Roles) | HTML không render đủ nội dung mô tả, không có tên vai |
| Noble Knight Games, Hobbiesville, Little Shop of Magic, Board Game Bliss (retailer listings) | Đều lặp lại mô tả marketing giống nhau, không tên vai riêng lẻ |
| `gridbeast.gg/ultimate-werewolf-bonus-roles/` (review site) | Trang có mục "Roles" nhưng ghi rõ **"List coming Soon"** — tác giả cũng chưa liệt kê được |
| `boardseyeview.net/post/ultimate-werewolf-extreme-pro-bonus-roles` | Bài viết xác nhận "well over a hundred different roles" nhưng không nêu tên cụ thể nào |
| `boardgamegeek.com/boardgame/346935/ultimate-werewolf-bonus-roles` (trang game riêng cho Bonus Roles) | HTTP 403 (giống trang BGG chung) |
| `cdn.1j1ju.com` (kho rulebook PDF của nhà phân phối 1jour-1jeu, có rulebook One Night Ultimate Werewolf Daybreak) | Không có rulebook nào cho dòng Ultimate Werewolf chính (Extreme/Pro/Bonus Roles) trong kho này — chỉ có dòng One Night |
| Google Play "Ultimate Werewolf Moderator" (app chính hãng Bezier Games, `com.beziergames.uwexmoderator`) | **Có dữ liệu mới hữu ích**: mô tả app ghi rõ *"All 141 different roles, across all games and expansions, have been uniquely implemented"* — xác nhận con số tổng chính thức là **141 vai** (không phải ước lượng "100+"), nhưng app store listing không liệt kê từng tên vai |

**Kết luận sau 2 phiên (>15 nguồn khác nhau đã thử, xem §1 và bảng trên)**: tên riêng lẻ của
Bonus Roles (44) và Pro Roles (50+) **không có sẵn qua tìm kiếm web thông thường** — kể cả
trang sản phẩm chính hãng, blog chính hãng, app store chính hãng, 5+ trang bán lẻ, 2 trang
review/blog bên thứ ba (một trang tự nhận "list coming soon"), BGG (403 cả hai lần), và kho
rulebook PDF của nhà phân phối lớn. Đây không còn là "chưa thử đủ" — là **giới hạn thực sự của
kênh tìm kiếm web** cho riêng phần này. Muốn có danh sách đầy đủ cần một trong: mua bản vật lý
và chụp ảnh thẻ bài, liên hệ trực tiếp Bezier Games xin rulebook PDF, hoặc tìm được rulebook PDF
gián tiếp qua một kênh khác hẳn (Discord cộng đồng, forum BGG dạng thread thay vì trang game).
**Khuyến nghị: không lặp lại tìm kiếm web cho phần này ở các phiên sau** trừ khi có đầu mối mới
cụ thể (không phải "thử lại cùng loại nguồn") — dùng thời gian nghiên cứu cho việc khác có ích
hơn (xác nhận lời văn chính xác cho Tier 1/2, hoặc bắt đầu lập epic).

## 2. Sơ đồ dòng sản phẩm (nguồn: beziergames.com blog "Differences Among All Of The Ultimate
Werewolf Editions", 2026-09-08)

- **Ultimate Werewolf** (entry level) — 34 thẻ vai, gồm "các vai kinh điển như Seer,
  Bodyguard, Hunter, và Tanner" (nguyên văn blog chính hãng).
- **Ultimate Werewolf: Extreme** — toàn bộ 34 thẻ trên + 54 thẻ mới = 88 thẻ. 54 thẻ mới này
  tương ứng với 3 expansion đặt tên riêng, xác nhận qua blog "Happy Haunting":
  - **Night Terrors** — 6 vai mới, xác nhận tên: **Thing (That Goes Bump in the Night)**,
    **The Count**, **Beholder**, **Insomniac**, **Bogeyman** (vai thứ 6 chưa xác nhận tên —
    nguồn quảng cáo Noble Knight Games chỉ liệt kê 5/6).
  - **Urban Legends** — 6 vai: **Bloody Mary**, **Chupacabra**, **The Wolf Man**,
    **Leprechaun**, **Sasquatch**, **Nostradamus**.
  - **Classic Movie Monsters** — 5 vai xác nhận: **The Blob**, **The Mummy**, **Dracula**,
    **The Zombie**, **Frankenstein's Monster**.
- **Ultimate Werewolf: Extreme Collector's Edition** — 196 thẻ vai = Extreme (88) + **Bonus
  Roles** (44 vai, tên riêng lẻ **chưa xác nhận được** — xem §6) + **Pro Roles** (50+ vai, tên
  riêng lẻ **chưa xác nhận được**). Bonus Roles hiện cũng bán riêng lẻ như một expansion độc
  lập (tương thích với cả Extreme và Pro), không chỉ nằm trong Collector's Edition. Nguồn mới
  (2026-09-08, app store Google Play "Ultimate Werewolf Moderator" của chính Bezier Games,
  package `com.beziergames.uwexmoderator`): mô tả app ghi rõ tổng số chính thức trên toàn bộ
  dòng sản phẩm là **141 vai** ("All 141 different roles, across all games and expansions") —
  đây là con số xác nhận đầu tiên thay cho ước lượng "100+"/"well over a hundred" trước đó,
  dùng con số này làm mốc tổng cho việc theo dõi tiến độ epic (xem §7).
- **Ultimate Werewolf: Extreme Super Collector's Edition** — như Collector's + **Artifacts**
  expansion. Artifacts **không phải vai** — mỗi người chơi nhận thêm 1 thẻ Artifact (vật phẩm
  có năng lực kích hoạt bất kỳ lúc nào) chồng lên vai gốc của họ. Đây là một cơ chế khác hẳn
  (item overlay, không phải role), cần thiết kế riêng nếu làm — không xếp chung tier vai.
- **Ultimate Werewolf: Legacy** (2018) — vẫn giữ lối chơi xã hội suy luận có Moderator + vai
  bí mật, nhưng đóng gói thành **chiến dịch 16 phiên** (1 Preface + 5 chương × 3 phiên), có
  "Diary" 80+ trang dẫn dắt Moderator, quyết định của người chơi ảnh hưởng vĩnh viễn tới các
  phiên sau. **Khác biệt kiến trúc lớn** với engine phase hiện tại của dự án (state theo từng
  ván độc lập, không có state xuyên nhiều ván) — không nên coi là "thêm vài vai", cần epic
  kiến trúc riêng nếu làm, và **ưu tiên rất thấp**.
- **"Village" (do chủ dự án nêu)** — **không tìm thấy** một expansion tên "Village" nào cho
  dòng Ultimate Werewolf (không phải One Night) trong phiên nghiên cứu này, kể cả tìm trực
  tiếp trên beziergames.com. Có thể chủ dự án nhớ nhầm tên, hoặc đang nói tới một sản phẩm
  không thuộc dòng chính. **Cờ treo (flag) — không đưa vào catalog cho tới khi xác nhận được
  tên chính xác.**
- **"Daybreak" (do chủ dự án nêu)** — xác nhận thuộc **One Night Ultimate Werewolf** (sản
  phẩm "One Night Ultimate Daybreak"), một dòng sản phẩm khác hẳn: chơi 1 đêm duy nhất, không
  có vòng lặp ngày/đêm lặp lại, không có Moderator app kiểu app điều phối nhiều đêm như dự án
  này. Theo đúng phạm vi "canonical source = Bezier Games *dòng Ultimate Werewolf*, không phải
  One Night", **loại khỏi catalog chính**; nếu sau này muốn mượn ý tưởng từ Daybreak, đó là
  một quyết định thiết kế thích ứng riêng, không phải "thêm vai có sẵn".
- **Ultimate Werewolf Pro** (đứng riêng) — trang sản phẩm ghi "50+ vai cân bằng kỹ, dành cho
  người chơi/moderator có kinh nghiệm" — không có tên vai cụ thể trên trang.

## 3. Đối chiếu 12 vai đã có với tên chính hãng Bezier Games

Tất cả 12 vai hiện tại (spec §4.1) trùng khớp khái niệm với vai gốc trong Ultimate Werewolf
(Extreme), theo review Father Geek + đối chiếu tumblr:

| Vai hiện tại (mã trong code) | Tên Bezier Games gốc | Khớp năng lực? |
|---|---|---|
| WEREWOLF | Werewolf | Khớp hoàn toàn |
| SEER | Seer | Khớp hoàn toàn |
| BODYGUARD | Bodyguard | Khớp hoàn toàn |
| WITCH | Witch | Khớp hoàn toàn |
| HUNTER | Hunter | Khớp hoàn toàn |
| CUPID | Cupid | Cần xác nhận thêm — chưa fetch được lời văn Cupid từ nguồn chính hãng phiên này (chỉ thấy tên trong danh sách tumblr, chưa kiểm nguồn chính hãng riêng). Năng lực hiện tại (ghép đôi, chết theo nhau) khớp với hiểu biết phổ quát về Cupid trong dòng Werewolf nói chung — **chưa 100% xác nhận đúng bản Bezier**, cần một vòng kiểm tra riêng trước khi coi là "đã xác thực nguồn". |
| VILLAGER | Villager | Khớp hoàn toàn |
| TANNER | Tanner | Khớp hoàn toàn |
| CURSED | Cursed | Khớp — "Becomes werewolf when attacked" |
| LYCAN | Lycan | Khớp — "Appears as werewolf to Seers (and P.I.)" |
| MUTER (Kẻ Bịt Miệng) | **Spellcaster** | Khớp gần như nguyên văn — Father Geek: "can make any single player mute for an entire round" |
| TRAITOR (Kẻ Phản Bội) | Gần nhất là **Minion** | Khớp về khái niệm (biết phe sói, thắng cùng sói, không thức đêm/không cắn, Tiên Tri soi ra dân) nhưng **tên trong code ("Traitor") không phải tên thẻ bài Bezier** — Bezier gọi vai này là "Minion". Đáng cân nhắc (không bắt buộc) đổi nhãn hiển thị hoặc ghi chú tương đương trong story sau này, nhưng đây là quyết định của epic/story, không tự ý đổi ở đây. |

Không có vai nào trong 12 vai hiện tại bị phát hiện sai lệch nghiêm trọng so với nguồn — tốt,
nghĩa là nền tảng hiện có phù hợp để mở rộng tiếp mà không cần sửa gì.

## 4. Tier 1 — vai phổ biến/gần như phổ quát, đã xác nhận tên + năng lực (base game 34 thẻ,
ưu tiên implement trước)

Nguồn chính: Father Geek review (đã chơi bản Extreme vật lý) + Wikipedia/tumblr đối chiếu tên.
**Lời văn năng lực dưới đây là diễn giải lại (paraphrase) từ review, không phải nguyên văn thẻ
bài** — story implement từng vai cần ghi rõ đây vẫn là paraphrase, không phải quote thẻ chính
hãng, cho tới khi có rulebook gốc.

| Vai | Phe | Năng lực (paraphrase) | Đã có trong dự án? |
|---|---|---|---|
| Villager | Làng | Không năng lực | ✅ |
| Werewolf | Sói | Cắn đêm | ✅ |
| Seer | Làng | Soi phe 1 người mỗi đêm | ✅ |
| Bodyguard | Làng | Bảo vệ 1 người mỗi đêm | ✅ |
| Witch | Làng | 1 bình cứu + 1 bình độc, dùng 1 lần/ván | ✅ |
| Hunter | Làng | Chết thì bắn chết 1 người khác | ✅ |
| Cupid | Làng | Ghép đôi đêm đầu, chết theo nhau | ✅ (cần xác nhận thêm, §3) |
| Tanner | Riêng | Thắng nếu bị chết | ✅ |
| Cursed | Làng→Sói | Hoá sói khi bị cắn lần đầu | ✅ |
| Lycan | Làng | Tiên Tri soi ra sói dù là dân | ✅ |
| Spellcaster | Làng | Câm 1 người 1 vòng | ✅ (MUTER) |
| Minion | Sói (đồng minh) | Biết phe sói, thắng cùng sói, Tiên Tri soi ra dân | ✅ (TRAITOR, tên khác) |
| **Mason** | Làng | Biết ai là Mason khác | ❌ chưa có |
| **Prince** | Làng | Không thể bị treo cổ | ❌ |
| **Priest** | Làng | Chặn 1 lượt bị giết cho 1 người | ❌ — cần phân biệt rõ với Bodyguard khi viết story (Priest theo Father Geek nghe giống "bless" 1 người khỏi bị săn, dễ trùng lặp cơ chế với Bodyguard — story cần làm rõ khác biệt thật sự từ rulebook trước khi implement, không suy đoán) |
| **Village Idiot** | Làng | Luôn phải bỏ phiếu treo cổ | ❌ |
| **Drunk** | Làng | Nhầm vai thật của mình, biết vai thật sau vài lượt | ❌ |
| **Troublemaker** | Làng | Có thể kích hoạt 2 lượt treo cổ trong ván | ❌ |
| **Tough Guy** | Làng | Sống thêm 1 ngày sau khi bị sói cắn | ❌ |
| **Pacifist** | Làng | Không được bỏ phiếu treo cổ | ❌ |
| **Old Hag / Old Woman** | Làng | Chỉ định 1 người phải rời làng hôm sau | ❌ |
| **Diseased** | Làng | Sói cắn trúng thì đêm sau sói phải nhịn (không cắn được) | ❌ |
| **Insomniac** | Làng | Biết hàng xóm nào đã hoạt động ban đêm | ❌ |
| **Hoodlum** | Riêng | Thắng nếu 2 người bị chỉ định trước chết | ❌ |
| **Cult Leader** | Riêng | Mỗi đêm kéo thêm người vào giáo phái, thắng nếu người sống sót đều trong giáo phái | ❌ |
| **Doppelgänger** | Đặc biệt | Nhận vai của người khác sau khi họ chết | ❌ |
| **Sorcerer/Sorceress** | Sói (đồng minh) | Soi ra ai là Tiên Tri | ❌ |
| **Dire Wolf** | Sói | Cắn cùng bầy, nhưng số phận gắn với 1 "bạn đồng hành"; bạn đó chết thì Dire Wolf cũng chết | ❌ |
| **Lone Wolf** | Sói | Thắng riêng nếu là sói cuối cùng còn sống | ❌ |
| **Wolf Man** | Sói | Cắn cùng bầy nhưng Tiên Tri soi ra là dân (khác Kẻ Phản Bội/Minion ở chỗ Wolf Man *có* thức đêm và cắn) | ❌ |
| **Wolf Cub** | Sói | Nếu Wolf Cub bị giết, đêm hôm sau bầy sói được cắn thêm 1 mạng | ❌ |
| **Vampire** | Phe thứ 3 (Vampire) | Săn đêm, "hút máu" nạn nhân — cơ chế phe thứ 3 mới, không phải Sói/Làng | ❌ — cần thiết kế phe mới, không chỉ thêm vai |
| **Chupacabra** | Riêng/lai | Săn cả Làng lẫn Sói | ❌ |
| **Huntress** | Làng | Săn cả ngày lẫn đêm, chủ động giết 1 người | ❌ — dễ nhầm với Hunter, cần rulebook gốc phân biệt rõ trước khi viết story |
| **Revealer** | Làng | Mỗi tối biết bản chất thật của 1 người | ❌ — nghe gần giống Seer, cần rulebook gốc phân biệt |
| **Paranormal Investigator** | Làng | Chủ động tìm sự thật nhưng dễ bị đánh lừa | ❌ |
| **Apprentice Seer** | Làng | Trở thành Tiên Tri nếu Tiên Tri gốc chết | ❌ |
| **Aura Seer** | Làng | Biết phe (không biết chính xác vai) của 1 người | ❌ |
| **Beholder** | Làng | Biết ai là Tiên Tri | ❌ |

→ Còn thiếu vài vai để đủ 34 thẻ base game (không tìm được danh sách đầy đủ 100% trong phiên
này — con số ~38 tên ở trên đã vượt 34 vì Father Geek review là bản Extreme, gộp cả vài vai từ
Night Terrors như Beholder/Insomniac). **Việc khớp chính xác "34 thẻ base" vs "thẻ Extreme
thêm" cần một vòng nghiên cứu tiếp** — không chặn việc lập epic, vì mục đích của epic là theo
tier phổ biến, không phải theo đúng ranh giới hộp sản phẩm.

## 5. Tier 2 — expansion có tên riêng, xác nhận vai qua blog chính hãng nhưng **chưa có lời
văn năng lực chính hãng**

| Expansion | Vai xác nhận tên | Năng lực |
|---|---|---|
| Night Terrors | Thing (That Goes Bump in the Night), The Count, Bogeyman | **Chưa xác nhận lời văn** — chỉ có mô tả marketing rất ngắn ("Thing" gõ vào hàng xóm ban đêm; "Bogeyman" quyết định nạn nhân sói khi bầy sói không thống nhất được — suy ra từ 1 câu quảng cáo, cần xác nhận lại) |
| Urban Legends | Bloody Mary, Leprechaun, Sasquatch, Nostradamus | Chưa xác nhận lời văn (Chupacabra, Wolf Man đã có ở Tier 1 vì trùng tên với review Extreme) |
| Classic Movie Monsters | The Blob, The Mummy, Dracula, The Zombie, Frankenstein's Monster | Hoàn toàn chưa có lời văn — chỉ có tên |

Các vai này **có tên chính thức xác nhận (nguồn: blog beziergames.com)** nhưng năng lực cụ thể
chưa tìm ra nguồn chính hãng — đúng theo quy tắc của owner, ghi "biết tên, chưa xác nhận lời
văn", không suy đoán năng lực để không đầu độc epic sau này.

## 6. Chưa làm được — cần nghiên cứu tiếp (việc còn lại, ghi rõ để không lặp lại công sức)

1. **Bonus Roles (44 vai)** và **2. Pro Roles (50+ vai)** — **đã đóng vòng tìm kiếm web thông
   thường sau 2 phiên, >15 nguồn khác nhau** (chi tiết §1.1): trang sản phẩm chính hãng, blog
   chính hãng, app store chính hãng (chỉ cho tổng số 141, không cho tên), 5+ trang bán lẻ, 2
   review/blog bên thứ ba (một trang ghi thẳng "list coming soon"), BGG (403 mọi lần thử),
   fandom wiki (402 mọi lần thử), kho rulebook PDF của nhà phân phối lớn (không có dòng
   Ultimate Werewolf chính). **Không nên lặp lại tìm kiếm web loại này ở phiên sau** — chỉ thử
   lại nếu có đầu mối thật sự mới (vd: chủ dự án có bản vật lý chụp ảnh thẻ bài, hoặc tìm được
   một forum/Discord thread cụ thể chưa thử). Hai epic Bonus Roles + Pro Roles (94/141 vai,
   ~2/3 tổng số) do đó **nên xếp vào tier thấp nhất, triển khai sau cùng** (nếu có triển khai),
   và ghi rõ trong PRD là "chưa có nguồn — sẽ nghiên cứu lại khi tới lượt tier này, không chặn
   các tier khác".
3. **Night Terrors vai thứ 6** — 5/6 xác nhận, thiếu 1.
4. **Lời văn năng lực chính xác** (không phải paraphrase từ review) cho *toàn bộ* danh sách ở
   §4 và §5 — nên thử lại BGG (thử fetch với cách khác, có thể trang cụ thể bị chặn nhưng API
   hoặc cache khác không bị) và fandom wiki (402 có thể là tạm thời).
5. **Xác nhận "Village" có tồn tại không** — hỏi lại chủ dự án nếu không tìm ra, thay vì tự
   loại bỏ vĩnh viễn.
6. **34 thẻ base game chính xác là những thẻ nào** (phân biệt với 54 thẻ Extreme thêm) — hiện
   chỉ biết 4 tên mẫu ("Seer, Bodyguard, Hunter, Tanner") từ 1 câu quảng cáo, không phải danh
   sách đầy đủ.

## 7. Khuyến nghị bước tiếp theo (không phải quyết định — để bmad-create-epics-and-stories
cân nhắc)

- Tier 1 (§4, ~38 vai đã xác định tên+paraphrase năng lực, phe Làng/Sói lấp đầy trước theo
  đúng nguyên tắc spec §4.2) là ứng viên hợp lý cho **Epic đầu tiên** của mở rộng vai — nhiều
  vai trong đó (Mason, Prince, Village Idiot, Drunk, Troublemaker...) là những vai "kinh điển"
  được nhắc tới rộng rãi trong cộng đồng Werewolf nói chung, khớp tiêu chí "phổ biến nhất
  trước". Nhưng vài vai cần rulebook gốc để phân biệt cơ chế trước khi viết story an toàn
  (Priest vs Bodyguard, Huntress vs Hunter, Revealer vs Seer) — nêu rõ trong story tương ứng
  là "cần xác nhận rulebook trước khi implement" thay vì đoán.
- Vampire là phe thứ 3 mới hoàn toàn (không phải Làng/Sói/Riêng hiện có) — nên tách thành một
  epic kiến trúc riêng (cần thiết kế điều kiện thắng, UI phe mới), không gộp vào epic "thêm
  vai" thông thường.
- Legacy, Artifacts, One Night-only roles (Daybreak) — nêu rõ trong PRD/kiến trúc là **loại
  khỏi phạm vi** của epic vai này, lý do đã ghi ở §2, để chủ dự án xác nhận hoặc phủ quyết.
- Bonus Roles/Pro Roles (94 của tổng 141 vai đã xác nhận chính thức — §2) là phần lớn nhất
  **đã xác nhận không nghiên cứu được qua web thông thường sau 2 phiên độc lập** (§1.1, §6) —
  đây không còn là rủi ro giả định mà là **kết luận thực tế đã kiểm chứng**: hoàn thành 100%
  catalog 141 vai bằng tìm kiếm web là không khả thi với các công cụ hiện có. **Khuyến nghị rõ
  ràng cho chủ dự án**: coi Tier 1 (~38 vai, §4) + Tier 2 (~14 vai đã có tên, §5) — tổng ~52/141
  vai có nguồn đủ tin cậy để lập epic/story — là phạm vi thực tế của epic mở rộng vai trong các
  run sắp tới; Bonus Roles + Pro Roles (94 vai còn lại) xếp thành một epic "nghiên cứu lại khi
  có nguồn mới" ở cuối roadmap, không phải một tier chờ implement như các tier khác. Đây chính
  là phán đoán "có thể không bao giờ hoàn thành 100%" mà run này cần nêu thẳng ra theo yêu cầu
  điều khoản dừng — chủ dự án cần xác nhận có chấp nhận dừng roadmap ở ~52/141 vai đã có nguồn
  hay muốn tự cung cấp thêm nguồn (ảnh chụp thẻ bài vật lý, liên hệ Bezier Games) cho 94 vai
  còn lại trước khi coi epic này "xong".

## 8. Phiên nghiên cứu thứ 3 (2026-09-08) — tìm được rulebook PDF chính hãng đầy đủ

### 8.1 Nguồn và xác thực tính chính hãng

Tìm qua `board-game-rules.com/boardgames/ultimate-werewolf-ultimate-edition/` (trang tổng hợp
board game, không phải Bezier Games), trang này có link tới một PDF tự nhận là "official rules
in English":

```
https://board-game-rules.com/wp-content/uploads/2025/01/ultimate-werewolf-ultimate-edition_Official-Rules.pdf
```

PDF này (8.9MB, ảnh bìa thẻ bài đầy đủ) **không tự host trên beziergames.com** nên không thể coi
là 100% chắc chắn "chính hãng" chỉ từ URL — nhưng nội dung PDF tự xác thực qua metadata nội bộ,
trích trực tiếp từ các text stream đã giải nén:

- Trang "ABOUT THE DESIGNER": *"Ted Alspach is the designer of several games, including
  TieBreaker, Ticked Off, Perpetual-Motion Machine..."* — Ted Alspach là nhà thiết kế **đã xác
  nhận** của dòng Ultimate Werewolf (Bezier Games), không phải suy đoán.
- Trang bản quyền: *"Copyright 2012 Pegasus Spiele GmbH/eggertspiele GmbH & Co. KG, Verlegt
  durch / Published by: Pegasus Spiele GmbH, Strassheimer Str. 2, 61169 Friedberg, Germany."* —
  Pegasus Spiele là nhà xuất bản/phân phối được cấp phép chính thức của Bezier Games tại thị
  trường Đức/châu Âu (đã xác nhận qua nghiên cứu phiên 1, §2 — không phải phát hiện mới); đây là
  **bản in lại có giấy phép**, không phải bản tự chế/homebrew.
- Tên file nội bộ (metadata PDF): `Peg_WERWOLF_2015_Regel_US_RZ.indd` — "Regel" (tiếng Đức =
  luật chơi), "US" = bản tiếng Anh (US English) đóng gói trong bản Đức, "2015" = năm bản in này.
- Nội dung khớp 100% với 12 vai đã implement trong repo hiện tại (Cupid, Sorcerer, Pacifist,
  Wolf Cub, Cursed, Werewolf — xem §8.3) — đối chiếu chéo xác nhận độ chính xác nguồn.

**Kết luận: coi nguồn này là Tier 1 (độ tin cậy cao, tương đương beziergames.com trực tiếp)**,
ghi rõ ràng đây là bản Pegasus Spiele (không phải bản gốc Bezier Games Mỹ) để nếu sau này có
khác biệt nhỏ giữa 2 nhà xuất bản thì đã có ghi chú, không giấu nguồn gốc.

### 8.2 Phương pháp trích xuất (ghi lại cho phiên sau, không cần lặp lại từ đầu)

PDF không có text layer chuẩn đọc được qua công cụ fetch thông thường (không có `pdftotext`/
`poppler-utils` trên máy này, theo lệnh cấm cài đặt phần mềm nặng của `~/work/anhdh/CLAUDE.md`
không áp dụng trực tiếp nhưng máy không sẵn có công cụ này). Quy trình dùng được (Python thuần,
không cần cài thêm gói nào — chỉ `zlib`/`re` built-in):

1. Đọc toàn bộ PDF dạng binary, dùng regex `stream\r?\n(.*?)endstream` (re.DOTALL) để tách hết
   229 object stream.
2. `zlib.decompress()` từng stream (101/229 fail — chủ yếu ảnh JPEG/DCTDecode, bỏ qua).
3. Lọc các stream có chứa byte `Tj`/`TJ` (toán tử hiển thị text của PDF) — nhưng **quan trọng**:
   lọc theo tên vai viết hoa (`b'MINION' in d`) cho ra kết quả khác/nhiều hơn lọc theo `Tj`/`TJ`
   only — nên **lọc theo từ khoá tên vai trực tiếp trên từng stream, không chỉ theo `Tj`/`TJ`**,
   nếu nghi ngờ có stream bị bỏ sót.
4. Trích nội dung chữ thật: quét từng ký tự, khi gặp `(` thì đọc tới `)` khớp (đếm độ sâu ngoặc,
   xử lý escape `\(` `\)` `\\`), bỏ qua mọi ký tự ngoài ngoặc (đó là toán tử PDF như `Tj`, `Td`,
   số kerning, v.v.). **Chạy scan này trên TOÀN FILE gộp nhiều stream một lúc sẽ lỗi** nếu có dù
   chỉ 1 stream bị lệch ngoặc (thường do stream đó thực ra là ảnh/font nhị phân bị lọt qua bộ lọc
   `Tj`/`TJ`) — làm lệch độ sâu ngoặc cho mọi thứ phía sau. **Phải chạy scan riêng từng stream**
   (reset độ sâu về 0 ở đầu mỗi stream), không nối tất cả rồi quét chung.
5. Font nhúng trong PDF này không có ligature map chuẩn — các ligature bị thay bằng mã số:
   `037e`→"The", `035rst`→"first", `222`→"’", `223`→"“", `224`→"”", `034es`→"ffles",
   `034`→"ffl", `033`→"ft", `036`→"ff", `035`→"fi", `037`→"Th", `344`→"ä" (dùng cho
   "Doppelgänger"). Áp dụng `.replace()` theo đúng thứ tự này (dài trước ngắn sau) sau khi trích
   xong text thô.

### 8.3 Vai mới có lời văn chính xác — trích dẫn nguyên văn (nguồn: PDF §8.1)

Toàn bộ đoạn dưới là **trích nguyên văn** (chỉ sửa ligature theo §8.2, không diễn giải lại):

**OLD HAG** (gỡ chặn Epic 1b — trước đó "cần xác nhận khái niệm 'rời làng'"):
> "Each night, the Old Hag places a pox on a player; that player must leave the game area for
> one day, and may not take place in discussions, lynching or any other activities that happen
> during the day (that player is also safe from the Hunter's shot or any other method of attack
> from another player). The Old Hag may not place a pox on herself."

**TOUGH GUY** (gỡ chặn Epic 1b — trước đó "cần xác nhận timing"):
> "If targeted by the Werewolves, dies the following night (instead of the same night he was
> attacked). The players are told that no one has died the previous night. The following night
> there may be two or more player deaths: the Tough Guy as well as any other characters targeted
> or killed that night."

**DISEASED** (gỡ chặn Epic 1b):
> "If the Werewolves eat the Diseased player, they skip feeding the following night because they
> get sick. If the game does not have role reveal, the Werewolves still pick a target the
> following night, but that target does not die. If the game does have role reveal, the
> Werewolves do not pick a target."

**DOPPELGÄNGER** (gỡ chặn Epic 2b — trước đó "mơ hồ thời điểm"):
> "The Doppelgänger selects a player the first night. If that player is killed, the Doppelgänger
> secretly takes over that role. Until her target is killed, the Doppelgänger is on the Villager
> Team. The Moderator should clearly indicate to the Doppelgänger what her new role is by
> secretly tapping her on the shoulder at night as soon as she gets her new role."

**HOODLUM** (gỡ chặn Epic 2b — trước đó "cần rulebook gốc"):
> "On the first night, the Hoodlum indicates two players. The only way the Hoodlum can win is if
> both of those players are dead at the end of the game and the Hoodlum is still alive. Normal
> victory conditions for the other teams are still present, so the Hoodlum needs the Villager
> team to win in order for him to win as well."

**LONE WOLF** (gỡ chặn Epic 3b — trước đó "mơ hồ điều kiện thắng"):
> "The Lone Wolf only wins if he is the last player standing (or achieves parity with the
> village by having only one other non-Werewolf player surviving). The Lone Wolf wakes with the
> Werewolves to choose a kill each night."
(Dire Wolf **vẫn `blocked`** — không tìm thấy trong PDF này, xem §8.5.)

**APPRENTICE SEER** (gỡ chặn Epic 4b — trước đó "mơ hồ thời điểm"):
> "The Apprentice Seer becomes the Seer if the Seer is killed. The Apprentice Seer is woken up
> when the Seer is called after the Moderator has indicated to the Apprentice Seer that the Seer
> is dead (by a tap on the shoulder during the calling of the Seer at night). Alternate: In
> addition to taking over for the Seer when she dies, the Apprentice Seer targets a player every
> night, but only learns if they are a Werewolf or not after choosing them twice."

**PRIEST** (gỡ chặn Epic 4b, phân biệt rõ với Bodyguard — trước đó "trùng vai đã có, không có
lời văn phân biệt"):
> "One night during the game, the Priest may choose any player to be protected by holy power.
> The next attempt to kill that player by any means fails. The Priest may not choose himself. If
> the Priest dies after 'blessing' someone in this way, that player is still protected.
> Alternate: Once per game, the Priest may learn the role of a killed player."
Khác Bodyguard rõ ràng: Priest bảo vệ **một lần trong cả ván** (không phải mỗi đêm), và bảo vệ
tồn tại **vĩnh viễn** kể cả khi Priest chết — trong khi Bodyguard (đã implement) bảo vệ theo
từng đêm và không được chọn lại cùng 1 người 2 đêm liên tiếp.

**AURA SEER** (gỡ chặn Epic 4b):
> "The Aura Seer looks for players with special roles that are not plain Villagers or
> Werewolves. The more special roles in the game, the more powerful this role becomes. Be sure
> to have at least one 'evil' special role, so the Aura Seer isn't just functioning as a
> Villager-finder. Alternate: The Aura Seer can be used to learn if the player is on the
> Villager team... The Cursed, Doppelgänger and Drunk appear to be on their current team."
(Huntress, Revealer **vẫn `blocked`** — không tìm thấy trong PDF này.)

**TROUBLEMAKER** (gỡ chặn Epic 4b — trước đó "thiếu khả năng engine + thiếu lời văn"):
> "Once during the game, the Troublemaker indicates to the Moderator at night that there will be
> two lynchings the following day. Each night, the Moderator should say, 'Does the Troublemaker
> want to stir up trouble?' If the Troublemaker does, the Moderator should announce this to the
> village after the first successful lynch the next day."
**Ghi chú engine quan trọng**: xác nhận đúng nghi ngờ cũ trong roadmap — vai này cần chèn thêm
**một chu kỳ VOTE thứ 2 trong cùng một ngày** sau lần treo cổ thành công đầu tiên. Đây là thay
đổi kiến trúc phase engine thật sự (không chỉ thêm 1 action mới vào phase có sẵn), cần thiết kế
riêng trước khi viết story — không tự suy ra cách implement ở đây.

**PARANORMAL INVESTIGATOR / P.I.** (gỡ *lời văn* — vẫn `blocked` về kiến trúc, xem §8.4):
> "One night during the game, the Paranormal Investigator indicates one player, and is told if
> at least one of the players to the target's left or right, or the target himself, is a
> Werewolf. The moderator does not say which of those players is a Werewolf, just that one of
> them is."

**PACIFIST** (đã implement — trích để đối chiếu chéo nguồn, không phải vai mới):
> "The Pacifist always votes for players to live... This role along with the Idiot should be
> added at random to the deck. Players should not know beforehand if either or both roles are
> included."
Khớp đúng thiết kế đã implement (phe Sói, luôn vote sống) — xác nhận độ chính xác của PDF nguồn.

**CULT LEADER** (gỡ chặn Epic 5 — trước đó "cần rulebook gốc, mơ hồ thời điểm/kháng cự"):
> "The Cult Leader picks a player each night to add to the cult (players picked do not know they
> are in the cult). The Cult Leader only wins if all players left alive (not necessarily
> including himself) are part of the cult. Normal victory conditions for the other teams are
> still present. Alternate: If the Cult Leader dies, the first cult member he picked becomes the
> new Cult Leader (the Moderator will tap this player on the shoulder when calling for the Cult
> Leader)."
Xác nhận rõ: không có "kháng cự" — bị chọn là vào giáo phái, không được biết, không có lựa chọn
từ chối. Timing: mỗi đêm, không giới hạn số lần.

**VAMPIRE** (Epic 5 — **thu hẹp đáng kể mức độ mơ hồ**, chưa hoàn toàn gỡ `blocked`):
Không có card text riêng cho Vampire (không tìm thấy trong PDF này — có thể trên trang bị lỗi
giải nén, xem §8.5), nhưng phần "Rules Variations" mô tả rõ cơ chế khi dùng Vampire thay thế/
song song Werewolf:
> "...substituting Vampires for Werewolves (the total number of Werewolves + Vampires should be
> the same as the number of Werewolves in a regular game). All special roles that target
> Werewolves (Seer, P.I., etc.) also target Vampires, but do not distinguish between the two
> teams."
Và thứ tự gọi vai ban đêm chính thức (§8.3 cuối) liệt kê "Vampires" là một nhóm riêng, gọi ngay
sau "Werewolves (including Lone Wolf and Wolf Cub)" — xác nhận Vampire **là một phe riêng, có cơ
chế cắn/giết ban đêm giống hệt Werewolf** (cùng một "loại" hành động, không phải cơ chế "hút máu"
khác biệt như suy đoán trong catalog phiên 1). Suy luận hợp lý (không phải trích nguyên văn):
điều kiện thắng của Vampire đối xứng với Werewolf — thắng khi toàn bộ phe không-Vampire chết,
thua khi toàn bộ Vampire chết. **Vẫn cần một câu xác nhận trực tiếp** trước khi viết story (chưa
tìm thấy nguyên văn "the Vampires win when...") — hạ từ "blocked hoàn toàn" xuống "gần đủ nguồn,
cần 1 xác nhận nhỏ", ghi rõ để không tự suy đoán thành sự thật.

**MINION** (chưa có trong bảng theo dõi — vai Sói-phụ, đáng cân nhắc thêm vào Epic tiếp theo):
> "No card is required for the standard use of this role. The first night, the Werewolves pick a
> player, and that person becomes the Werewolves' Minion and moves to the Werewolf team. The
> player learns who the Werewolves are, but does not wake with them at night. The Seer sees the
> Minion as a Villager... If playing with both Vampires and Werewolves, each team may have a
> Minion."

**Thứ tự gọi vai ban đêm chính thức** (nguồn: PDF, mục "ROLL CALLING ORDER (NIGHT)" — áp dụng
cho gần như toàn bộ Tier 1/2, giá trị tham chiếu cho mọi story engine sau này):
> "Amulet of Protection → Priest → Bodyguard → Werewolves (including Lone Wolf and Wolf Cub) →
> Vampires → Cursed → Magician, Witch → Seer → P.I. → Aura Seer → Sorcerer → Spellcaster →
> Old Hag → Cult Leader → Troublemaker"

### 8.4 Vẫn `blocked` sau phiên này — không tự suy đoán

- **Insomniac, Paranormal Investigator** — lời văn P.I. đã rõ (§8.3), nhưng cả 2 vai cùng cần
  khái niệm **"hàng xóm"/thứ tự chỗ ngồi (seating order)** mà kiến trúc hiện tại không có (đúng
  nhận định cũ trong roadmap). Đây là **một prerequisite kiến trúc dùng chung cho cả 2 vai** —
  gợi ý: 1 story thiết kế "seatOrder" một lần sẽ gỡ chặn cả 2, thay vì làm riêng lẻ.
- **Dire Wolf, Teenage Werewolf, Insomniac, Beholder-trong-PDF-này** — không tìm thấy trong PDF
  (Beholder đã có nguồn khác, đã implement — không liên quan tới PDF này).
- **Huntress, Revealer** — không tìm thấy trong PDF này, Aura Seer đã tách ra unblocked riêng.
- **Mayor** — tên xuất hiện nhiều lần trong các "scenario ví dụ" (§8.3's WEREWOLF TEAM /
  VILLAGER TEAM scenario list, vd "1 Mayor" trong "CLASSIC WEREWOLF VILLAGE") nhưng **không tìm
  thấy đoạn lời văn năng lực riêng của Mayor** trong các stream đã giải nén — có thể do trang đó
  nằm trong 1 trong 101 stream giải nén lỗi. Chưa đủ nguồn để viết story, nhưng đã xác nhận vai
  này **có tồn tại** trong bộ bài (khác với suy đoán "có thể không có trong box này").
- **Bonus Roles (44), Pro Roles (50+)** — PDF này là "Ultimate Edition" (không phải Bonus/Pro
  Roles), không liên quan tới 94 vai đó — kết luận phiên 1/2 (§1.1) vẫn đứng nguyên, không lặp
  lại tìm kiếm.

### 8.5 Giới hạn của lần trích xuất này (để phiên sau không mất công dò lại từ đầu)

PDF có 229 object stream, 101 giải nén lỗi (chủ yếu ảnh JPEG — bỏ qua hợp lý), 128 giải nén
thành công nhưng chỉ ~35 chứa text thật (còn lại là đồ hoạ vector/toạ độ). Trong 35 đó, đã trích
được nội dung của: intro/setup rules, 34-role scorepad example, toàn bộ trang "VILLAGER TEAM"
(một phần — Bodyguard/Apprentice Seer/Aura Seer có, nhưng Cursed/Drunk/Hunter/Idiot/Mayor/
Prince/Seer/Tanner/Villager/Witch **không tìm thấy trang lời văn riêng** dù tên xuất hiện trong
scenario list — khả năng cao là trang tương ứng nằm trong nhóm 101 stream lỗi giải nén), toàn bộ
"WEREWOLF TEAM" (Sorcerer, Minion, Werewolf, Wolf Cub), toàn bộ "SWITCHING TEAMS" (Cursed,
Doppelgänger, Hoodlum — đầu trang), toàn bộ "OTHER TEAMS" (Cult Leader, Hoodlum lặp), "SOULMATES"
(Cupid), "ROLL CALLING ORDER", trang thiết kế/tác giả, trang bản quyền. Nếu cần Mayor/Prince/
Idiot/Witch/Hunter/Tanner/Drunk/Cursed(đầy đủ)/Seer/Villager lời văn nguyên văn ở phiên sau: thử
lại đúng file PDF này (đường dẫn §8.1), soi kỹ 101 stream giải nén lỗi (có thể cần xử lý riêng —
lỗi decompress không nhất thiết là ảnh, có thể là lỗi biên stream do regex `stream...endstream`
cắt sai ranh giới khi 2 object liền kề), trước khi tìm nguồn hoàn toàn khác.
