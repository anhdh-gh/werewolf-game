const router = require('express').Router();
const controller = require('../controllers/auth.controller');
const { registerDto, loginDto , refreshDto } = require('../dto/auth.dto');
const validate = require('../middlewares/validate.middleware');

router.post('/register', validate(registerDto), controller.register);
router.post('/login', validate(loginDto), controller.login);
router.post('/refresh', validate(refreshDto), controller.refresh);

module.exports = router;
