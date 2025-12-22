const EVENTS = require('../constants/events');
const gameService = require('../services/game.service');
const ERROR_CODES = require('../constants/errorCode.constants');

module.exports.connectRoom = (io, socket) => {
    return async function (socket, payload, ack) {
        const { room } = payload || {};
        const players = await gameService.connectRoom(socket.user, room.code);

        // Broadcast for all players in room
        socket.join(room.code);
        io.to(room.code).emit(EVENTS.ROOM_PLAYERS, players);

        // Ack for client
        if (typeof ack === 'function') {
            ack({ code: ERROR_CODES.SUCCESS.code, message: ERROR_CODES.SUCCESS.message });
        }
    }
}

module.exports.leaveRoom = (io, socket) => {
    return async function (socket, payload, ack) {
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
    }
}

module.exports.disconnectWs = (io, socket) => {
    return async function () {
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
    }
}