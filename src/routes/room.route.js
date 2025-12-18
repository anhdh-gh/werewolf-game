const router = require('express').Router();
const controller = require('../controllers/room.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/create', authMiddleware, controller.creteRoom);

module.exports = router;
