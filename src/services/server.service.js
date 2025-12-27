const { SERVERS } = require('../constants/servers.constant');

const RoomService = {

    async getServers() {
        return SERVERS;
    },
};

module.exports = RoomService;
