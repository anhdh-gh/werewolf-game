const pool = require('../config/database');

const PlayerRepository = {

    async playerDisconnected(userId) {
        const [result] = await pool.query(
            `UPDATE players 
             SET is_connected = FALSE, is_alive = FALSE
             WHERE id = ?`,
            [userId]
        );

        return result.affectedRows;
    },

    async leaveRoom(playerId, roomCode) {
        await pool.query(
            `DELETE FROM players
             WHERE player_id = ? and room_code = ?`,
            [playerId, roomCode]
        );
    },

    async connectRoom(playerId, roomCode) {
        await pool.query(
            `INSERT INTO players(player_id, room_code, is_connected)
             VALUES (?, ?, true)
             ON DUPLICATE KEY UPDATE
                is_connected = true`,
            [playerId, roomCode]
        );
    },

    async getRoom(playerId) {
        const [result] = await pool.query(
            `SELECT room_code FROM players
             WHERE player_id = ?`,
            [playerId]
        );
        return result;
    }
};

module.exports = PlayerRepository;