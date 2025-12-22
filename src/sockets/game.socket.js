const EVENTS = require('../constants/events');
const gameHandler = require('./game.handler.socket')
const socketErrorWrapper = require('../utils/socketError.wrapper');

module.exports = (io, socket) => {

    socket.on(EVENTS.CONNECT_ROOM, socketErrorWrapper(gameHandler.connectRoom(io, socket)));
    socket.on(EVENTS.LEAVE_ROOM, socketErrorWrapper(gameHandler.leaveRoom(io, socket)));
    socket.on('disconnect', gameHandler.disconnectWs(io, socket));
};
