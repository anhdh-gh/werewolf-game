const EVENTS = require('../constants/events');
const chatService = require('../services/chat.service');

module.exports = (io, socket) => {

    socket.emit(EVENTS.SYSTEM_MESSAGE, {
        message: 'Connected to Socket.IO server'
    });

    socket.on(EVENTS.CHAT_MESSAGE, async (text) => {
        const saved = await chatService.handleMessage(text);
        io.emit(EVENTS.CHAT_MESSAGE, saved);
    });

    socket.on('disconnect', () => {
        console.log('🔴 Socket disconnected:', socket.id);
    });
};
