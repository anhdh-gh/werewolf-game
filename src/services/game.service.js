const AppError = require('../errors/AppError');
const { ROLES } = require('../constants/roles.constant');
const RoomRepository = require('../repositories/room.repository');

const GameService = {

    async connectRoom(userId, roomCode, socketId) {
        await RoomRepository.connectRoom(userId, roomCode, socketId);
        return await RoomRepository.getByCode(roomCode);
    },
};

module.exports = GameService;
