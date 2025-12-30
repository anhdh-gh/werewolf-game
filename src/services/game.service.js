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
        return RoomService.withRoomLock(roomCode, async () => {
            const curPhase = await GameService.validateActions(
                userId,
                roomCode,
                currentPhase
            );

            await PhaseService.decreasePhaseExpire(
                roomCode,
                curPhase.time
            );
        });
    },

    /**[ PLAYER_VOTE ]* */
    async playerVote(userId, roomCode, currentPhase, target) {
        return RoomService.withRoomLock(roomCode, async () => {
            await GameService.validateActions(
                userId,
                roomCode,
                currentPhase
            );

            //
            if(PHASE.NIGHT_GUARD.key === currentPhase && await PlayerRepository.checkGuard(roomCode, target.id)) {
                throw new AppError(ERROR_CODES.TARGET_ID_IS_INVALID, "Không được bảo vệ một người hai đêm liên tiếp")
            }

            //
            await RoomRepository.upsertVote(
                roomCode,
                currentPhase,
                userId,
                target
            );
        });
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
    },

    async validateActions(userId, roomCode, currentPhase) {
        //
        const room = await RoomRepository.getByCode(roomCode)
        if(!room) {
            throw new AppError(ERROR_CODES.ROOM_NOT_FOUND)
        }

        //
        const player = await PlayerRepository.getRole(roomCode, userId)
        if(!player) {
            throw new AppError(ERROR_CODES.PLAYER_NOT_FOUND)
        }

        //
        const curPhase = PHASE_FLOW.filter(p => p?.next?.key === currentPhase && p?.role?.key === player?.role)?.[0];
        if(!curPhase) {
            throw new AppError(ERROR_CODES.PHASE_IS_INVALID)
        }
        if(currentPhase !== room?.current_phase) {
            throw new AppError(ERROR_CODES.PHASE_IS_INVALID)
        }

        //
        return curPhase;
    }
};

module.exports = GameService;
