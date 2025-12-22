const EVENTS = require('../constants/events');
const { SERVERS } = require('../constants/servers.constant');
const RoomRepository = require('../repositories/room.repository')

const RoomService = {

    async createRoom(userId, maxPlayers) {
        return await RoomService.joinRoom(userId, await RoomRepository.createRoom(maxPlayers));
    },

    async joinRoom(userId, roomCode) {
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
