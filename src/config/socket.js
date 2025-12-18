const { Server } = require('socket.io');
const gameSocket = require('../sockets/game.socket');
const socketAuth = require('../middlewares/socketAuth.middleware');

module.exports = (server) => {
    //
    const io = new Server(server, {
        cors: {
            origin: '*'
        }
    });

    // ===== SOCKET MIDDLEWARE =====
    io.use(socketAuth);

    //
    io.on('connection', (socket) => {
        gameSocket(io, socket);
    });
};
