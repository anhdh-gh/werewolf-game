const EVENTS = require('../constants/events');
const socketErrorWrapper = require('../utils/socketError.wrapper');
const gameService = require('../services/game.service');
const ERROR_CODES = require('../constants/errorCode.constants');

module.exports = (io, socket) => {

    // ===== CONNECT_ROOM =====
    socket.on(
        EVENTS.CONNECT_ROOM,
        socketErrorWrapper(async (socket, payload, ack) => {
            const { room } = payload || {};

            // Join socket.io room
            socket.join(room.code);

            //
            const players = await gameService.connectRoom(
                socket.user,
                room.code,
                socket.id
            );

            // Broadcast for all players in room
            io.to(room.code).emit(EVENTS.ROOM_PLAYERS, players);

            // Ack for client
            if (typeof ack === 'function') {
                ack({ code: ERROR_CODES.SUCCESS.code, message: ERROR_CODES.SUCCESS.message });
            }
        })
    );

    // ===== LEAVE_ROOM =====
    socket.on(
        EVENTS.LEAVE_ROOM,
        socketErrorWrapper(async (socket, payload, ack) => {
            const { room } = payload || {};

            //
            await gameService.leaveRoom(socket.user.id);

            // Join socket.io room
            socket.leave(room.code);

            // Broadcast for all players in room
            io.to(room.code).emit(EVENTS.ROOM_PLAYERS, await gameService.getByCode(room.code));

            // Ack for client
            if (typeof ack === 'function') {
                ack({ code: ERROR_CODES.SUCCESS.code, message: ERROR_CODES.SUCCESS.message });
            }

            //
            socket.disconnect(true);
        })
    );

    // ===== DISCONNECT =====
    socket.on('disconnect', async () => {
        try {
            await gameService.leaveRoom(socket.user.id);

            const roomCode = Array.from(socket.rooms).find(room => room !== socket.id)
            if(roomCode) {
                socket.leave(roomCode);
                io.to(roomCode).emit(EVENTS.ROOM_PLAYERS, await gameService.getByCode(roomCode));
            }
        } catch (err) {
            console.error('[Socket Disconnect Error]', err);
        }
    });
};
