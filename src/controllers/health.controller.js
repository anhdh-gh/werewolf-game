const { success } = require('../utils/response');
const AppError = require('../errors/AppError');
const ERROR_CODES = require('../constants/errorCode.constants');
const db = require('../config/database'); // ← pool mysql2

exports.health = async (req, res, next) => {
    try {
        // simple ping DB
        await db.execute('SELECT 1');

        return success(res, {
            status: 'UP',
        });

    } catch (err) {
        return next(
            new AppError(
                ERROR_CODES.INTERNAL_ERROR,
                500,
                'Database connection failed'
            )
        );
    }
};
