const http = require('http');

// Tạo server đơn giản nhất có thể
const server = http.createServer((req, res) => {
    // Trả về header báo là text bình thường
    res.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});

    // Trả về nội dung và kết thúc luôn
    res.end('OKE - Server Node.js đang chạy ngon lành cành đào!');
});

// Vẫn giữ socket.io để không bị lỗi module (nếu package.json đã khai báo)
const io = require('socket.io')(server);

io.on('connection', (socket) => {
    console.log('Client connected: ' + socket.id);
});

// Lắng nghe port (cPanel tự cấp port)
server.listen(() => {
    console.log('Server is running...');
});