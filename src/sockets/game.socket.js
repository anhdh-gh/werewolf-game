const EVENTS = require('../constants/events');
const gameService = require('../services/game.service');

module.exports = (io, socket) => {

    //
    socket.on(EVENTS.CHAT_MESSAGE, async (text) => {
        const saved = await gameService.handleMessage(text);
        io.emit(EVENTS.CHAT_MESSAGE, saved);
    });

    //
    socket.on('disconnect', () => {
    });
};
