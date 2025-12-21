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
            const players = await gameService.connectRoom(
                socket.user,
                room.code,
                socket.id
            );

            // Broadcast for all players in room
            socket.join(room.code);
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
            const players = await gameService.getByCode(room.code);
            if(players && players.length > 0) {
                io.to(room.code).emit(EVENTS.ROOM_PLAYERS, players);
            }

            // Ack for client
            if (typeof ack === 'function') {
                ack({ code: ERROR_CODES.SUCCESS.code, message: ERROR_CODES.SUCCESS.message });
            }

            //
            socket.disconnect(true);
        })
    );

    // ===== START_NEW_GAME =====
    socket.on(
        EVENTS.START_NEW_GAME,
        socketErrorWrapper(async (socket, payload, ack) => {
            const { room } = payload || {};

            //
            const players = await gameService.startNewGame(socket.user.id, room.code)
            socket.join(room.code);
            io.to(room.code).emit(EVENTS.ROOM_PLAYERS, players);

            // Ack for client
            if (typeof ack === 'function') {
                ack({ code: ERROR_CODES.SUCCESS.code, message: ERROR_CODES.SUCCESS.message });
            }
        })
    );

    // ===== DISCONNECT =====
    socket.on('disconnect', async () => {
        try {
            await gameService.leaveRoom(socket.user.id);

            const roomCode = Array.from(socket.rooms).find(room => room !== socket.id)
            if(roomCode) {
                socket.leave(roomCode);
                const players = await gameService.getByCode(roomCode);
                if(players && players.length > 0) {
                    io.to(roomCode).emit(EVENTS.ROOM_PLAYERS, players);
                }
            }
        } catch (err) {
            console.error('[Socket Disconnect Error]', err);
        }
    });
};
