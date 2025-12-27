const { SERVERS } = require('../constants/servers.constant');

const RoomService = {

    async getServers() {
        return {
            servers: SERVERS
        };
    },
};

module.exports = RoomService;
