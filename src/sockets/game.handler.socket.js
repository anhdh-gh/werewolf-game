const EVENTS = require('../constants/events');
const gameService = require('../services/game.service');
const ERROR_CODES = require('../constants/errorCode.constants');
const { emitGameFlow, checkDuplicationEvent } = require('../utils/socket.handler.util');

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

module.exports.startNewGame = (io, socket) => {
    return async function (socket, payload, ack) {
        const { room } = payload || {};
        await checkDuplicationEvent(room.code, EVENTS.START_NEW_GAME, ack, async () => {
            const players = await gameService.startNewGame(socket.user.id, room.code)
            socket.join(room.code);
            io.to(room.code).emit(EVENTS.ROOM_PLAYERS, players);

            // Ack for client
            await gameService.updateEvent(room.code, EVENTS.START_NEW_GAME)
            if (typeof ack === 'function') {
                ack({ code: ERROR_CODES.SUCCESS.code, message: ERROR_CODES.SUCCESS.message });
            }
        })
    }
}

module.exports.startNight = (io, socket) => {
    return async function (socket, payload, ack) {
        const { room } = payload || {};
        await checkDuplicationEvent(room.code, EVENTS.START_NIGHT, ack, async () => {
            emitGameFlow({
                socket,
                io,
                roomCode: room.code,
                dataFlow: await gameService.beginSeer(),
                ack
            });
        })
    }
}

module.exports.seerDone = (io, socket) => {
    return async function (socket, payload, ack) {
        const { room } = payload || {};
        await checkDuplicationEvent(room.code, EVENTS.SEER_DONE, ack, async () => {
            emitGameFlow({
                socket,
                io,
                roomCode: room.code,
                dataFlow: await gameService.doneSeer(room.code),
                ack
            });
        })
    }
}

module.exports.bodyGuardDone = (io, socket) => {
    return async function (socket, payload, ack) {
        const { room, guard_user_id } = payload || {};
        await checkDuplicationEvent(room.code, EVENTS.BODYGUARD_DONE, ack, async () => {
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
    }
}

module.exports.silencedDone = (io, socket) => {
    return async function (socket, payload, ack) {
        const { room, silenced_user_id } = payload || {};

        //
        await checkDuplicationEvent(room.code, EVENTS.SILENCED_DONE, ack, async () => {
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
    }
}

module.exports.wolfVoting = (io, socket) => {
    return async function (socket, payload, ack) {
        //
        const { room, bitten_user_id } = payload || {};

        //
        await checkDuplicationEvent(room.code, EVENTS.WEREWOLF_VOTING, ack, async () => {
            //
            const dataFlow = await gameService.wolfVoting(socket.user.id, room.code, bitten_user_id)

            //
            if(dataFlow) {
                const players = await gameService.getByCode(room.code);
                if(players && players.length > 0) {
                    socket.join(room.code);
                    io.to(room.code).emit(EVENTS.ROOM_PLAYERS, players);
                }

                if(dataFlow !== socket.user.id) {
                    emitGameFlow({
                        socket,
                        io,
                        roomCode: room.code,
                        dataFlow,
                        ack
                    });
                }
            } else {
                if (typeof ack === 'function') {
                    ack({ code: ERROR_CODES.SUCCESS.code, message: ERROR_CODES.SUCCESS.message });
                }
            }
        }, false)
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