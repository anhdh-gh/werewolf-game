require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API test
app.get('/api/ping', (req, res) => {
    res.json({
        success: true,
        message: 'BE alive 🚀',
        time: new Date().toISOString()
    });
});

// WebSocket
wss.on('connection', (ws) => {
    console.log('🟢 Client connected');

    ws.send(JSON.stringify({
        type: 'system',
        message: 'Connected to WebSocket server'
    }));

    ws.on('message', (data) => {
        const message = data.toString();
        console.log('📩 Received:', message);

        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'chat',
                    message
                }));
            }
        });
    });

    ws.on('close', () => {
        console.log('🔴 Client disconnected');
    });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
