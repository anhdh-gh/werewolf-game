const RoomRepository = require('../repositories/room.repository');
const { randomStr } = require('../utils/string.util');
const EVENTS = require('../constants/events');
const { SERVERS } = require('../constants/servers.constant');

const RoomService = {

    async createRoom(req) {
        //
        let code = randomStr(5);

        //
        await RoomRepository.createRoom(req.user.id, code)

        //
        return {
            room: { code },
            next_step: {
                action: EVENTS.CONNECT_WEB_SOCKET,
                websocket: SERVERS.EARTH.ws
            }
        };
    },

    async joinRoom(req) {
        //
        await RoomRepository.joinRoom(req.user.id, req.body.room.code)

        //
        return {
            next_step: {
                action: EVENTS.CONNECT_WEB_SOCKET,
                websocket: SERVERS.EARTH.ws
            }
        };
    },
};

module.exports = RoomService;
