const pool = require('../config/database');
const { STATUS } = require('../constants/status.constant')
const { PHASE } = require('../constants/phase.constant')
const crypto = require('crypto');
const AppError = require('../errors/AppError');
const ERROR_CODES = require('../constants/errorCode.constants');

const RoomRepository = {

    async createRoom() {
        const maxRetries = 5;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            // Generate a random 6-character alphanumeric code
            const code = crypto.randomBytes(3).toString('hex').toUpperCase(); // e.g., 'A1B2C3'

            try {
                // Insert room into DB
                await pool.query(
                    `INSERT INTO rooms (code, status, current_phase) 
                     VALUES (?, ?, ?)`,
                    [code, STATUS.WAITING, PHASE.LOBBY]
                );

                // Success: return the room code
                return code;
            } catch (err) {
                // Duplicate code: retry
                if (err.code === 'ER_DUP_ENTRY') {
                    continue;
                }
                // Other errors: throw
                throw err;
            }
        }

        throw new AppError(ERROR_CODES.INTERNAL_ERROR);
    },

    async getByCode(roomCode) {
        const [result] = await pool.query(
            `SELECT status, current_phase FROM rooms
             WHERE code = ?`,
            [roomCode]
        );

        return result?.[0];
    }
};

module.exports = RoomRepository;