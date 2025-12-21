const EVENTS = require('../constants/events');
const ERROR_CODES = require('../constants/errorCode.constants');

module.exports.emitGameFlow = ({socket,io, roomCode, dataFlow, ack }) => {
    // Join room (safe nếu join nhiều lần)
    socket.join(roomCode);

    // Emit flow hiện tại
    io.to(roomCode).emit(EVENTS.NEXT_GAME_FLOW, dataFlow.current);

    // Emit flow tiếp theo nếu có
    if (dataFlow?.next) {
        setTimeout(() => {
            try {
                io.to(roomCode).emit(
                    EVENTS.NEXT_GAME_FLOW,
                    dataFlow.next.data
                );
            } catch (_) {
            }
        }, dataFlow.next.after);
    }

    // Ack cho client
    if (typeof ack === 'function') {
        ack({
            code: ERROR_CODES.SUCCESS.code,
            message: ERROR_CODES.SUCCESS.message
        });
    }
};
