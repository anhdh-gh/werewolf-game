const UserService = require('../services/user.service');
const { success } = require('../utils/response');
const errorWrapper = require('../utils/error.wrapper');

exports.deleteUser = errorWrapper(async (req, res) => {
    await UserService.deleteUser(req.user.username);
    return success(res);
});
