const http = require('http');

const server = http.createServer((req, res) => {
    // QUAN TRỌNG: Phải có dòng này thì cPanel mới không bị lỗi NoneType
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Server Node.js is running!');
});

// CloudLinux tự động quản lý port, không cần điền số
server.listen(() => {
    console.log('Server is running');
});