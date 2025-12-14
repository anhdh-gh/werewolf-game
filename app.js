const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    console.log('Request URL:', req.url);

    if (req.url === '/' || req.url === '/index.html') {
        const filePath = path.join(__dirname, 'index.html');

        fs.readFile(filePath, (err, data) => {
            if (err) {
                console.error('Lỗi Đọc File:', err);
                res.writeHead(500, {'Content-Type': 'text/plain; charset=utf-8'});
                return res.end('Lỗi server: ' + err.message);
            }
            res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
            res.end(data);
        });
    } else {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('Not Found');
    }
});

// Socket.io
const { Server } = require("socket.io");
const io = new Server(server);

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.emit('server_message', 'Chào mừng đến với game Ma Sói!');

    socket.on('chat_message', (msg) => {
        io.emit('server_message', msg);
    });
});

// BẮT BUỘC
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
