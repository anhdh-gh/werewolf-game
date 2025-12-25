require('dotenv').config();

const http = require('http');
const app = require('./app');
const { initSocket } = require('./config/socket');
const {
    startRoomPhaseJob,
    startClearRoomJob,
    startClearRoomDisconnectJob,
    startClearRoomNotPlayerJob
} = require('./jobs/phase.job');

const server = http.createServer(app);

initSocket(server);       // 👈 init trước
startRoomPhaseJob();      // 👈 job sau
startClearRoomJob();
startClearRoomDisconnectJob();
startClearRoomNotPlayerJob();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
