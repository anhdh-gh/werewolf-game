const pool = require('../config/database');

const ActionRepository = {

    async upsertAction(roomCode, phase, actorId, eventCode) {
        if (!roomCode || !phase || !actorId || !eventCode) {
            return;
        }

        const [result] = await pool.query(
            `
                INSERT INTO actions (room_code, phase, actor_id, event_code)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE event_code = event_code
            `,
            [roomCode, phase, actorId, eventCode]
        );

        return result;
    },

    async clearActions(roomCode) {
        if (!roomCode) return;

        pool.getConnection()
            .then(conn => {
                return Promise.all([
                    conn.query('DELETE FROM actions WHERE room_code = ?', [roomCode])
                ]).finally(() => conn.release());
            })
            .catch(err => {
                console.error('clearVotes failed', err);
            });
    },

    async isPhaseCompleted(roomCode, phase, role = null) {
        if (!roomCode || !phase) {
            return false;
        }

        const [rows] = await pool.query(
            `
                SELECT
                    (
                        SELECT COUNT(*)
                        FROM actions a
                        WHERE a.room_code = ?
                          AND a.phase = ?
                    ) =
                    (
                        SELECT COUNT(*)
                        FROM players p
                        WHERE p.room_code = ?
                          AND (? IS NULL OR p.role = ?)
                          AND p.is_alive = TRUE
                          AND p.is_ready = TRUE
                          AND p.is_connected = TRUE
                    ) AS is_completed
            `,
            [roomCode, phase, roomCode, role, role]
        );

        return rows[0]?.is_completed === 1;
    }
};

module.exports = ActionRepository;