const router = require('express').Router();
const controller = require('../controllers/auth.controller');
const { registerDto, loginDto } = require('../dto/auth.dto');
const validate = require('../middlewares/validate.middleware');

router.post('/register', validate(registerDto), controller.register);
router.post('/login', validate(loginDto), controller.login);

module.exports = router;
