const { success } = require('../utils/response');
const AppError = require('../errors/AppError');
const ERROR_CODES = require('../constants/errorCode.constants');
const prisma = require('../config/prisma');

exports.health = async (req, res, next) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        return success(res, {
            status: 'UP',
        });

    } catch (err) {
        throw new AppError(ERROR_CODES.INTERNAL_ERROR);
    }
};
