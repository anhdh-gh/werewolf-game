const jwtUtil = require('../utils/jwt.util');
const ERROR_CODES = require('../constants/errorCode.constants');
const AppError = require('../errors/AppError');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        throw new AppError(ERROR_CODES.UNAUTHORIZED)
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        throw new AppError(ERROR_CODES.UNAUTHORIZED)
    }

    try {
        const decoded = jwtUtil.verifyAccessToken(token);
        req.user = {
            id: Number(decoded.sub),
            username: decoded.username
        };
        next();
    } catch (err) {
        throw new AppError(ERROR_CODES.UNAUTHORIZED)
    }
};
