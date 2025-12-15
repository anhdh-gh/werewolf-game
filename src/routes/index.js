const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');

// Public
router.use('/v1/health', require('./health.route'));

// Protected
// router.use('/v1/chat', auth, chatRoute);

module.exports = router;
