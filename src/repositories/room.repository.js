const pool = require('../config/database');

const RoomRepository = {

    async createRoom(userId, code) {
        const conn = await pool.getConnection();

        try {
            await conn.beginTransaction();

            // 1. Insert / update room
            const [roomResult] = await conn.execute(
                `
                    INSERT INTO rooms (user_id, code)
                    VALUES (?, ?) ON DUPLICATE KEY
                    UPDATE
                        code =
                    VALUES (code), id = LAST_INSERT_ID(id)
                `,
                [userId, code]
            );

            const roomId = roomResult.insertId;

            // 2. Insert / update user_room
            await conn.execute(
                `
                    INSERT INTO user_room (room_id, user_id, is_owner)
                    VALUES (?, ?, ?) 
                    ON DUPLICATE KEY UPDATE 
                        is_owner = VALUES (is_owner)
                `,
                [
                    roomId,
                    userId,
                    true
                ]
            );

            await conn.commit();
            return roomId;
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }
};

module.exports = RoomRepository;

