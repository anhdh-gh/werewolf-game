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
                action: EVENTS.CONNECT_ROOM,
                description: "Connect to the websocket to start playing the game",
                websocket: SERVERS.DEFAULT.ws
            }
        };
    },

    async joinRoom(req) {
        //
        await RoomRepository.joinRoom(req.user.id, req.body.room.code)

        //
        return {
            next_step: {
                action: EVENTS.CONNECT_ROOM,
                description: "Connect to the websocket to start playing the game",
                websocket: SERVERS.DEFAULT.ws
            }
        };
    },
};

module.exports = RoomService;
