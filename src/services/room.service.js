const AppError = require('../errors/AppError');
const RoomRepository = require('../repositories/room.repository');
const { randomStr } = require('../utils/string.util');

const RoomService = {

    async createRoom(req) {
        //
        let code = randomStr(5);

        //
        let id = await RoomRepository.createRoom(req.user.id, code)

        //
        return {
            room: { id, code }
        };
    },
};

module.exports = RoomService;
