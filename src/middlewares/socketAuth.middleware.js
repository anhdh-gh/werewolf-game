const jwtUtil = require('../utils/jwt.util');
const ERROR_CODES = require('../constants/errorCode.constants');
const socketError = require('../utils/socketError.util');

module.exports = (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(socketError(ERROR_CODES.UNAUTHORIZED));
        }

        const decoded = jwtUtil.verifyAccessToken(token);

        socket.user = {
            id: decoded.sub,
            username: decoded.username
        };

        next();
    } catch (err) {
        next(socketError(ERROR_CODES.UNAUTHORIZED));
    }
};