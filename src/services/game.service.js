const AppError = require('../errors/AppError');
const RoomRepository = require('../repositories/room.repository');
const PlayerRepository = require('../repositories/player.repository');
const ERROR_CODES = require('../constants/errorCode.constants');
const ArrayUtil = require('../utils/array.util')
const { ROLES } = require('../constants/roles.constant')
const { STATUS } = require('../constants/status.constant')
const { PHASE } = require('../constants/phase.constant')
const EVENTS = require('../constants/events');
const phaseBarrier = require('../model/PhaseBarrierManager')
const PhaseService = require('../services/phase.service')

const GameService = {

    /**[ DISCONNECT ]* */
    async playerDisconnected(userId, cleaner) {
        //
        const rooms = await PlayerRepository.getRoom(userId);
        for (let room of rooms) {
            GameService.leaveRoom(userId, room?.room_code).then(() => cleaner(room?.room_code)).catch(err => console.log(err))
        }
    },

    /**[ CONNECT_ROOM ]* */
    async connectRoom(playerId, roomCode) {
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
        await PlayerRepository.connectRoom(playerId, roomCode)
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
    async playerReady(playerId, roomCode) {
        const room = await RoomRepository.getByCode(roomCode)
        if(!room) {
            throw new AppError(ERROR_CODES.ROOM_NOT_FOUND)
        }

        //
        if(STATUS.WAITING !== room.status || PHASE.LOBBY.key !== room.current_phase) {
            throw new AppError(ERROR_CODES.ROOM_PLAYING)
        }

        //
        await PlayerRepository.playerReady(playerId, roomCode);

        //
        return phaseBarrier.register(roomCode, PHASE.LOBBY.key, room.max_players, playerId)
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
