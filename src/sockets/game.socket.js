const EVENTS = require('../constants/events');
const gameService = require('../services/game.service');

module.exports = (io, socket) => {

    //
    socket.on(EVENTS.CONNECT_ROOM, async (text) => {
        const saved = await gameService.handleMessage(text);
        io.emit(EVENTS.CONNECT_ROOM, saved);
    });

    //
    socket.on('disconnect', () => {
    });
};
