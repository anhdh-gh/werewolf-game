const RoomService = require('../services/room.service');
const { success } = require('../utils/response');
const errorWrapper = require('../utils/error.wrapper');

exports.createRoom = errorWrapper(async (req, res) => {
    return success(res, await RoomService.createRoom(req));
});

exports.joinRoom = errorWrapper(async (req, res) => {
    return success(res, await RoomService.joinRoom(req));
});

