const router = require('express').Router();
const controller = require('../controllers/game.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/roles/get', authMiddleware, controller.getRoles);

module.exports = router;
