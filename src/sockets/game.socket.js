const EVENTS = require('../constants/events');
const gameHandler = require('./game.handler.socket')
const socketErrorWrapper = require('../utils/socketError.wrapper');

module.exports = (io, socket) => {

    socket.on(EVENTS.CONNECT_ROOM, socketErrorWrapper(gameHandler.connectRoom(io, socket)));
    socket.on(EVENTS.LEAVE_ROOM, socketErrorWrapper(gameHandler.leaveRoom(io, socket)));
    socket.on(EVENTS.START_NEW_GAME, socketErrorWrapper(gameHandler.startNewGame(io, socket)));
    socket.on(EVENTS.START_NIGHT, socketErrorWrapper(gameHandler.startNight(io, socket)));
    socket.on(EVENTS.SEER_DONE, socketErrorWrapper(gameHandler.seerDone(io, socket)));
    socket.on(EVENTS.BODYGUARD_DONE, socketErrorWrapper(gameHandler.bodyGuardDone(io, socket)));
    socket.on(EVENTS.SILENCED_DONE, socketErrorWrapper(gameHandler.silencedDone(io, socket)));
    socket.on(EVENTS.WEREWOLF_VOTING, socketErrorWrapper(gameHandler.wolfVoting(io, socket)));
    socket.on('disconnect', gameHandler.disconnectWs(io, socket));
};
