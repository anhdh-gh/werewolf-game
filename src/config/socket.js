const { Server } = require('socket.io');
const chatSocket = require('../sockets/chat.socket');
const socketAuth = require('../middlewares/socketAuth.middleware');

module.exports = (server) => {
    const io = new Server(server, {
        cors: {
            origin: '*'
        }
    });

    // ===== SOCKET MIDDLEWARE =====
    io.use(socketAuth);

    io.on('connection', (socket) => {
        console.log('🟢 Socket connected:', socket.id);
        chatSocket(io, socket);
    });
};
