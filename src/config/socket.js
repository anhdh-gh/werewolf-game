const { Server } = require('socket.io');
const gameSocket = require('../sockets/game.socket');
const socketAuth = require('../middlewares/socketAuth.middleware');
const EVENTS = require('../constants/events');

let io;

function initSocket(server) {
    io = new Server(server, {
        cors: { origin: '*' }
    });

    // ===== SOCKET MIDDLEWARE =====
    io.use(socketAuth);

    //
    io.on(EVENTS.CONNECTION, (socket) => {
        gameSocket(io, socket);
    });

    return io;
}

function getIO() {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
}

module.exports = {
    initSocket,
    getIO
};
