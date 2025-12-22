const pool = require('../config/database');
const { STATUS } = require('../constants/status.constant')
const { PHASE } = require('../constants/phase.constant')
const crypto = require('crypto');

const RoomRepository = {

    async createRoom() {
        const maxRetries = 5;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            // Generate a random 6-character alphanumeric code
            const code = crypto.randomBytes(3).toString('hex').toUpperCase(); // e.g., 'A1B2C3'

            try {
                const now = new Date();
                // Insert room into DB
                await pool.query(
                    `INSERT INTO rooms (code, status, current_phase, phase_expires_at) 
                     VALUES (?, ?, ?, ?)`,
                    [code, STATUS.WAITING, PHASE.LOBBY, new Date(now.getTime() + 10 * 60 * 1000)] // 10 minutes
                );

                // Success: return the room code
                return code;
            } catch (err) {
                // Duplicate code: retry
                if (err.code === 'ER_DUP_ENTRY') {
                    console.warn(`Room code conflict, retrying... (${attempt + 1})`);
                    continue;
                }
                // Other errors: throw
                throw err;
            }
        }

        throw new Error('Failed to generate unique room code after multiple attempts');
    }
};

module.exports = RoomRepository;