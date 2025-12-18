const AppError = require('../errors/AppError');
const { ROLES } = require('../constants/roles.constant');
const RoomRepository = require('../repositories/room.repository');
const { randomStr } = require('../utils/string.util');

const RoomService = {

    async creteRoom(req) {
        //
        let code = randomStr(5);

        //
        let id = await RoomRepository.creteRoom(req.user.id, code)

        //
        return {
            room: { id, code }
        };
    },
};

module.exports = RoomService;
