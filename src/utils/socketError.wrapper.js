const ERROR_CODES = require('../constants/errorCode.constants');
const AppError = require('../errors/AppError');
const EVENTS = require('../constants/events');
const { Mutex } = require('async-mutex');

/**
 * =========================
 * ROOM LOCK STORAGE
 * =========================
 */
const roomLocks = new Map();

function getRoomLock(roomCode) {
    if (!roomLocks.has(roomCode)) {
        roomLocks.set(roomCode, new Mutex());
    }
    return roomLocks.get(roomCode);
}

/**
 * =========================
 * RUN WITH LOCK TIMEOUT
 * =========================
 */
async function runWithTimeout(lock, fn, timeoutMs = 2000) {
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
}

module.exports = (handler, options = {}) => {
    const {
        lockTimeout = 300000 // ms
    } = options;

    return async function (payload, ack) {
        try {
            // this === socket
            const roomCode = payload?.room?.code;

            // ✅ Có room_code → lock theo room
            if (roomCode) {
                const lock = getRoomLock(roomCode);

                return await runWithTimeout(
                    lock,
                    async () => {
                        return await handler(this, payload, ack);
                    },
                    lockTimeout
                );
            }

            // ❎ Không có room_code → chạy thẳng
            return await handler(this, payload, ack);

        } catch (err) {
            // ✅ AppError
            if (err instanceof AppError) {
                if (typeof ack === 'function') {
                    return ack({
                        code: err.code,
                        message: err.message,
                        errors: err.errors ?? null
                    });
                }

                return this.emit(EVENTS.SOCKET_ERROR, {
                    code: err.code,
                    message: err.message,
                    errors: err.errors ?? null
                });
            }

            // ❌ Unknown error
            console.error('[SOCKET_ERROR]', err);

            const fallback = {
                code: ERROR_CODES.INTERNAL_ERROR.code,
                message: ERROR_CODES.INTERNAL_ERROR.message
            };

            if (typeof ack === 'function') {
                return ack(fallback);
            }

            this.emit(EVENTS.SOCKET_ERROR, fallback);
        }
    };
};
