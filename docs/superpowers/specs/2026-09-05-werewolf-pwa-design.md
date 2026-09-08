# Ma Sói PWA — Thiết kế hệ thống

> Trạng thái: đã duyệt · Ngày: 2026-09-05 · Nhánh: `main` (viết lại từ đầu)

## 0. Quyết định đã chốt sau brainstorm

- **Không có chủ phòng.** Ai vào đầu tiên không có đặc quyền gì, ai bấm Bắt đầu cũng được.
- **Vắng mặt (rớt mạng, khoá màn hình, chuyển app) không bao giờ giết ai.** Chỉ mất lượt.
  Xem mục 5.
- **Đăng nhập bằng Google, không có lối tắt cho khách.** Đơn giản, đổi lại người mượn máy
  phải có tài khoản Google trên máy đó.
- **Chat sói và chat làng tắt mặc định, chỉ bật khi phòng bật "Chơi xa".** Ngồi cùng bàn thì
  nói bằng miệng — bật chat lúc đó chỉ tạo tiếng thông báo vô nghĩa và phá luật nhắm mắt.
  Chat và video call cùng nằm sau một công tắc duy nhất là "Chơi xa".
- **Voice (LiveKit) chỉ dành cho phòng bật "Chơi xa".**
- **Deploy: Vercel (Next.js) + Firebase (Auth, RTDB) — cả hai đều dùng gói miễn phí.**
- **Domain:** `wolf.anhdh.net`, DNS do Vercel quản lý.

## 1. Bối cảnh

Repo này đã có một bản chạy được: backend Express + Socket.IO + MySQL (nhánh `backend`),
web Next.js (nhánh `website`), app Flutter (nhánh `mobile`). Bản đó chơi được nhưng vướng
ba nhóm vấn đề khiến việc sửa tiếp tốn hơn viết lại:

- **Mất kết nối là mất ván.** Web cũ coi sự kiện `disconnect` là lỗi chí mạng và đá người
  chơi về trang chủ. Không có cơ chế lấy lại trạng thái, nên chỉ cần một lần chuyển sóng
  4G là hỏng.
- **Rớt mạng đồng nghĩa với chết.** Server đặt `is_alive = false` ngay khi socket đứt, không
  có thời gian ân hạn, không cho vào lại.
- **Vai trò của mọi người được gửi cho mọi máy.** Việc giấu vai làm hoàn toàn ở client, nên
  một lỗi hiển thị là lộ sạch (đã xảy ra thật — nhánh `fix_hidden_name_bug`).

Bản viết lại giữ nguyên luật chơi đã được kiểm chứng qua nhiều ván, thay toàn bộ phần hạ tầng.

## 2. Trải nghiệm mục tiêu

Cách chơi chuẩn là **mười người ngồi quanh một bàn, mỗi người một điện thoại đóng vai lá bài úp**.
Điện thoại nằm trong túi hoặc úp mặt xuống bàn suốt phần lớn thời gian; nó tự gọi chủ nhân
khi đến lượt. Không ai phải cầm màn hình sáng choang cả ván.

Từ đó suy ra ba ràng buộc chi phối gần như mọi quyết định kỹ thuật phía dưới:

1. Ván đấu phải chạy tiếp khi màn hình tắt hoặc người chơi chuyển sang app khác.
2. Vắng mặt là hành vi bình thường, không phải lỗi, và tuyệt đối không được phạt bằng cái chết.
3. Vào lại phải tức thì và không mất gì — mở app lên là thấy đúng chỗ ván đang diễn ra.

Chơi từ xa (mỗi người một nơi) là trường hợp phụ được hỗ trợ đầy đủ, khác biệt duy nhất là
bật thoại qua LiveKit.

## 3. Phạm vi

**Trong phạm vi v1:** đăng nhập Google; tạo và vào phòng bằng mã; mười hai vai (§4.1, mở
rộng từ tám sau brainstorm ban đầu); luồng đêm/ngày đầy đủ có đếm ngược; chat sói và chat
làng; dẫn truyện bằng giọng nói; chạy nền khi khoá màn hình; cài đặt như app (PWA); thông
báo đẩy; thoại LiveKit cho phòng chơi xa.

> Đăng nhập, phòng, vai, và luồng đêm/ngày (Game Engine — xem plan
> `docs/superpowers/plans/2026-09-07-game-engine.md`) đã xong, chưa kiểm chứng trên
> Firebase thật. Chat, dẫn truyện giọng nói, chạy nền, PWA, thông báo đẩy, thoại LiveKit
> **chưa làm** — gộp lại thành sub-project Resilience, chưa được giao.

**Ngoài phạm vi v1:** bảng xếp hạng, thống kê, lịch sử ván; kết bạn; tuỳ biến bộ vai ngoài
mấy công tắc bật/tắt; khán giả; chống gian lận. Người chơi là bạn bè của nhau — mở DevTools
ra soi vai người khác là chuyện tự họ làm hỏng cuộc vui của mình, không đáng để đánh đổi
độ phức tạp.

**Không có chủ phòng.** Người tạo phòng chỉ đơn giản là người vào đầu tiên, không có đặc quyền
gì. Ai cũng bấm Bắt đầu được, miễn đủ người. Mọi thứ còn lại tự động hết.

## 4. Luật chơi

### 4.1 Các vai

Thêm vào bản đầu 4 vai mới (Kẻ Phản Bội, Thợ Săn, Thần Tình Yêu, Sói Giả) để đôi bên Sói và
Làng đều có chiều sâu — xem lý do sắp xếp ở §4.2. Vẫn chỉ một vai phe Riêng (Chán Đời); phe
thứ 3 luôn là phần thêm sau cùng, không phải trọng tâm.

| Vai | Phe | Năng lực |
|---|---|---|
| Ma Sói | Sói | Mỗi đêm cả bầy cùng chọn một người để cắn. Đa số thắng. |
| Kẻ Phản Bội | Sói | Biết hết đồng bọn sói và thắng cùng phe Sói, nhưng không thức đêm, không tham gia cắn. Tiên Tri soi vào thấy là **dân thường** — đây chính là vai sói mà Tiên Tri soi không ra. |
| Tiên Tri | Làng | Mỗi đêm soi một người, biết người đó có phải sói không (Kẻ Phản Bội và Sói Giả là hai ngoại lệ cố ý — xem cột năng lực của chúng). |
| Bảo Vệ | Làng | Mỗi đêm che chở một người khỏi bị sói cắn. Không được che cùng một người hai đêm liên tiếp. |
| Phù Thuỷ | Làng | Có một bình cứu và một bình độc, mỗi bình dùng một lần cả ván. Được biết nạn nhân của sói đêm đó trước khi quyết định cứu. |
| Thợ Săn | Làng | Chết vì bất kỳ lý do gì (đêm, bị treo cổ, bị đầu độc) thì được bắn chết ngay một người khác trước khi rời ván. |
| Thần Tình Yêu | Làng | Đêm đầu tiên (trước cả Đêm Xuống) chọn ghép hai người — kể cả chính mình — thành một cặp đôi. Một trong hai chết vì bất kỳ lý do gì thì người còn lại chết theo vì đau lòng, bất kể người đó thuộc phe nào. |
| Kẻ Bịt Miệng | Làng | Mỗi đêm chọn một người; hôm sau người đó không được nói. Xem §4.7 về cách áp dụng. |
| Bị Nguyền | Làng | Khởi đầu là dân. Lần đầu bị sói cắn thì không chết mà **hoá thành sói**. |
| Sói Giả | Làng | Không có năng lực gì — nhưng Tiên Tri soi vào thấy là **sói** dù thực ra là dân. Đây chính là vai dân mà Tiên Tri soi nhầm ra sói. |
| Dân Làng | Làng | Không có năng lực. |
| Chán Đời | Riêng | Thắng một mình nếu chết, bằng bất kỳ cách nào. |

> Đổi tên so với bản cũ: vai `SILENCED` ("Bị câm") được đổi thành **Kẻ Bịt Miệng**. Tên cũ sai
> nghĩa — đây là người *gây* câm cho kẻ khác, không phải người bị câm.

> Thần Tình Yêu v1 chỉ làm đúng phần "chết theo nhau". Luật đầy đủ của vai này (nếu hai người
> yêu nhau khác phe thì họ tách thành phe thứ ba riêng, thắng nếu chỉ còn lại đúng hai người đó)
> **chưa làm** — ghi lại ở đây để không quên, cân nhắc thêm khi phe Riêng cần mở rộng tiếp.

### 4.2 Chia vai

> **Superseded 2026-09-08** (xem `docs/superpowers/plans/2026-09-08-deck-builder.md`): công
> thức auto-compute + công tắc bật/tắt bên dưới không còn đúng với code nữa. Người tạo phòng
> giờ chọn tường minh số lượng từng vai (kể cả Sói/Tiên Tri/Phù Thuỷ/Dân Làng, không còn vai
> nào "bắt buộc theo công thức") qua `DeckBuilder`, ràng buộc duy nhất còn lại là deck phải có
> ≥1 vai phe Sói và tổng trong khoảng 4–16. Ai trong số người đã join nhận vai nào **vẫn** ngẫu
> nhiên và giấu kín y hệt — chỉ đổi cách deck được soạn, không đổi cách chia. Đoạn dưới đây giữ
> lại làm lịch sử/tham khảo thứ tự ưu tiên cũ, không còn là hành vi thật của `buildRoleList`.

**Thứ tự ưu tiên khi mở rộng bộ vai: Sói và Làng lấp đầy trước, phe Riêng luôn lấp sau
cùng.** Lý do: Sói và Làng là hai phe phải đối đầu nhau mỗi ván, thêm vai ở đây làm phong phú
thế trận chính. Phe Riêng chỉ thắng một mình, thêm vai ở đó không làm ván đấu chính (Sói và
Làng) sâu hơn — nên chỉ nên lấp khi phòng đã đủ đông để cả hai phe chính đã có đủ vai.

Với `n` người chơi (4 ≤ n ≤ 16):

- Số Ma Sói (vai cắn đêm thật sự — Kẻ Phản Bội không tính vào đây): `floor((n - 1) / 4) + 1`
- Luôn có: Tiên Tri, Phù Thuỷ, ít nhất một Dân Làng
- Chỗ còn lại lấp theo thứ tự (Sói và Làng lấp hết trước, Chán Đời — phe Riêng — luôn ở cuối):
  Bảo Vệ → Kẻ Phản Bội → Thợ Săn → Thần Tình Yêu → Kẻ Bịt Miệng → Bị Nguyền → Sói Giả →
  Chán Đời → Dân Làng

Trước khi bắt đầu, phòng có mấy công tắc bật/tắt từng vai phụ. Không cần chỉnh gì cũng chơi
được — mặc định là bật hết.

### 4.3 Luồng phase

Trình tự một vòng, kèm thời lượng mặc định:

```
SẢNH  →  XEM VAI (20s, chỉ một lần đầu ván)
       →  GHÉP ĐÔI (20s, chỉ một lần đầu ván, chỉ khi có Thần Tình Yêu)
       →  ĐÊM XUỐNG (8s)
       →  TIÊN TRI (30s)  →  BẢO VỆ (30s)  →  BỊT MIỆNG (30s)
       →  SÓI (40s)       →  PHÙ THUỶ CỨU (30s)  →  PHÙ THUỶ GIẾT (30s)
       →  BỊ NGUYỀN (15s)
       →  RẠNG SÁNG (công bố người chết, xử lý Thợ Săn và cặp đôi nếu có)
       →  THẢO LUẬN (180s)  →  BỎ PHIẾU (60s)  →  KẾT QUẢ BỎ PHIẾU (xử lý Thợ Săn nếu có)
       →  quay lại ĐÊM XUỐNG
KẾT THÚC (20s)
```

GHÉP ĐÔI giống XEM VAI ở chỗ chỉ chạy đúng một lần, trước đêm đầu tiên — không phải vai nào
cũng có, và **Kẻ Phản Bội, Sói Giả không có phase riêng nào cả** (không thức đêm, không hành
động, chỉ ảnh hưởng tới cách Tiên Tri soi và cách chia vai).

Phase của một vai bị **bỏ hẳn** nếu vai đó không có trong ván. Nếu vai có mặt nhưng người
giữ vai đã chết, phase vẫn chạy với thời lượng giả 15 giây — nếu không, người khác sẽ suy ra
được vai nào đã chết chỉ bằng cách bấm giờ.

Phase kết thúc sớm khi **tất cả người chơi được yêu cầu hành động trong phase đó đã xong**.
Hết giờ mà chưa xong thì coi như bỏ lượt.

Khác bản cũ: bản cũ quay lại XEM VAI ở đầu mỗi đêm. Bản mới chỉ xem vai một lần lúc bắt đầu;
vai của bạn luôn tra lại được bất cứ lúc nào bằng một nút giữ-để-xem trên màn hình.

### 4.4 Phân xử ban đêm

Đọc hành động của đêm rồi tính theo đúng thứ tự này:

1. Bảo Vệ chọn `P`. Sói chọn `W` (đa số phiếu trong bầy). Phù Thuỷ cứu `H`, đầu độc `K`.
2. Nếu `W == P` hoặc `W == H` → mục tiêu của sói sống sót.
3. Ngược lại, nếu người bị cắn là **Bị Nguyền** và chưa hoá → đổi phe thành sói, không chết.
4. Ngược lại → chết vì sói.
5. `K` chết vì độc. **Độc không chặn được** — bảo vệ và bình cứu đều vô hiệu với nó.
6. Người bị Bịt Miệng chọn sẽ mang trạng thái câm trong phase Thảo Luận hôm sau.

> Sửa lỗi bản cũ: bản cũ dùng phép trừ tập hợp `{cắn, độc} − {bảo vệ, cứu}`, khiến bảo vệ và
> bình cứu vô tình hoá giải luôn cả thuốc độc. Sai luật.

Sau khi có danh sách người chết đêm đó (bước 1–5), áp thêm hai lớp không phụ thuộc vai nào
gây ra cái chết, theo thứ tự:

7. **Thần Tình Yêu:** nếu đúng một trong hai người của cặp đôi nằm trong danh sách chết, thêm
   người còn lại vào danh sách chết vì đau lòng — dù người đó không bị sói cắn, không bị độc,
   không bị treo cổ. Áp dụng lại bước này ở cả RẠNG SÁNG lẫn KẾT QUẢ BỎ PHIẾU, vì cặp đôi có
   thể chết cách nhau một ngày.
8. **Thợ Săn:** với mỗi người trong danh sách chết đang giữ vai Thợ Săn, hỏi họ chọn một người
   còn sống để bắn chết ngay, trước khi công bố cả danh sách. Người bị bắn cũng có thể kéo
   theo người yêu của họ (áp lại bước 7). Một Thợ Săn tự bắn mình là lựa chọn hợp lệ (không bắn ai).

### 4.5 Bỏ phiếu ban ngày

Người còn sống bỏ phiếu treo cổ một người, hoặc bỏ phiếu trắng. Nhiều phiếu nhất thì chết.
**Hoà thì không ai chết.** (Bản cũ chọn người được ghi nhận trước — tuỳ tiện và khó đoán.)

### 4.6 Điều kiện thắng

Kiểm tra sau mỗi lần công bố người chết, theo thứ tự:

1. **Chán Đời** chết → Chán Đời thắng một mình, ván kết thúc ngay.
2. Không còn sói → phe Làng thắng.
3. Số sói ≥ số người còn lại không phải sói → phe Sói thắng.

**Vai không bao giờ được tiết lộ, kể cả sau khi ván kết thúc.** Kết thúc ván chỉ công bố
phe nào thắng và ai còn sống — không lật vai của bất kỳ ai. Đây là áp dụng triệt để nguyên
tắc "đừng gửi" ở §12 (Server không bao giờ gửi vai của người khác cho một client) vào chính
thời điểm mà hầu hết bản Ma Sói khác coi là ngoại lệ hợp lý. Lý do giữ nguyên tắc: vai chỉ nên
lộ qua cách chơi và suy luận trong bàn, không nên có màn hình xác nhận đúng/sai sau ván — giữ
được sự tò mò và tranh luận cho ván sau, và không có cơ chế nào để lộ sai vai vì máy chủ không
bao giờ gửi trường đó đi. Phòng quay về sảnh, giữ nguyên người chơi để chơi ván mới.

### 4.7 Trạng thái câm được áp dụng thế nào

Vì chat chỉ bật khi phòng bật "Chơi xa" (§0), năng lực của Kẻ Bịt Miệng không thể chỉ là
"khoá ô chat" — nếu vậy vai này vô dụng ở chế độ chơi chính là ngồi cùng bàn. Trạng thái câm
được áp dụng theo đúng cách ma sói ngoài đời vẫn làm, cộng thêm phần cưỡng chế khi chơi xa:

- **Luôn luôn, ở mọi chế độ:** người bị câm nhận thông báo rõ ràng trên máy mình ("Hôm nay
  bạn không được nói"), và cả bàn thấy dấu câm cạnh tên người đó trong danh sách. Ngồi cùng
  bàn thì đây là luật danh dự, giống hệt việc quản trò tuyên bố ai bị câm — không cần và
  không thể cưỡng chế bằng phần mềm.
- **Thêm vào đó, khi phòng bật "Chơi xa":** ô chat của người đó bị khoá, và token LiveKit của
  họ không được cấp quyền publish trong phase Thảo Luận, nên micro thật sự không phát được.

Nói cách khác, phần thông báo là bắt buộc và đủ để vai này có nghĩa; phần khoá chat/micro chỉ
là lớp cưỡng chế thêm khi kênh nói chuyện nằm trong tay ứng dụng.

## 5. Mô hình kết nối và vắng mặt

Đây là phần cốt lõi, và là phần bản cũ làm sai.

**Vắng mặt không giết ai.** Ngắt kết nối, khoá màn hình, chuyển app, hết pin — không cái nào
làm bạn chết. Bạn chỉ bỏ lỡ lượt của mình trong phase đang chạy. Chết chỉ đến từ ba nguồn:
bị sói cắn, bị treo cổ, bị phù thuỷ đầu độc. Rời phòng chủ động là cách duy nhất tự loại mình.

Đây là thay đổi có chủ ý so với luật ban đầu người dùng nêu. Lý do bản cũ giết người rớt mạng
là để bàn không treo chờ họ bấm nút. Có đếm ngược rồi thì lý do đó biến mất: hết giờ là phase
tự chuyển, người vắng không cản được ai. Giữ lại luật chết chỉ còn tác dụng phá ván — và nó
mâu thuẫn trực tiếp với trải nghiệm "cất điện thoại vào túi" ở mục 2.

**Hiện diện là thông tin, không phải hình phạt.** Người khác thấy tên bạn mờ đi kèm chữ
"đang vắng". Vậy là đủ để cả bàn biết mà chờ hay bỏ qua.

**Vào lại là tức thì.** Firebase Realtime Database tự đồng bộ lại nguyên cây dữ liệu ván đấu
khi kết nối trở lại. Không cần viết logic khôi phục. Mở app lên là thấy đúng phase, đúng số
giây còn lại, đúng danh sách người sống.

## 6. Kiến trúc

### 6.1 Thành phần

- **Next.js trên Vercel** — giao diện PWA, và vài API route nhỏ chạy trên Node runtime.
- **Firebase Realtime Database** — trạng thái ván đấu, đường truyền thời gian thực chính.
- **Firebase Authentication** — đăng nhập Google.
- **Firebase Cloud Messaging** — thông báo đẩy đánh thức người chơi.
- **LiveKit Cloud** — thoại, chỉ bật cho phòng chơi xa.

Dùng Realtime Database chứ không phải Firestore. RTDB giữ một WebSocket duy nhất, có hàng đợi
ghi khi offline, có `onDisconnect()` do chính hạ tầng Firebase thực thi, và độ trễ thấp hơn
đáng kể cho dữ liệu nhỏ đổi liên tục — đúng hình dạng bài toán này.

### 6.2 Hai đường ghi

**Người chơi ghi thẳng vào RTDB.** Mọi hành động cá nhân — chọn mục tiêu, bấm xong, gửi chat —
là một lệnh ghi vào đúng ô của mình. Nhờ vậy chúng thừa hưởng hàng đợi offline của SDK: bấm
vote lúc mất sóng thì lệnh nằm chờ và tự gửi khi có mạng lại. Không bao giờ mất thao tác vì
đường truyền.

**Việc phân xử do Vercel làm.** Chia vai, tính người chết, chuyển phase, kiểm tra thắng thua
nằm sau một endpoint duy nhất `POST /api/games/[gameId]/advance`, dùng Firebase Admin SDK.

### 6.3 Ai gọi advance

Không bầu trọng tài, không có ai giữ vai điều phối. **Mọi máy đều gọi**, khi một trong hai
điều kiện xảy ra: đồng hồ của nó vượt qua `endsAt`, hoặc nó vừa thấy đủ người bấm xong.

Endpoint chống gọi trùng bằng một transaction trên `phase.version`: máy đầu tiên tăng version
và thực hiện chuyển phase, các máy sau đọc thấy version đã đổi rồi thì không làm gì. Gọi mười
lần cũng chỉ chuyển một lần.

Cách này bỏ được cả một lớp vấn đề: không có điểm chết duy nhất, không có tình trạng hai máy
cùng tưởng mình là trọng tài, và một người rớt mạng không làm treo bàn. Chỉ cần còn đúng một
máy online là ván chạy tiếp. Mỗi máy chờ ngẫu nhiên 0–400ms trước khi gọi để đỡ dồn cục.

### 6.4 Đồng hồ

Phase mang mốc `endsAt` là timestamp tuyệt đối do server ghi. Máy khách tự đếm ngược từ đó,
sau khi trừ đi độ lệch đồng hồ đo được qua `/.info/serverTimeOffset` của RTDB.

Không có luồng server đẩy từng giây, nên cũng không có gì để đứt. Vào muộn hay vào lại giữa
chừng đều biết ngay còn bao nhiêu giây chỉ bằng cách đọc một giá trị.

### 6.5 Giấu vai

Vai của mỗi người nằm ở `/private/{gameId}/{uid}`, và Security Rules chỉ cho chính `uid` đó đọc.
Server ghi sẵn vào đây mọi thứ riêng tư mà người đó cần biết: vai của mình, kết quả soi của
Tiên Tri, nạn nhân đêm nay cho Phù Thuỷ, danh sách đồng bọn cho Sói.

Máy khách không bao giờ nhận dữ liệu vai của người khác. Điều này không nhằm chống gian lận —
mà để xoá hẳn lớp lỗi lộ vai của bản cũ. Không có dữ liệu thì không có gì để rò.

## 7. Mô hình dữ liệu

> Cập nhật theo Task 10–12 của Game Engine và Task 1–2 của Resilience (xem
> `docs/superpowers/plans/2026-09-07-game-engine.md` và
> `docs/superpowers/plans/2026-09-07-resilience.md`): bản vẽ dưới đây là cây dữ liệu
> **thật đang chạy**, khác vài chỗ so với bản thiết kế ban đầu — lý do ghi ngay dưới
> từng chỗ đổi. `narration/{seq}` **chưa làm** — thuộc sub-project Resilience, chưa
> tới lượt (xem Task 5 của plan Resilience).

```
/rooms/{code}
  createdAt, status            LOBBY | PLAYING
  settings/                    roleCounts{}, remoteMode  ← "Chơi xa" (deck-builder, 2026-09-08:
                               không còn maxPlayers riêng — deckSize(roleCounts) thay thế)
                                (Resilience Task 1); mặc định false, gạt luôn chat và
                                thoại LiveKit ở trạng thái tắt cho tới khi bật
  members/{uid}                name, photoURL, joinedAt
  currentGameId

/games/{gameId}
  roomCode, startedAt, dayNumber
  phase/                       name, endsAt, version   ← KHÔNG có requiredActors[]: đó
                                                          chính là danh sách ai giữ vai
                                                          gì cho phase riêng vai (SÓI,
                                                          TIÊN TRI, ...) — xem Task 10
                                                          bug #10.
  players/{uid}                name, alive, muted
  lastProtectedUid             uid Bảo Vệ che tối qua, hoặc null  ← mức ván đấu, không
                                                                     phải mỗi người chơi
                                                                     (đổi từ wasProtected)
  lastDeaths[]                 uid vừa chết ở lần công bố gần nhất (RẠNG SÁNG hoặc
                                KẾT QUẢ BỎ PHIẾU) — Task 12, để máy khách công bố người
                                chết thay vì bắt người chơi tự soi danh sách
  narration/{seq}              key, params{}          ← CHƯA LÀM, thuộc §8/Resilience
  result/                      winner                  ← không có trường vai; xem §4.6

/actions/{gameId}/{phaseKey}/{uid}   target, done, at   ← người chơi tự ghi. Cây riêng
                                        ở gốc, KHÔNG lồng trong /games/{gameId}: Security
                                        Rules đọc lan từ tổ tiên xuống, nên nếu lồng ở đây
                                        thì ".read": "auth != null" của /games/{gameId}
                                        áp luôn xuống actions/SEER/{uid} — sự tồn tại của
                                        một entry ở đó đã lộ ai là Tiên Tri (Task 10 bug
                                        #10, phần root cause).

/chat/{gameId}/{scope}/{msgId}       uid, text, at. scope = village | wolves
                                        (Resilience Task 2). Cùng lý do với actions/ ở
                                        trên: cây riêng ở gốc, không lồng trong
                                        /games/{gameId} — nếu lồng thì chat/wolves cũng
                                        bị ".read": "auth != null" của games/$gameId đè
                                        lên, một sói-chỉ-đọc-được sẽ thành ai-cũng-đọc-được.
                                        village đọc/ghi được bởi bất kỳ ai trong
                                        games/{gameId}/players; wolves chỉ đọc/ghi được
                                        bởi uid có vai sói (tự kiểm tra vai CỦA CHÍNH
                                        NGƯỜI GỌI qua private/{gameId}/{auth.uid}/role,
                                        không đọc vai người khác).

/private/{gameId}/{uid}        role, initialRole, potions{}, hints{}, loverUid,
                                pendingWolfTarget, packUids[]

/presence/{uid}                online, lastSeen, roomCode
```

Ràng buộc Security Rules chính:

- `actions/{gameId}/{phaseKey}/{uid}` — chỉ chính chủ ghi được, và chỉ khi phase đó
  đang chạy (riêng `VOTE` thì ai cũng đọc được — bỏ phiếu không phải thông tin vai;
  riêng `HUNTER_SHOT` thì ghi được bất cứ lúc nào miễn người đó đã chết, không cần
  đợi đúng phase).
- `private/{gameId}/{uid}` — chỉ chính chủ đọc được, không ai ghi được từ client.
- `games/{gameId}/phase`, `players`, `result`, `lastProtectedUid`, `lastDeaths` —
  client chỉ đọc, chỉ Admin SDK ghi.
- `chat/{gameId}/village` — đọc/ghi được bởi bất kỳ ai có mặt trong
  `games/{gameId}/players`, miễn còn sống lúc ghi. `chat/{gameId}/wolves` — chỉ
  đọc/ghi được bởi uid có vai sói (Ma Sói hoặc Kẻ Phản Bội), miễn còn sống lúc ghi.
  Cả hai: không giả mạo người gửi (`uid` trong tin nhắn phải đúng `auth.uid`), không
  sửa tin đã gửi.
- `rooms/{code}/settings` — chỉ member của phòng ghi được, và chỉ khi phòng còn
  ở LOBBY.

## 8. Âm thanh và chạy nền

Đây là cơ chế biến điện thoại thành lá bài úp.

### 8.1 Vì sao dùng âm thanh

Trình duyệt di động đóng băng trang khi vào nền: bộ đếm bị bóp còn một nhịp mỗi phút hoặc
dừng hẳn, WebSocket bị cắt sau vài chục giây. Không có API nào cho web giữ kết nối sống khi
màn hình tắt.

Trừ một ngoại lệ, và là ngoại lệ được bảo vệ nghiêm nhất trên cả Android lẫn iOS: **trang đang
phát âm thanh thì không bị treo**. Đây là cơ chế giúp mọi trình phát nhạc web chạy nền được.

Ma sói vốn là trò chơi bằng tai — người quản trò nói, mọi người nhắm mắt nghe. Nên dùng âm
thanh làm neo giữ trang sống không phải mẹo lách, nó trùng khít với bản chất trò chơi.

### 8.2 Cách làm

Suốt ván có **một luồng âm thanh duy nhất không bao giờ dừng**: tiếng đêm nền ở âm lượng thấp,
xen vào đó là các câu dẫn truyện. Luồng này bắt đầu từ lúc bấm Bắt đầu và chỉ tắt khi ván kết
thúc. Chừng nào nó còn chạy, trang còn sống, WebSocket còn nối.

Đổi lại đúng một thao tác cho mỗi người: iOS bắt buộc phải có một cú chạm của chính người dùng
đó mới cho phát âm thanh, nên không thể mở khoá hộ nhau. Việc này gắn vào nút **"Sẵn sàng"**
trong sảnh — ai cũng phải bấm trước khi ván chạy, và cú chạm đó mở khoá âm thanh cho máy họ.
Một lần cho cả ván, không thêm bước nào so với luồng vốn có.

Nếu ai đó vào lại giữa ván (mở từ thông báo đẩy chẳng hạn), âm thanh của máy họ lại đang khoá.
Lúc đó hiện một lớp phủ "Chạm để nghe dẫn truyện" — chạm phát một cái là nối lại luồng nền.

**Màn hình khoá hiện như đang phát nhạc.** Dùng MediaSession API để đặt tiêu đề theo phase
hiện tại: "Đêm 2 — Sói đang thức". Liếc màn hình khoá là biết ván tới đâu, không cần mở máy.

**Đến lượt bạn thì máy gọi:** một đoạn chuông riêng cắt vào luồng nền, kèm rung trên Android.
Mở lên, thao tác, cất lại.

**Thông báo đẩy là lưới an toàn.** Nếu hệ điều hành vẫn giết trang (iOS làm chuyện này khó
đoán hơn Android nhiều), FCM đánh thức. Bấm vào thông báo là mở app và RTDB đồng bộ lại toàn
bộ ngay lập tức. Trên iOS, đẩy chỉ hoạt động khi app đã được thêm vào màn hình chính — đây
chính là lý do PWA là yêu cầu bắt buộc chứ không phải để cho đẹp.

**Giữ màn sáng chỉ khi đến lượt.** Bản cũ bật Wake Lock suốt ván, và màn hình mới là thứ ngốn
pin nhất chứ không phải WebSocket. Bản mới chỉ giữ sáng trong phase mà bạn phải hành động,
xong thì thả ra cho màn tự tắt.

### 8.3 Giọng dẫn truyện

Bản cũ gọi Google Translate TTS qua một API route giả mạo User-Agent. Cách đó phụ thuộc mạng
ở đúng thời điểm nhạy cảm nhất, không có bộ nhớ đệm, và đã hỏng một lần vì đọc sai tên vai
(nhánh `fix_bug_noi_ngong`).

Bản mới **dựng sẵn toàn bộ câu dẫn thành file mp3 lúc build**. Tập câu là hữu hạn và biết
trước — khoảng hai mươi câu, cộng thêm các biến thể đếm số từ 0 đến 16 cho câu "đêm qua có N
người chết". File nằm trong `/public/audio`, được service worker lưu đệm.

Phát tức thì, không phụ thuộc mạng lúc đang chơi, phát âm sửa một lần là đúng vĩnh viễn.
`narration/{seq}` trong RTDB chỉ lưu khoá câu và tham số, máy khách tự tra ra file.

## 9. PWA

`display: standalone` và khoá hướng dọc, nên khi mở từ màn hình chính sẽ không còn thanh địa
chỉ, trông và chạy như app thật.

Service worker lưu đệm vỏ ứng dụng và toàn bộ file âm thanh. **Không lưu đệm dữ liệu ván đấu** —
đó là việc của RTDB, và một bản đệm cũ của trạng thái ván còn tệ hơn không có gì.

Có màn hình hướng dẫn cài đặt, hiển thị đúng lúc: trên Android là lời mời cài trực tiếp, trên
iOS là hướng dẫn "Chia sẻ → Thêm vào MH chính". Trên iOS cần nói rõ vì sao — không cài thì
không có thông báo đẩy.

## 10. Thoại và video call

LiveKit Cloud, bật theo từng phòng bằng một công tắc "Chơi xa". Phòng ngồi cùng bàn không cần
và không nên bật, vì mười micro trong một phòng là vọng âm — ngồi cạnh nhau thì nói bằng miệng.

Có cả **video**, không chỉ audio. Bật "Chơi xa" thì mỗi người thấy mặt nhau qua camera trong
lúc gọi, giống như đang ngồi chung bàn nhìn thấy biểu cảm của nhau — phần quan trọng của ma sói
là đọc phản ứng người khác lúc bị nghi ngờ.

**Phòng gọi tự động ghép theo phase, không cần bấm gọi thủ công:**

- Đêm, đến phiên Sói thức dậy → tất cả sói còn sống tự động vào chung một phòng gọi video để
  bàn cắn ai. Người không phải sói không thấy, không nghe được phòng này.
- Ngày, vào Thảo Luận → tất cả người còn sống tự động vào chung một phòng gọi video để bàn
  ai đáng ngờ trước khi bỏ phiếu. Người đã chết không được nói (xem theo dõi câm lặng) nhưng
  vẫn xem được hình để theo dõi ván.
- Các phase đêm khác (Tiên Tri, Bảo Vệ, Phù Thuỷ, Kẻ Bịt Miệng) không có phòng gọi — đó là
  hành động một mình, không bàn bạc với ai.

Token do `POST /api/livekit/token` cấp, secret nằm ở biến môi trường trên Vercel, không lộ ra
client. Mỗi phòng gọi theo phase là một LiveKit room riêng (đặt tên theo `{gameId}-{phaseKey}`)
để khỏi phải tự quản lý mute/permission phức tạp — hết phase là rời phòng gọi cũ, vào phòng gọi
mới nếu phase kế tiếp có gọi. Micro/camera của người chết luôn tắt phát (không cấp quyền publish
trong token), chỉ subscribe để xem/nghe.

Thoại cũng là một luồng âm thanh, nên khi bật nó tự làm luôn nhiệm vụ giữ trang sống ở mục 8.

## 11. Rủi ro và việc cần kiểm chứng trước

Ba việc phải thử trên máy thật **trước khi** xây tính năng, vì nếu sai thì thiết kế phải đổi:

1. **Âm thanh nền trên iOS.** Trang đang phát audio có thật sự giữ được WebSocket sống qua
   mười lăm phút khoá màn hình không? Đây là giả định chống đỡ toàn bộ mục 8. Thử trên iPhone
   thật, Safari, đã cài ra màn hình chính.
2. **Thông báo đẩy trên iOS PWA.** Chuỗi xin quyền và độ trễ nhận thông báo khi app bị giết hẳn.
3. **Giới hạn gói Firebase miễn phí.** RTDB gói Spark cho tối đa **100 kết nối đồng thời**,
   1 GB lưu trữ, 10 GB tải về mỗi tháng. Trăm kết nối là khoảng mười ván mười người cùng lúc —
   thừa cho nhóm bạn, nhưng phải biết con số này tồn tại và đo lượng dữ liệu mỗi ván để không
   đâm vào trần tải về.

Rủi ro đã biết và chấp nhận: cold start của Vercel làm chậm lúc chuyển phase khoảng một giây.
Chấp nhận được vì lúc đó đang phát câu dẫn truyện, người chơi không cảm thấy trống.

## 12. Những gì rút ra từ bản cũ

Ghi lại để không lặp lại:

- Giấu vai bằng cách gửi hết dữ liệu rồi ẩn ở giao diện thì sớm muộn cũng lộ. Đừng gửi.
- Đẩy phase bằng cách hỏi cơ sở dữ liệu mỗi giây là lãng phí và vẫn lệch. Dùng mốc thời gian
  tuyệt đối.
- Câu dẫn truyện cần bản dựng sẵn, không dịch trực tiếp lúc chạy.
- Hoà phiếu phải có luật rõ ràng, không được để phụ thuộc thứ tự ghi vào cơ sở dữ liệu.
- Phép trừ tập hợp không diễn tả được luật chặn có điều kiện. Viết phân xử theo từng bước có
  thứ tự.
- Trạng thái chung phải chảy từ một nguồn duy nhất. Bản cũ vừa nghe `ROOM_PLAYERS` vừa nghe
  `GAME_DATA_FLOW`, cả hai đều sửa cùng một danh sách người chơi.

## 13. Tài liệu là mã nguồn

Toàn bộ tài liệu nằm trong repo, đi qua pull request như code:

- `docs/superpowers/specs/` — thiết kế đến từ các phiên brainstorm, là nguồn của "làm gì và vì sao".
- `docs/planning/` — PRD, kiến trúc, epic, story do BMAD sinh ra từ tài liệu trên.
- `docs/implementation/` — trạng thái sprint, review, retro.
- `docs/knowledge/` — tri thức dài hạn: luật chơi, sổ tay vận hành.

Tài liệu nào mâu thuẫn với mã nguồn thì tài liệu sai và phải sửa trong cùng pull request đó.
