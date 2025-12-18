const pool = require('../config/database');

const RoomRepository = {

    async upsertUserRoom(conn, userId, roomCode, username, isOwner) {
        await conn.execute(
            `
                INSERT INTO user_room (user_id, room_code, username, is_owner)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                  is_owner = VALUES(is_owner)
            `,
            [userId, roomCode, username, isOwner]
        );
    },

    async createRoom(userId, username, code) {
        const conn = await pool.getConnection();

        try {
            await conn.beginTransaction();

            // 1. Insert / update room
            await conn.execute(
                `
                    INSERT INTO rooms (user_id, code)
                    VALUES (?, ?)
                    ON DUPLICATE KEY UPDATE
                        code = VALUES(code),
                        id = LAST_INSERT_ID(id)
                `,
                [userId, code]
            );

            // 2. Upsert user_room (owner)
            await this.upsertUserRoom(conn, userId, code, username, true);
            await conn.commit();
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    },

    async joinRoom(userId, roomId, username) {
        await this.upsertUserRoom(pool, userId, roomId, username, null);
    },

    async connectRoom(userId, roomId, socketId) {
        await pool.execute(
            `
                UPDATE user_room
                SET
                    socket_id = ?
                WHERE user_id = ? AND room_code = ?
            `,
            [socketId, userId, roomId]
        );
    }
};

module.exports = RoomRepository;