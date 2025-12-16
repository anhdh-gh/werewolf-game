// middlewares/validate.middleware.js
const AppError = require('../errors/AppError');
const ERROR_CODES = require('../constants/errorCode.constants');

module.exports = (schema, property = 'body') => {
    return (req, _res, next) => {
        const parsed = schema.safeParse(req[property]);

        if (!parsed.success) {
            throw new AppError(
                ERROR_CODES.INVALID_REQUEST,
                parsed.error.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message
                }))
            );
        }

        req[property] = parsed.data;
        next();
    };
};
