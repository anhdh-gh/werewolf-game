require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Socket.IO server
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.json());

// API test
app.get('/api/v1/health', (req, res) => {
    res.json({
        success: true,
        message: 'BE alive 🚀',
        time: new Date().toISOString()
    });
});

/**
 * ======================
 * SOCKET.IO
 * ======================
 */
io.on('connection', (socket) => {
    console.log('🟢 Client connected:', socket.id);

    // Send welcome message
    socket.emit('system', {
        message: 'Connected to Socket.IO server'
    });

    // Receive message from client
    socket.on('chat', (message) => {
        console.log('📩 Received:', message);

        // Broadcast to all clients
        io.emit('chat', {
            message
        });
    });

    socket.on('disconnect', () => {
        console.log('🔴 Client disconnected:', socket.id);
    });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
