require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors());

// File static
app.use(express.static(path.join(__dirname, 'public')));

//
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server đang chạy tại port ${port}`);
});