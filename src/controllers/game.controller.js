const GameService = require('../services/game.service');
const { success } = require('../utils/response');
const errorWrapper = require('../utils/error.wrapper');

exports.getRoles = errorWrapper(async (req, res) => {
    return success(res, await GameService.getRoles());
});
