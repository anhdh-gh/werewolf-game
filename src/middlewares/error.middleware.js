const sendError = require('../utils/sendErrorResponse');

module.exports = (err, req, res, next) => {
    if (res.headersSent) return next(err);
    sendError(err, req, res);
};
