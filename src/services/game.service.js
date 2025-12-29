const AppError = require('../errors/AppError');
const RoomRepository = require('../repositories/room.repository');
const PlayerRepository = require('../repositories/player.repository');
const ERROR_CODES = require('../constants/errorCode.constants');
const { STATUS } = require('../constants/status.constant')
const { PHASE, PHASE_FLOW} = require('../constants/phase.constant')
const phaseBarrier = require('../model/PhaseBarrierManager')
const PhaseService = require('../services/phase.service')
const RoomService = require("./room.service");
const {ROLES} = require("../constants/roles.constant");
const ArrayUtil = require("../utils/array.util");

const ROOM_TIMEOUT = 300000;

const GameService = {

    /**[ DISCONNECT ]* */
    async playerDisconnected(userId, cleaner) {
        //
        const rooms = await PlayerRepository.getRoom(userId);

        //
        await Promise.all(
            rooms.map(room =>
                GameService.leaveRoom(userId, room?.room_code).then(() => cleaner(room?.room_code)).catch(err => console.log(err))
            )
        );
    },

    /**[ CONNECT_ROOM ]* */
    async connectRoom(player, roomCode) {
        //
        const room = await RoomRepository.getByCode(roomCode)
        if(!room) {
            throw new AppError(ERROR_CODES.ROOM_NOT_FOUND)
        }

        //
        if(STATUS.WAITING !== room.status || PHASE.LOBBY.key !== room.current_phase) {
            throw new AppError(ERROR_CODES.ROOM_PLAYING)
        }

        //
        await PlayerRepository.connectRoom(player, roomCode)
    },

    /**[ LEAVE_ROOM ]* */
    async leaveRoom(playerId, roomCode) {
        const room = await RoomRepository.getByCode(roomCode)
        if(!room) {
            throw new AppError(ERROR_CODES.ROOM_NOT_FOUND)
        }

        //
        if(STATUS.PLAYING === room.status) {
            await PlayerRepository.playerDisconnected(playerId, roomCode)
            return;
        }

        //
        await PlayerRepository.leaveRoom(playerId, roomCode)

        //
        return roomCode
    },

    /**[ PLAYER_READY ]* */
    async playerReady(player, roomCode) {
        const room = await RoomRepository.getByCode(roomCode)
        if(!room) {
            throw new AppError(ERROR_CODES.ROOM_NOT_FOUND)
        }

        //
        if(STATUS.WAITING !== room.status || PHASE.LOBBY.key !== room.current_phase) {
            throw new AppError(ERROR_CODES.ROOM_PLAYING)
        }

        //
        await PlayerRepository.playerReady(player, roomCode);

        //
        return phaseBarrier.register(roomCode, PHASE.LOBBY.key, room.max_players, player.id)
    },

    /**[ PLAYER_INFO ]* */
    async playerInfo(playerIds, roomCode) {
        const room = await RoomRepository.getByCode(roomCode)
        if(!room) {
            throw new AppError(ERROR_CODES.ROOM_NOT_FOUND)
        }
        //
        return await GameService.getPlayerInfo(roomCode, playerIds);
    },

    /**[ PLAYER_DONE ]* */
    async playerDone(userId, roomCode, currentPhase) {
        //
        return await RoomService.runWithTimeout(
            await RoomService.getRoomLock(roomCode),
            async () => {
                //
                const room = await RoomRepository.getByCode(roomCode)
                if(!room) {
                    return;
                }

                //
                const player = await PlayerRepository.getRole(roomCode, userId)
                if(!player) {
                    return;
                }

                //
                const curPhase = PHASE_FLOW.filter(p => p?.next?.key === currentPhase && p?.role?.key === player?.role)?.[0];
                if(!curPhase) {
                    return;
                }

                //
                await PhaseService.decreasePhaseExpire(roomCode, curPhase.time)
            },
            ROOM_TIMEOUT
        );
    },

    /**[ PLAYER_VOTE ]* */
    async playerVote(userId, roomCode, currentPhase, targetId) {
        //
        return await RoomService.runWithTimeout(
            await RoomService.getRoomLock(roomCode),
            async () => {
                //
                const room = await RoomRepository.getByCode(roomCode)
                if(!room) {
                    return;
                }

                //
                const player = await PlayerRepository.getRole(roomCode, userId)
                if(!player) {
                    return;
                }

                //
                const curPhase = PHASE_FLOW.filter(p => p?.next?.key === currentPhase && p?.role?.key === player?.role)?.[0];
                if(!curPhase) {
                    return;
                }

                //
                await RoomRepository.upsertVote(roomCode, currentPhase, userId, targetId)
            },
            ROOM_TIMEOUT
        );
    },

    async getPlayerInfo(roomCode, playerIds) {
        return await PlayerRepository.getPlayerInfo(roomCode, playerIds);
    },

    async startGame(roomCode, handler) {
        //
        const players = await PhaseService.allViewRole(roomCode)
        if(players) {
            //
            handler(players)

            // Finally
            phaseBarrier.clear(roomCode, PHASE.LOBBY.key)
        }
    }
};

module.exports = GameService;
