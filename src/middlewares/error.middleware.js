const ERROR_CODES = require('../constants/errorCode.constants');

module.exports = (err, req, res, next) => {
    console.error('🔥 Error:', err);

    const status = err.status || 500;
    const code = err.code || ERROR_CODES.INTERNAL_ERROR.code;
    const message = err.message || ERROR_CODES.INTERNAL_ERROR.message;

    res.status(status).json({
        meta: {
            code,
            message
        },
        data: {}
    });
};
