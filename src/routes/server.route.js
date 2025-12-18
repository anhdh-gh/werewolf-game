const router = require('express').Router();
const controller = require('../controllers/server.controller');

router.post('/info', controller.getServers);

module.exports = router;
