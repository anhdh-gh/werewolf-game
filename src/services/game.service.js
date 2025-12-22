const AppError = require('../errors/AppError');
const RoomRepository = require('../repositories/room.repository');
const PlayerRepository = require('../repositories/player.repository');
const ERROR_CODES = require('../constants/errorCode.constants');
const ArrayUtil = require('../utils/array.util')
const { ROLES } = require('../constants/roles.constant')
const { STATUS } = require('../constants/status.constant')
const EVENTS = require('../constants/events');

const GameService = {

    /**[ DISCONNECT ]* */
    async playerDisconnected(userId) {
        //
        const rooms = await PlayerRepository.getRoom(userId);
        for (let room of rooms) {
            GameService.leaveRoom(userId, room?.room_code).catch(err => console.log(err))
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
        await PlayerRepository.connectRoom(playerId, roomCode)
    },

    /**[ LEAVE_ROOM ]* */
    async leaveRoom(playerId, roomCode) {
        //
        if(!roomCode) {
            return
        }

        //
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
    }
};

module.exports = GameService;
