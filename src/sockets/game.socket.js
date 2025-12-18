const EVENTS = require('../constants/events');
const gameService = require('../services/game.service');

module.exports = (io, socket) => {

    //
    socket.on(EVENTS.CONNECT_ROOM, async (payload) => {
        //
        const { room_code } = payload;
        socket.join(room_code);
        const players = await gameService.connectRoom(socket.user.id, room_code, socket.id)

        //
        io.to(room_code).emit(EVENTS.CONNECT_ROOM, {
            players
        })
    });

    //
    socket.on('disconnect', () => {
    });
};
