const jwt = require('jsonwebtoken');
const JWT_CONSTANTS = require('../constants/jwt.constant');
const { privateKey, publicKey } = require('./key.util');

exports.generateAccessToken = (user) => {
    return jwt.sign(
        {
            sub: user.username
        },
        privateKey,
        {
            algorithm: JWT_CONSTANTS.ALGORITHM,
            expiresIn: process.env.JWT_ACCESS_EXPIRES
        }
    );
};

exports.generateRefreshToken = (user) => {
    return jwt.sign(
        {
            sub: user.username,
            type: JWT_CONSTANTS.REFRESH_TOKEN_TYPE
        },
        privateKey,
        {
            algorithm: JWT_CONSTANTS.ALGORITHM,
            expiresIn: process.env.JWT_REFRESH_EXPIRES
        }
    );
};

exports.verifyAccessToken = (token) => {
    return jwt.verify(token, publicKey, {
        algorithms: [JWT_CONSTANTS.ALGORITHM]
    });
};

exports.verifyRefreshToken = (token) => {
    return jwt.verify(token, publicKey, {
        algorithms: [JWT_CONSTANTS.ALGORITHM]
    });
};
