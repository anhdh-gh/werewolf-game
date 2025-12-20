const AppError = require('../errors/AppError');
const RoomRepository = require('../repositories/room.repository');
const ERROR_CODES = require('../constants/errorCode.constants');

const GameService = {

    async connectRoom(user, roomCode, socketId) {
        //
        await RoomRepository.updateRoom(user.id, roomCode, socketId);

        //
        return await GameService.getByCode(roomCode);
    },

    async getByCode(code) {
        return await RoomRepository.getByCode(code)
    },

    async leaveRoom(userId) {
        //
        await RoomRepository.updateRoom(userId);

        //
        return userId;
    },
};

module.exports = GameService;
