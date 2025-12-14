const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    // Lấy đường dẫn tuyệt đối của file index.html
    const filePath = path.join(__dirname, 'index.html');

    fs.readFile(filePath, (err, data) => {
        if (err) {
            // NẾU CÓ LỖI: In chi tiết ra màn hình thay vì câu chung chung
            res.writeHead(500, {'Content-Type': 'text/plain; charset=utf-8'});
            res.end(
                '--- THÔNG BÁO LỖI CHI TIẾT ---\n' +
                '1. Mã lỗi (Code): ' + err.code + '\n' +
                '2. Lý do (Message): ' + err.message + '\n' +
                '3. Đường dẫn server đang tìm: ' + filePath + '\n' +
                '4. Thư mục hiện tại (__dirname): ' + __dirname
            );
            return;
        }

        // NẾU THÀNH CÔNG
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        res.end(data);
    });
});

const io = require('socket.io')(server);
server.listen(); // Để trống để cPanel tự điền port