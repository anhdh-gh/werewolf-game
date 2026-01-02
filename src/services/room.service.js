const EVENTS = require('../constants/events');
const { SERVERS } = require('../constants/servers.constant');
const RoomRepository = require('../repositories/room.repository')
const { Mutex } = require('async-mutex');
const AppError = require('../errors/AppError');
const ERROR_CODES = require('../constants/errorCode.constants');

const roomLocks = new Map();
const ROOM_TIMEOUT = 300000;

const RoomService = {

    async createRoom(userId, maxPlayers) {
        return await RoomService.joinRoom(userId, await RoomRepository.createRoom(maxPlayers));
    },

    async joinRoom(userId, roomCode) {
        const room = await RoomRepository.getByCode(roomCode)
        if(!room) {
            throw new AppError(ERROR_CODES.ROOM_NOT_FOUND)
        }

        //
        return {
            room: { code: roomCode },
            next_step: {
                action: EVENTS.CONNECT_ROOM,
                description: "Connect to the websocket to start playing the game",
                websocket: SERVERS.filter(S => process.env.SERVER_ID === S.id)[0].ws
            }
        };
    },

    async getRoomLock(roomCode) {
        if (!roomLocks.has(roomCode)) {
            roomLocks.set(roomCode, new Mutex());
        }
        return roomLocks.get(roomCode);
    },

    async runWithTimeout(lock, fn, timeoutMs = ROOM_TIMEOUT) {
        return Promise.race([
            lock.runExclusive(fn),
            new Promise((_, reject) =>
                setTimeout(
                    () => reject(new AppError(
                        ERROR_CODES.LOCK_TIMEOUT?.code ?? 'LOCK_TIMEOUT',
                        ERROR_CODES.LOCK_TIMEOUT?.message ?? 'Room is busy, please retry'
                    )),
                    timeoutMs
                )
            )
        ]);
    },

    async withRoomLock(roomCode, handler) {
        const lock = await RoomService.getRoomLock(roomCode);

        return RoomService.runWithTimeout(
            lock,
            async () => {
                return await handler();
            },
            ROOM_TIMEOUT
        );
    }
};

module.exports = RoomService;
