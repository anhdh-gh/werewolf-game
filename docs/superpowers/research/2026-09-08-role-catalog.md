# Danh mục vai Ultimate Werewolf (Bezier Games) — nghiên cứu nguồn, Task 1

> Trạng thái: **một phần** — đủ để bắt đầu lập epic/story cho Tier 1 và Tier 2, còn Bonus
> Roles (44 vai) và Pro Roles (50+ vai) chưa liệt kê được từng vai cụ thể (xem §6). Đây là
> input cho `bmad-create-epics-and-stories` / `bmad-spec`, không phải bản thiết kế implement.

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
  riêng lẻ **chưa xác nhận được**).
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

1. **Bonus Roles (44 vai)** — không tìm được danh sách tên trên `beziergames.com`, blog chính
   hãng, BGG (403), hay fandom wiki (402) trong phiên này. Thử tiếp: tìm ảnh chụp thẻ bài trên
   Amazon/eBay listing (thường có ảnh sản phẩm chụp rõ tên thẻ), review video YouTube có liệt
   kê, hoặc trang app store "Ultimate Werewolf App" mô tả tính năng có thể liệt kê vai.
2. **Pro Roles (50+ vai)** — tương tự, chưa có danh sách tên.
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
- Bonus Roles/Pro Roles (94 vai gộp, gần một nửa tổng số ~196 thẻ) là phần lớn nhất chưa
  nghiên cứu được — **rủi ro thực tế cho tiến độ toàn bộ epic vai**: nếu không tìm được nguồn
  đáng tin cho gần 100 vai này, "hoàn thành toàn bộ catalog" có thể không bao giờ khả thi bằng
  tìm kiếm web thông thường. Đây là tín hiệu sớm cho điều khoản dừng của run: nếu sau vài lần
  thử thêm (ảnh sản phẩm, video review, rulebook PDF từ nguồn khác) vẫn không ra được danh
  sách, cần nêu thẳng với chủ dự án ở notes.md rằng phần này có thể phải dừng ở Tier 1+2 xác
  nhận được, không cố phủ 100% con số "hơn 100 vai".
