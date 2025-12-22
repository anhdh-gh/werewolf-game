const AppError = require('../errors/AppError');
const RoomRepository = require('../repositories/room.repository');
const ERROR_CODES = require('../constants/errorCode.constants');
const ArrayUtil = require('../utils/array.util')
const { ROLES } = require('../constants/roles.constant')
const { STATUS } = require('../constants/status.constant')
const EVENTS = require('../constants/events');

const GameService = {

    async connectRoom(user, roomCode) {
        //
        await RoomRepository.updateRoom([{
            id: user.id,
            room_code: roomCode,
            role: null,
            status: STATUS.JOINED,
            votes_received: null,
            witch_heal: null,
            witch_poison: null
        }]);

        //
        return await GameService.getByCode(roomCode);
    },

    async leaveRoom(userId, roomCode) {
        //
        await RoomRepository.updateRoom([{
            id: userId,
            room_code: null,
            role: null,
            status: null,
            votes_received: null,
            witch_heal: null,
            witch_poison: null
        }]);

        //
        if(roomCode) {
            return await GameService.getByCode(roomCode);
        }

        //
        return null;
    },
};

module.exports = GameService;
