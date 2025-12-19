const ERROR_CODES = require('../constants/errorCode.constants');

exports.success = (res, data = null, message) => {
    const response = {
        meta: {
            code: ERROR_CODES.SUCCESS.code,
            message: message || ERROR_CODES.SUCCESS.message
        }
    };

    if (data !== null) {
        response.data = data;
    }

    return res.status(200).json(response);
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
    const code = err.code || ERROR_CODES.INTERNAL_ERROR.code;
    const message = err.message || ERROR_CODES.INTERNAL_ERROR.message;
    const status = Math.floor(err.code / 10);

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