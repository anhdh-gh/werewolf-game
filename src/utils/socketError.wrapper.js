const ERROR_CODES = require('../constants/errorCode.constants');
const AppError = require('../errors/AppError');
const EVENTS = require('../constants/events');

module.exports = (handler) => {
    return async function (payload, ack) {
        try {
            return await handler(this, payload, ack);
        } catch (err) {
            // AppError
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
