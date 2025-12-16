const ERROR_CODES = require('../constants/errorCode.constants');

module.exports = (err, req, res) => {
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

    res.status(status).json(response);
};
