const ERROR_CODES = require('../constants/errorCode.constants');

exports.success = (res, data = {}, message) => {
    return res.status(200).json({
        meta: {
            code: ERROR_CODES.SUCCESS.code,
            message: message || ERROR_CODES.SUCCESS.message
        },
        data
    });
};


exports.error = (res, code = 5000, message = 'Internal Server Error', status = 500) => {
    return res.status(status).json({
        meta: {
            code,
            message
        },
        data: {}
    });
};
