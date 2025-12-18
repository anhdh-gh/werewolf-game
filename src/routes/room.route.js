const router = require('express').Router();
const controller = require('../controllers/room.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/create', authMiddleware, controller.createRoom);
router.post('/join', authMiddleware, controller.joinRoom);

module.exports = router;
