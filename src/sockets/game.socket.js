const EVENTS = require('../constants/events');
const ERROR_CODES = require('../constants/errorCode.constants');
const GameService = require('../services/game.service');
const { socketHandlerError } = require('../utils/socketError.wrapper');

// key: userId, value: socket.id
const userSocketMap = new Map();

module.exports = (io, socket) => {

    /**[ CONNECT ]* */
    const existingSocketId = userSocketMap.get(socket.user.id);
    if (existingSocketId) { // Nếu đã có socket đang kết nối, reject socket mới
        socket.emit(EVENTS.SOCKET_ERROR, {
            code: ERROR_CODES.ALREADY_CONNECTED.code,
            message: ERROR_CODES.ALREADY_CONNECTED.message
        });
        socket.disconnect(true);
        return;
    }
    userSocketMap.set(socket.user.id, socket.id);

    /**[ DISCONNECT ]* */
    socket.on(EVENTS.DISCONNECT, () => {
        const currentSocketId = userSocketMap.get(socket.user.id);
        if (currentSocketId === socket.id) {
            userSocketMap.delete(socket.user.id);
            GameService.playerDisconnected(socket.user.id).catch(console.error)
        }
    });

    /**[ CONNECT_ROOM ]* */
    socket.on(EVENTS.CONNECT_ROOM, socketHandlerError(async (socket, payload, ack) => {
       await GameService.connectRoom(socket.user.id, payload.room.code)
    }));

    /**[ LEAVE_ROOM ]* */
    socket.on(EVENTS.LEAVE_ROOM, socketHandlerError(async (socket, payload, ack) => {
        await GameService.leaveRoom(socket.user.id, payload.room.code)
        return { disconnected: true }
    }));

    /**[ PLAYER_READY ]* */
    socket.on(EVENTS.PLAYER_READY, socketHandlerError(async (socket, payload, ack) => {
        await GameService.playerReady(socket.user.id, payload.room.code)
    }));

    /**[ ERROR ]* */
    socket.on(EVENTS.ERROR, err => {
        console.error('Socket error:', err);
    });
};
