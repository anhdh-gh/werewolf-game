const ServerService = require('../services/server.service');
const { success } = require('../utils/response');
const errorWrapper = require('../utils/error.wrapper');

exports.getServers = errorWrapper(async (req, res) => {
    return success(res, await ServerService.getServers());
});

