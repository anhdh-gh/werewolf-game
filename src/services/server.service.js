const AppError = require('../errors/AppError');
const { SERVERS } = require('../constants/servers.constant');

const GameService = {

    async getServers() {
        return Object.values(SERVERS);
    },
};

module.exports = GameService;
