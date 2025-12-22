const { Server } = require('socket.io');
const gameSocket = require('../sockets/game.socket');
const socketAuth = require('../middlewares/socketAuth.middleware');
const EVENTS = require('../constants/events');

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
    io.on(EVENTS.CONNECTION, (socket) => {
        gameSocket(io, socket);
    });
};
