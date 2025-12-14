const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    // 1. Xác định đường dẫn file tuyệt đối
    // __dirname sẽ lấy chính xác thư mục chứa file app.js trên server
    const filePath = path.join(__dirname, 'index.html');

    // 2. Thử đọc file
    fs.readFile(filePath, (err, data) => {
        if (err) {
            // NẾU CÓ LỖI:
            console.error('Lỗi khi đọc file:', err); // Ghi vào log hệ thống

            res.writeHead(500, {'Content-Type': 'text/plain; charset=utf-8'});

            // QUAN TRỌNG: Dòng này sẽ in lỗi chi tiết ra màn hình trình duyệt của bạn
            // Ví dụ: "ENOENT" (không tìm thấy file), "EACCES" (không có quyền đọc)...
            return res.end('GẶP LỖI RỒI: ' + err.message + '\nĐường dẫn file server đang tìm: ' + filePath);
        }

        // NẾU THÀNH CÔNG:
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        res.end(data);
    });
});

const io = require('socket.io')(server);

io.on('connection', (socket) => {
    console.log('Client connected: ' + socket.id);
    socket.emit('server_message', 'Chào mừng đến với hang Ma Sói!');
    socket.on('chat_message', (msg) => {
        io.emit('server_message', 'Người lạ: ' + msg);
    });
});

server.listen(() => {
    console.log('Server is running');
});