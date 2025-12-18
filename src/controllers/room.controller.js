const RoomService = require('../services/room.service');
const { success } = require('../utils/response');
const errorWrapper = require('../utils/error.wrapper');

exports.creteRoom = errorWrapper(async (req, res) => {
    return success(res, await RoomService.creteRoom(req));
});
