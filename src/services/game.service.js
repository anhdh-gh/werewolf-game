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

    async startNewGame(userId, roomCode) {
        //
        const players = await GameService.getByCode(roomCode);
        if(!players || players.length < 4) {
            throw new AppError(ERROR_CODES.INVALID_REQUEST, "Number of players must be > 3")
        }

        // TODO: Logic random role here

        //
        return players;
    },
};

module.exports = GameService;
