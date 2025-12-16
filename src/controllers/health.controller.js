const { success } = require('../utils/response');
const { error } = require('../utils/response');
const ERROR_CODES = require('../constants/errorCode.constants');

exports.health = async (req, res, next) => {
    try {
        return success(res, {
            status: 'UP',
        });

    } catch (err) {
        return next(
            new AppError(ERROR_CODES.INTERNAL_ERROR)
        );
    }
};
