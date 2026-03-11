const EVENTS = require('../constants/events');
const { SERVERS } = require('../constants/servers.constant');
const RoomRepository = require('../repositories/room.repository')
const { Mutex } = require('async-mutex');
const AppError = require('../errors/AppError');
const ERROR_CODES = require('../constants/errorCode.constants');
const { createVoiceToken } = require("../services/livekit.service");

const roomLocks = new Map();
const ROOM_TIMEOUT = 300000;

const RoomService = {

    async createRoom(userId, maxPlayers) {
        const roomVoiceId = `voice_${crypto.randomUUID()}`;
        return await RoomService.joinRoom(userId, await RoomRepository.createRoom(maxPlayers, roomVoiceId), roomVoiceId);
    },

    async joinRoom(userId, roomCode, roomVoiceId) {
        const room = await RoomRepository.getByCode(roomCode)
        const roomVoiceIdData = roomVoiceId === null ? room.room_voice_id : roomVoiceId
        console.log("roomVoiceIdData",roomVoiceIdData)
        if (!room) {
            throw new AppError(ERROR_CODES.ROOM_NOT_FOUND)
        }
        if (await RoomRepository.isFull(roomCode, room?.max_players)) {
            throw new AppError(ERROR_CODES.ROOM_IS_FULL)
        }

        const voiceToken = await createVoiceToken(roomVoiceIdData, userId)

        //
        return {
            room: {
                code: roomCode,
            },
            next_step: {
                action: EVENTS.CONNECT_ROOM,
                description: "Connect to the websocket to start playing the game",
                websocket: SERVERS.filter(S => process.env.SERVER_ID === S.id)[0].ws
                //websocket: process.env.LIVEKIT_URL
            },
            voice: {
                room_id: roomVoiceIdData,
                url: process.env.LIVEKIT_URL,
                token: voiceToken,
                auto_join: true
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
