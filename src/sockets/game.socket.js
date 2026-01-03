const EVENTS = require('../constants/events');
const ERROR_CODES = require('../constants/errorCode.constants');
const GameService = require('../services/game.service');
const { socketHandlerError } = require('../utils/socketError.wrapper');
const {PHASE} = require("../constants/phase.constant");
const { ACTIONS } = require('../constants/action.constant')

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
            GameService.playerDisconnected(socket.user.id, roomCode => {
                if(roomCode) {
                    socket.leave(roomCode)
                    GameService.getPlayerInfo(roomCode)
                        .then(players => {
                            io.to(roomCode).emit(EVENTS.ROOM_PLAYERS, { data: { players } })
                        }).catch(console.error)
                }
            }).catch(console.error)
        }
    });

    /**[ CONNECT_ROOM ]* */
    socket.on(EVENTS.CONNECT_ROOM, socketHandlerError(async (socket, payload, ack) => {
        try {
            await GameService.connectRoom(socket.user, payload.room.code)
            io.to(payload.room.code).emit(EVENTS.ROOM_PLAYERS, { data: { players: await GameService.getPlayerInfo(payload.room.code) } })
        } catch (err) {
            userSocketMap.delete(socket.user.id);
            return { disconnected: true }
        }
    }));

    /**[ ROOM_INFO ]* */
    socket.on(EVENTS.ROOM_INFO, socketHandlerError(async (socket, payload, ack) => {
        return { data: { room: await GameService.roomInfo(socket.user, payload.room.code) } }
    }));

    /**[ LEAVE_ROOM ]* */
    socket.on(EVENTS.LEAVE_ROOM, socketHandlerError(async (socket, payload, ack) => {
        try {
            await GameService.leaveRoom(socket.user.id, payload.room.code)
            io.to(payload.room.code).emit(EVENTS.ROOM_PLAYERS, { data: { players: await GameService.getPlayerInfo(payload.room.code) } })
        } catch (err) {}
        userSocketMap.delete(socket.user.id);
        return { disconnected: true }
    }));

    /**[ PLAYER_READY ]* */
    socket.on(EVENTS.PLAYER_READY, socketHandlerError(async (socket, payload, ack) => {
        const allReady = await GameService.playerReady(socket.user, payload.room.code);
        io.to(payload.room.code).emit(EVENTS.ROOM_PLAYERS, { data: { players: await GameService.getPlayerInfo(payload.room.code) } })
        if(allReady) {
            GameService.startGame(payload.room.code, (players) => {
                if(!players || players.length < 1) {
                    return;
                }

                //
                players.forEach(player => {
                    const socketId = userSocketMap.get(player.player_id)
                    if (!socketId) return

                    io.to(socketId).emit(EVENTS.GAME_DATA_FLOW, {
                        role: player.role,
                        phase: PHASE.ALL_VIEW_ROLE.key,
                        message: PHASE.ALL_VIEW_ROLE.message,
                        time: PHASE.ALL_VIEW_ROLE.time,
                        event: {
                            role: player.role,
                            action: ACTIONS.VIEW
                        }
                    })
                })
            }).catch(err => console.log(err))
        }
    }));

    /**[ PLAYER_INFO ]* */
    socket.on(EVENTS.PLAYER_INFO, socketHandlerError(async (socket, payload, ack) => {
        return { data: { players: await GameService.playerInfo(payload?.player?.ids, payload.room.code) } }
    }));

    /**[ PLAYER_DONE ]* */
    socket.on(EVENTS.PLAYER_DONE, socketHandlerError(async (socket, payload, ack) => {
        return { data: { players: await GameService.playerDone(socket.user.id, payload.room.code, payload.current_phase, data => io.to(payload.room.code).emit(EVENTS.GAME_DATA_FLOW, data)) } }
    }));

    /**[ PLAYER_VOTE ]* */
    socket.on(EVENTS.PLAYER_VOTE, socketHandlerError(async (socket, payload, ack) => {
        return { data: { players: await GameService.playerVote(socket.user.id, payload.room.code, payload.current_phase, payload.target) } }
    }));

    /**[ ERROR ]* */
    socket.on(EVENTS.ERROR, err => {
        console.error('Socket error:', err);
    });
};
