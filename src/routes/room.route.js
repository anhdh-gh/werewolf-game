const router = require('express').Router();
const controller = require('../controllers/room.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { createRoomDto, joinRoomDto } = require('../dto/room.dto');
const validate = require('../middlewares/validate.middleware');

router.post('/create', authMiddleware, validate(createRoomDto), controller.createRoom);
router.post('/join', authMiddleware, validate(joinRoomDto), controller.joinRoom);

module.exports = router;
