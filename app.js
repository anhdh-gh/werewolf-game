const http = require('http');
const fs = require('fs');
const path = require('path');

// 1. Web Server
const server = http.createServer((req, res) => {
    // Log xem trình duyệt đang yêu cầu đường dẫn nào
    console.log('Request URL:', req.url);

    // Chỉ trả về index.html nếu người dùng vào trang chủ "/"
    if (req.url === '/' || req.url === '/index.html') {

        // Tạo đường dẫn tuyệt đối đến file index.html
        const filePath = path.join(__dirname, 'index.html');
        console.log('Đường dẫn file cần đọc:', filePath); // Log vị trí file để kiểm tra

        fs.readFile(filePath, (err, data) => {
            if (err) {
                // QUAN TRỌNG: In lỗi chi tiết ra log của cPanel
                console.error('Lỗi Đọc File:', err);

                res.writeHead(500, {'Content-Type': 'text/plain; charset=utf-8'});
                return res.end('Lỗi server (Xem log để biết chi tiết): ' + err.message);
            }
            res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
            res.end(data);
        });
    } else {
        // Nếu trình duyệt hỏi các file khác (favicon, v.v...) thì trả về 404 để không lỗi
        res.writeHead(404);
        res.end();
    }
});

// 2. WebSocket Server
const io = require('socket.io')(server);

io.on('connection', (socket) => {
    console.log('Client connected: ' + socket.id);

    // Gửi lời chào
    socket.emit('server_message', 'Chào mừng đến với game Ma Sói (Server Node.js)!');

    // Chat
    socket.on('chat_message', (msg) => {
        console.log('Nhận tin nhắn: ' + msg);
        io.emit('server_message', 'Người lạ: ' + msg);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// 3. Khởi chạy
server.listen(() => {
    // Trên cPanel Passenger, port được quản lý tự động, không cần điền số cụ thể
    const address = server.address();
    console.log('Server đang chạy tại:', address);
});