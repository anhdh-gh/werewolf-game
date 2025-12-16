const express = require('express');
const authMiddleware = require("../middlewares/auth.middleware");
const controller = require("../controllers/user.controller");
const router = express.Router();

router.use('/v1/health', require('./health.route'));
router.use('/v1/auth', require('./auth.route'));
router.use('/v1/users', require('./user.route'));

module.exports = router;
