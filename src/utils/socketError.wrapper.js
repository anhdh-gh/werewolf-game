const ERROR_CODES = require('../constants/errorCode.constants');
const AppError = require('../errors/AppError');
const EVENTS = require('../constants/events');

module.exports.socketHandlerError = (handler) => {
    return async function (payload, ack) {
        try {
            if(payload && payload?.room && payload?.room?.code) {
                this.join(payload?.room?.code)
            }
            const res = await handler(this, payload, ack);
            if (typeof ack === 'function') {
                ack({ code: ERROR_CODES.SUCCESS.code, message: ERROR_CODES.SUCCESS.message, data: res && res?.data ? res?.data : null });
            }
            if(res && res?.disconnected) {
                if(payload && payload?.room && payload?.room?.code) {
                    this.leave(payload?.room?.code);
                }
                this.disconnect(true);
            }
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
