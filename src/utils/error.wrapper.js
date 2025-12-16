const sendError = require('./sendErrorResponse');

module.exports = (controllerFn) => {
    return async (req, res, next) => {
        try {
            await controllerFn(req, res, next);
        } catch (err) {
            if (res.headersSent) return;
            sendError(err, req, res);
        }
    };
};
