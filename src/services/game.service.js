const AppError = require('../errors/AppError');
const { ROLES } = require('../constants/roles.constant');

const GameService = {

    async getRoles() {
        return Object.values(ROLES);
    },
};

module.exports = GameService;
