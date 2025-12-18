const AppError = require('../errors/AppError');
const { ROLES } = require('../constants/roles.constant');
const RoomRepository = require('../repositories/room.repository');

const GameService = {

    async connectRoom(userId, roomId, socketId) {
        await RoomRepository.connectRoom(userId, roomId, socketId);
        return await RoomRepository
    },
};

module.exports = GameService;
