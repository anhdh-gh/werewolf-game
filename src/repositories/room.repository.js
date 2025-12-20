const pool = require('../config/database');

const RoomRepository = {

    async updateRoom(userId, roomCode = null, socketId = null, role = null, status = null, votes_received = null, meta_data = null) {
        return await pool.execute(
            `
                UPDATE games
                SET room_code = ?,
                    socket_id = ?,
                    role = ?,
                    status = ?,
                    votes_received = ?,
                    meta_data = ?
                WHERE id = ?
            `,
            [roomCode, socketId, role, status, votes_received, meta_data, userId]
        );
    },

    async getByCode(code) {
        const [result] = await pool.execute(
            `
                SELECT id, username, role, status, votes_received, meta_data
                FROM games WHERE room_code = ?
            `,
            [code]
        );

        return result;
    },
};

module.exports = RoomRepository;