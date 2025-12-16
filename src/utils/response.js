const ERROR_CODES = require('../constants/errorCode.constants');

exports.success = (res, data = null, message) => {
    return res.status(200).json({
        meta: {
            code: ERROR_CODES.SUCCESS.code,
            message: message || ERROR_CODES.SUCCESS.message
        },
        data
    });
};


exports.error = (res, errApp = ERROR_CODES.INTERNAL_ERROR) => {
    return res.status(Math.floor(errApp.code / 10)).json({
        meta: {
            code: errApp.code,
            message: errApp.message
        }
    });
};
