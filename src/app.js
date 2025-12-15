const express = require('express');
const cors = require('cors');

const logger = require('./middlewares/logger.middleware');
const errorHandler = require('./middlewares/error.middleware');
const routes = require('./routes');

const app = express();

// ===== GLOBAL MIDDLEWARE =====
app.use(cors());
app.use(express.json());
app.use(logger);

// ===== ROUTES =====
app.use('/api', routes);

// ===== ERROR HANDLER (Bottom) =====
app.use(errorHandler);

module.exports = app;
