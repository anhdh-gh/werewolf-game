const RoomRepository = require('../repositories/room.repository');
const { randomStr } = require('../utils/string.util');
const EVENTS = require('../constants/events');
const { SERVERS } = require('../constants/servers.constant');

const RoomService = {

    async createRoom(req) {
        return await RoomService.joinRoom(req.user.id, randomStr(5));
    },

    async joinRoom(userId, roomCode) {
        //
        await RoomRepository.updateRoom([{
            id: userId,
            room_code: roomCode,
            socket_id: null,
            role: null,
            status: null,
            votes_received: null,
            meta_data: null
        }]);

        //
        return {
            room: { code: roomCode },
            next_step: {
                action: EVENTS.CONNECT_ROOM,
                description: "Connect to the websocket to start playing the game",
                websocket: SERVERS.DEFAULT.ws
            }
        };
    },
};

module.exports = RoomService;
