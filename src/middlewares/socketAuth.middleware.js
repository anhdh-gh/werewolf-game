module.exports = (socket, next) => {
    const token = socket.handshake.auth?.token;

    // if (!token) {
    //     return next(new Error('Unauthorized'));
    // }
    //
    // // TODO: verify token (JWT, session, etc.)
    // socket.user = { id: 'guest' };

    next();
};
