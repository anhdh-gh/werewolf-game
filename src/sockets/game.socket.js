const EVENTS = require('../constants/events');
const gameService = require('../services/game.service');

module.exports = (io, socket) => {

    //
    socket.on(EVENTS.CONNECT_ROOM, async (payload) => {
        //
        const { room } = payload;
        socket.join(room.code);
        const players = await gameService.connectRoom(socket.user.id, room.code, socket.id)

        //
        io.to(room.code).emit(EVENTS.CONNECT_ROOM, {
            players
        })
    });

    //
    socket.on('disconnect', () => {
    });
};
