const EVENTS = require('../constants/events');
const ERROR_CODES = require('../constants/errorCode.constants');
const GameService = require('../services/game.service');
const { socketHandlerError } = require('../utils/socketError.wrapper');
const { PHASE } = require("../constants/phase.constant");
const { ACTIONS } = require('../constants/action.constant')
const AppError = require('../errors/AppError');

// key: userId, value: socket.id
const userSocketMap = new Map();

/**
 * ===== ADD FOR VOICE CALL =====
 * key: roomCode
 * value: Set<userId>
 */
const callRoomMap = new Map();

module.exports = (io, socket) => {

    /**[ CONNECT ]**/
    const existingSocketId = userSocketMap.get(socket.user.id);
    if (existingSocketId) {
        socket.emit(EVENTS.SOCKET_ERROR, {
            code: ERROR_CODES.ALREADY_CONNECTED.code,
            message: ERROR_CODES.ALREADY_CONNECTED.message
        });
        socket.disconnect(true);
        return;
    }
    userSocketMap.set(socket.user.id, socket.id);

    /**[ DISCONNECT ]**/
    socket.on(EVENTS.DISCONNECT, () => {
        const currentSocketId = userSocketMap.get(socket.user.id);
        if (currentSocketId === socket.id) {
            userSocketMap.delete(socket.user.id);

            /**
             * ===== REMOVE FROM VOICE CALL =====
             */
            for (const [roomCode, users] of callRoomMap.entries()) {
                if (users.has(socket.user.id)) {
                    users.delete(socket.user.id);
                    socket.to(roomCode).emit(EVENTS.CALL_LEAVE, {
                        userId: socket.user.id
                    });
                }
                if (users.size === 0) {
                    callRoomMap.delete(roomCode);
                }
            }

            GameService.playerDisconnected(socket.user.id, roomCode => {
                if (roomCode) {
                    socket.leave(roomCode)
                    GameService.getPlayerInfo(roomCode)
                        .then(players => {
                            io.to(roomCode).emit(EVENTS.ROOM_PLAYERS, { data: { players } })
                        }).catch(console.error)
                }
            }).catch(console.error)
        }
    });

    /**[ CONNECT_ROOM ]**/
    socket.on(EVENTS.CONNECT_ROOM, socketHandlerError(async (socket, payload, ack) => {
        try {
            await GameService.connectRoom(socket.user, payload.room.code)
            socket.join(payload.room.code)

            io.to(payload.room.code).emit(EVENTS.ROOM_PLAYERS, {
                data: { players: await GameService.getPlayerInfo(payload.room.code) }
            })
        } catch (err) {
            if (err instanceof AppError) {
                if (typeof ack === 'function') {
                    ack({
                        code: err.code,
                        message: err.message,
                        errors: err.errors ?? null
                    });
                } else {
                    socket.emit(EVENTS.SOCKET_ERROR, {
                        code: err.code,
                        message: err.message,
                        errors: err.errors ?? null
                    });
                }
            }
            userSocketMap.delete(socket.user.id);
            return { disconnected: true }
        }
    }));

    /**[ ROOM_INFO ]**/
    socket.on(EVENTS.ROOM_INFO, socketHandlerError(async (socket, payload, ack) => {
        return { data: { room: await GameService.roomInfo(socket.user, payload.room.code) } }
    }));

    /**[ LEAVE_ROOM ]**/
    socket.on(EVENTS.LEAVE_ROOM, socketHandlerError(async (socket, payload, ack) => {
        try {
            await GameService.leaveRoom(socket.user.id, payload.room.code)
            io.to(payload.room.code).emit(EVENTS.ROOM_PLAYERS, {
                data: { players: await GameService.getPlayerInfo(payload.room.code) }
            })
        } catch (err) {}
        userSocketMap.delete(socket.user.id);
        return { disconnected: true }
    }));

    /**[ PLAYER_READY ]**/
    socket.on(EVENTS.PLAYER_READY, socketHandlerError(async (socket, payload, ack) => {
        await GameService.playerReady(socket.user, payload.room.code);
        io.to(payload.room.code).emit(EVENTS.ROOM_PLAYERS, {
            data: { players: await GameService.getPlayerInfo(payload.room.code) }
        })
    }));

    /**[ PLAYER_INFO ]**/
    socket.on(EVENTS.PLAYER_INFO, socketHandlerError(async (socket, payload, ack) => {
        return { data: { players: await GameService.playerInfo(payload?.player?.ids, payload.room.code) } }
    }));

    /**[ PLAYER_DONE ]**/
    socket.on(EVENTS.PLAYER_DONE, socketHandlerError(async (socket, payload, ack) => {
        return {
            data: {
                players: await GameService.playerDone(
                    socket.user.id,
                    payload.room.code,
                    payload.current_phase,
                    data => io.to(payload.room.code).emit(EVENTS.GAME_DATA_FLOW, data)
                )
            }
        }
    }));

    /**[ PLAYER_CHAT ]**/
    socket.on(EVENTS.PLAYER_CHAT, socketHandlerError(async (socket, payload, ack) => {
        io.to(payload.room.code).emit(EVENTS.ROOM_CHAT, {
            id: socket.user.id,
            username: socket.user.username,
            message: payload?.chat?.message
        })
    }));

    /** =====================================================
     * ============== VOICE CALL (AUDIO ONLY) ===============
     * ========== ADD CODE – NO REFACTOR ====================
     * ===================================================== */

    /** JOIN VOICE CALL */
    socket.on(EVENTS.CALL_JOIN, socketHandlerError(async (socket, payload) => {
        const roomCode = payload.room.code;

        if (!callRoomMap.has(roomCode)) {
            callRoomMap.set(roomCode, new Set());
        }

        const users = callRoomMap.get(roomCode);
        users.add(socket.user.id);

        // send existing call users to new user
        socket.emit(EVENTS.CALL_USERS, {
            users: Array.from(users).filter(id => id !== socket.user.id)
        });

        // notify others
        socket.to(roomCode).emit(EVENTS.CALL_JOIN, {
            userId: socket.user.id,
            socketId: socket.id,
            username: socket.user.username
        });
    }));

    /** LEAVE VOICE CALL */
    socket.on(EVENTS.CALL_LEAVE, socketHandlerError(async (socket, payload) => {
        const roomCode = payload.room.code;
        const users = callRoomMap.get(roomCode);

        if (users) {
            users.delete(socket.user.id);

            socket.to(roomCode).emit(EVENTS.CALL_LEAVE, {
                userId: socket.user.id
            });

            if (users.size === 0) {
                callRoomMap.delete(roomCode);
            }
        }
    }));

    /** WEBRTC OFFER */
    socket.on(EVENTS.CALL_OFFER, socketHandlerError(async (socket, payload) => {
        io.to(payload.targetSocketId).emit(EVENTS.CALL_OFFER, {
            fromUserId: socket.user.id,
            fromSocketId: socket.id,
            sdp: payload.sdp
        });
    }));

    /** WEBRTC ANSWER */
    socket.on(EVENTS.CALL_ANSWER, socketHandlerError(async (socket, payload) => {
        io.to(payload.targetSocketId).emit(EVENTS.CALL_ANSWER, {
            fromUserId: socket.user.id,
            fromSocketId: socket.id,
            sdp: payload.sdp
        });
    }));

    /** WEBRTC ICE */
    socket.on(EVENTS.CALL_ICE_CANDIDATE, socketHandlerError(async (socket, payload) => {
        io.to(payload.targetSocketId).emit(EVENTS.CALL_ICE_CANDIDATE, {
            fromUserId: socket.user.id,
            fromSocketId: socket.id,
            candidate: payload.candidate
        });
    }));

    /**[ PLAYER_VOTE ]**/
    socket.on(EVENTS.PLAYER_VOTE, socketHandlerError(async (socket, payload, ack) => {
        return {
            data: {
                players: await GameService.playerVote(
                    socket.user.id,
                    payload.room.code,
                    payload.current_phase,
                    payload.target
                )
            }
        }
    }));

    /**[ ERROR ]**/
    socket.on(EVENTS.ERROR, err => {
        console.error('Socket error:', err);
    });
};
