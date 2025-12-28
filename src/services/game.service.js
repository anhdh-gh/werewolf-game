const AppError = require('../errors/AppError');
const RoomRepository = require('../repositories/room.repository');
const PlayerRepository = require('../repositories/player.repository');
const ERROR_CODES = require('../constants/errorCode.constants');
const { STATUS } = require('../constants/status.constant')
const { PHASE, PHASE_FLOW} = require('../constants/phase.constant')
const phaseBarrier = require('../model/PhaseBarrierManager')
const PhaseService = require('../services/phase.service')

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

    /**[ SEER_DONE ]* */
    async seerDone(roomCode) {
        //
        const room = await RoomRepository.getByCode(roomCode)
        if(!room) {
            return;
        }
        if(room?.current_phase !== PHASE.NIGHT_SEER.key) {
            return;
        }

        //
        const curPhase = PHASE_FLOW.filter(p => p.next.key === PHASE.NIGHT_SEER.key)?.[0];
        if(!curPhase) {
            return;
        }

        //
        await PhaseService.decreasePhaseExpire(roomCode, curPhase.time)
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
