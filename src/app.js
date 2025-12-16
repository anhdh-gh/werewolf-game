const express = require('express');
const cors = require('cors');

const errorHandler = require('./middlewares/error.middleware');
const routes = require('./routes');

const app = express();

// ===== GLOBAL MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== ROUTES =====
app.use('/api', routes);

// ===== ERROR HANDLER =====
app.use(errorHandler);

module.exports = app;
