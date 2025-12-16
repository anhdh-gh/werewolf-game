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

exports.buildError = (err) => {
    const status = err.status || err.statusCode || 500;
    const code = err.code || ERROR_CODES.INTERNAL_ERROR.code;
    const message = err.message || ERROR_CODES.INTERNAL_ERROR.message;

    const response = {
        meta: {
            code,
            message
        }
    };
    if (err.errors != null) {
        response.meta.errors = err.errors;
    }

    //
    if(status / 100 === 5) {
        console.error(err)
    }

    return {status, response};
};