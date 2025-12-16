const AuthService = require('../services/auth.service');
const { success } = require('../utils/response');
const errorWrapper = require('../utils/error.wrapper');

exports.register = errorWrapper(async (req, res) => {
    return success(res, await AuthService.register(req.body));
});

exports.login = errorWrapper(async (req, res) => {
    return success(res, await AuthService.login(req.body));
});