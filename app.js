const http = require('http');
const fs = require('fs');
const path = require('path');

// 1. Web Server: Đọc file index.html trả về cho trình duyệt
const server = http.createServer((req, res) => {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
        if (err) {
            res.writeHead(500);
            return res.end('Error loading index.html');
        }
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        res.end(data);
    });
});

// 2. WebSocket Server
const io = require('socket.io')(server);

io.on('connection', (socket) => {
    console.log('Client connected: ' + socket.id);

    // Gửi lời chào khi mới vào
    socket.emit('server_message', 'Chào mừng đến với hang Ma Sói!');

    // Lắng nghe tin nhắn chat
    socket.on('chat_message', (msg) => {
        console.log('Nhận tin nhắn: ' + msg);
        io.emit('server_message', 'Người lạ: ' + msg); // Gửi lại cho tất cả
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// 3. Khởi chạy (cPanel tự quản lý port)
server.listen();