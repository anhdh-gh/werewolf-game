const express = require('express');
const router = express.Router();

router.use('/v1/health', require('./health.route'));
router.use('/v1/auth', require('./auth.route'));
router.use('/v1/users', require('./user.route'));
router.use('/v1/games', require('./game.route'));
router.use('/v1/rooms', require('./room.route'));

module.exports = router;
