const AppError = require('../errors/AppError');
const RoomRepository = require('../repositories/room.repository');
const ERROR_CODES = require('../constants/errorCode.constants');

const GameService = {

    async connectRoom(user, roomCode, socketId) {
        //
        const room = await RoomRepository.getByRomInfo(roomCode);
        if(!room || room.length < 1) {
            throw new AppError(ERROR_CODES.NOT_FOUND, 'Room not found')
        }

        //
        await RoomRepository.connectRoom(user, roomCode, socketId);

        //
        return await GameService.getByCode(roomCode);
    },

    async getByCode(code) {
        return await RoomRepository.getByCode(code)
    },

    async getNumberOfPlayers(code) {
        return await RoomRepository.getNumberOfPlayers(code);
    },

    async disconnectRoom(userId, socketId) {
        //
        const roomCode = await RoomRepository.getBySocketId(userId, socketId);
        if(!roomCode) {
            return roomCode;
        }

        //
        return await GameService.leaveRoom(userId, roomCode);
    },

    async leaveRoom(userId, roomCode) {
        //
        await RoomRepository.leaveRoom(userId, roomCode);

        //
        const num = await GameService.getNumberOfPlayers(roomCode);
        if(!num || num < 1) {
            await RoomRepository.deleteRoom(roomCode);
            return roomCode;
        }

        //
        return roomCode;
    },
};

module.exports = GameService;
