const UserService = require('../services/user.service');
const { success } = require('../utils/response');
const errorWrapper = require('../utils/error.wrapper');

exports.deleteUser = errorWrapper(async (req, res) => {
    await UserService.deleteUser(req.user.id);
    return success(res);
});

exports.getInfo = errorWrapper(async (req, res) => {
    return success(res, await UserService.getInfo(req.user.id));
});