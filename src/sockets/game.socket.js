const EVENTS = require('../constants/events');
const socketErrorWrapper = require('../utils/socketError.wrapper');
const gameService = require('../services/game.service');
const ERROR_CODES = require('../constants/errorCode.constants');
const { emitGameFlow } = require('../utils/socket.handler.util');

module.exports = (io, socket) => {

    // ===== CONNECT_ROOM =====
    socket.on(
        EVENTS.CONNECT_ROOM,
        socketErrorWrapper(async (socket, payload, ack) => {
            const { room } = payload || {};
            const players = await gameService.connectRoom(socket.user, room.code);

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

            // Join socket.io room
            socket.leave(room.code);

            // Broadcast for all players in room
            const players = await gameService.leaveRoom(socket.user.id, room.code);
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

    // ===== START_NIGHT =====
    socket.on(
        EVENTS.START_NIGHT,
        socketErrorWrapper(async (socket, payload, ack) => {
            const { room } = payload || {};
            emitGameFlow({
                socket,
                io,
                roomCode: room.code,
                dataFlow: await gameService.beginSeer(),
                ack
            });
        })
    );

    // ===== SEER_DONE =====
    socket.on(
        EVENTS.SEER_DONE,
        socketErrorWrapper(async (socket, payload, ack) => {
            const { room } = payload || {};
            emitGameFlow({
                socket,
                io,
                roomCode: room.code,
                dataFlow: await gameService.doneSeer(room.code),
                ack
            });
        })
    );


    // ===== BODYGUARD_DONE =====
    socket.on(
        EVENTS.BODYGUARD_DONE,
        socketErrorWrapper(async (socket, payload, ack) => {
            //
            const { room, guard_user_id } = payload || {};

            //
            const dataFlow = await gameService.doneGuard(room.code, guard_user_id)

            //
            const players = await gameService.getByCode(room.code);
            if(players && players.length > 0) {
                socket.join(room.code);
                io.to(room.code).emit(EVENTS.ROOM_PLAYERS, players);
            }

            emitGameFlow({
                socket,
                io,
                roomCode: room.code,
                dataFlow,
                ack
            });
        })
    );

    // ===== SILENCED_DONE =====
    socket.on(
        EVENTS.SILENCED_DONE,
        socketErrorWrapper(async (socket, payload, ack) => {
            //
            const { room, silenced_user_id } = payload || {};

            //
            const dataFlow = await gameService.doneSilenced(room.code, silenced_user_id)

            //
            const players = await gameService.getByCode(room.code);
            if(players && players.length > 0) {
                socket.join(room.code);
                io.to(room.code).emit(EVENTS.ROOM_PLAYERS, players);
            }

            emitGameFlow({
                socket,
                io,
                roomCode: room.code,
                dataFlow,
                ack
            });
        })
    );

    // ===== DISCONNECT =====
    socket.on('disconnect', async () => {
        try {
            const roomCode = Array.from(socket.rooms).find(room => room !== socket.id)
            if(roomCode) {
                socket.leave(roomCode);
                const players = await gameService.leaveRoom(socket.user.id, roomCode);
                if(players && players.length > 0) {
                    io.to(roomCode).emit(EVENTS.ROOM_PLAYERS, players);
                }
            }
        } catch (err) {
            console.error('[Socket Disconnect Error]', err);
        }
    });
};
