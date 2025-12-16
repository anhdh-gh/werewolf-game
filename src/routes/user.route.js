const router = require('express').Router();
const controller = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/delete', authMiddleware, controller.deleteUser);

module.exports = router;
