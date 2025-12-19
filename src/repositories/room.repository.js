const pool = require('../config/database');

const RoomRepository = {

    async upsertUserRoom(conn, userId, roomCode, username) {
        await conn.execute(
            `
                INSERT INTO user_room (user_id, room_code, username)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE
                  room_code = VALUES(room_code)
            `,
            [userId, roomCode, username]
        );
    },

    async createRoom(userId, username, code) {
        const conn = await pool.getConnection();

        try {
            await conn.beginTransaction();

            // 1. Insert / update room
            await conn.execute(
                `
                    INSERT INTO rooms (code)
                    VALUES (?)
                    ON DUPLICATE KEY UPDATE
                        code = VALUES(code),
                        id = LAST_INSERT_ID(id)
                `,
                [code]
            );

            // 2. Upsert user_room (owner)
            await this.upsertUserRoom(conn, userId, code, username);
            await conn.commit();
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    },

    async joinRoom(userId, roomCode, username) {
        await this.upsertUserRoom(pool, userId, roomCode, username);
    },

    async connectRoom(userId, roomCode, socketId) {
        await pool.execute(
            `
                UPDATE user_room
                SET
                    socket_id = ?
                WHERE user_id = ? AND room_code = ?
            `,
            [socketId, userId, roomCode]
        );
    },

    async getByCode(code) {
        return await pool.execute(
            `
                SELECT user_id, username, role, pre_role, is_owner, is_dead, vote_count
                FROM user_room WHERE room_code = ?
            `,
            [code]
        );
    }
};

module.exports = RoomRepository;