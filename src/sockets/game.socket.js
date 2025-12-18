const EVENTS = require('../constants/events');
const gameService = require('../services/game.service');

module.exports = (io, socket) => {

    //
    socket.on(EVENTS.CONNECT_ROOM, async (payload) => {
        //
        const { roomId } = payload;
        socket.join(roomId);
        const players = await gameService.connectRoom(socket.user.id, roomId, socket.id)

        //
        io.to(roomId).emit(EVENTS.CONNECT_ROOM, players)
    });

    //
    socket.on('disconnect', () => {
    });
};
