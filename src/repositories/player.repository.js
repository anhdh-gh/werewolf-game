const pool = require('../config/database');

const PlayerRepository = {

    /**[ DISCONNECT ]* */
    async playerDisconnected(userId) {
        const [result] = await pool.query(
            `UPDATE players 
             SET is_connected = FALSE, is_alive = FALSE
             WHERE id = ?`,
            [userId]
        );

        return result.affectedRows;
    },

    async connectRoom(playerId, roomCode) {
        await pool.query(
            `INSERT INTO players(player_id, room_code, is_connected)
             VALUES (?, ?, true)
             ON DUPLICATE KEY UPDATE
                is_connected = true`,
            [playerId, roomCode]
        );
    }
};

module.exports = PlayerRepository;