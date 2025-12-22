const EVENTS = require('../constants/events');
const ERROR_CODES = require('../constants/errorCode.constants');
const gameService = require('../services/game.service');

module.exports.ok

module.exports.emitGameFlow = ({socket,io, roomCode, dataFlow, ack }) => {
    // Join room (safe nếu join nhiều lần)
    socket.join(roomCode);

    // Emit flow hiện tại
    if(dataFlow) {
        if(dataFlow?.current) {
            io.to(roomCode).emit(EVENTS.NEXT_GAME_FLOW, dataFlow.current);
        }

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
    }

    // Ack cho client
    if (typeof ack === 'function') {
        ack({
            code: ERROR_CODES.SUCCESS.code,
            message: ERROR_CODES.SUCCESS.message
        });
    }
};

module.exports.checkDuplicationEvent = async (roomCode, event, ack, handler, isUpdate = true) => {
    if(await gameService.checkEvent(roomCode, event)) {
        if (typeof ack === 'function') {
            ack({ code: ERROR_CODES.SUCCESS.code, message: ERROR_CODES.SUCCESS.message });
        }
        return
    }

    //
    await handler()

    //
    if(isUpdate) {
        await gameService.updateEvent(roomCode, event)
    }
};
