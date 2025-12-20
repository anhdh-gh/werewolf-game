const pool = require('../config/database');

const RoomRepository = {

    async updateRoom(userId, roomCode = null, socketId = null, role = null, isDead = null, guardUserId = null, isHealUsed = null, isKillUsed = null) {
        return await pool.execute(
            `
                UPDATE games
                SET room_code = ?,
                    socket_id = ?,
                    role = ?,
                    is_dead = ?,
                    guard_user_id = ?,
                    is_heal_used = ?,
                    is_kill_used = ?
                WHERE id = ?
            `,
            [roomCode, socketId, role, isDead, guardUserId, isHealUsed, isKillUsed, userId]
        );
    },

    async getByCode(code) {
        const [result] = await pool.execute(
            `
                SELECT id, username, role, is_dead, vote_count, guard_user_id, is_heal_used, is_kill_used
                FROM games WHERE room_code = ?
            `,
            [code]
        );

        return result;
    },
};

module.exports = RoomRepository;