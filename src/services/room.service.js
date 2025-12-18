const AppError = require('../errors/AppError');
const RoomRepository = require('../repositories/room.repository');
const { randomStr } = require('../utils/string.util');

const RoomService = {

    async createRoom(req) {
        //
        let code = randomStr(5);

        //
        await RoomRepository.createRoom(req.user.id, code)

        //
        return { code };
    },

    async joinRoom(req) {
        //
        await RoomRepository.joinRoom(req.user.id, req.body.room.code)

        //
        return undefined;
    },
};

module.exports = RoomService;
