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

    async connectRoom(user, roomCode, socketId) {
        return await pool.execute(
            `
                INSERT INTO user_room (user_id, username, room_code, socket_id)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                     room_code = VALUES(room_code),
                     socket_id = VALUES(socket_id)
            `,
            [user.id, user.username, roomCode, socketId]
        );
    },

    async leaveRoom(userId, roomCode) {
        return await pool.execute(
            `
                DELETE
                FROM user_room
                WHERE user_id = ?
                  AND room_code = ?
            `,
            [userId, roomCode]
        );
    },

    async getByCode(code) {
        const [result] = await pool.execute(
            `
                SELECT user_id, username, role, pre_role, is_dead, vote_count
                FROM user_room WHERE room_code = ?
            `,
            [code]
        );

        return result;
    },

    async getByRomInfo(code) {
        const [result] = await pool.execute(
            `
                SELECT id, code, prev_guard_user_id, is_witch_heal_used, is_witch_kill_used
                FROM rooms WHERE code = ?
            `,
            [code]
        );

        return result;
    },

    async getBySocketId(userId, socketId) {
        const [result] = await pool.execute(
            `
                SELECT room_code
                FROM user_room WHERE socket_id = ? and user_id = ?
            `,
            [socketId, userId]
        );

        return result?.[0]?.room_code;
    },

    async getNumberOfPlayers(roomCode) {
        const [result] = await pool.execute(
            `
                SELECT count(user_id) as 'numberOfPlayers'
                FROM user_room WHERE room_code = ?
            `,
            [roomCode]
        );

        return result?.[0]?.numberOfPlayers
    },

    async deleteRoom(roomCode) {
        return await pool.execute(
            `
                DELETE
                FROM rooms
                WHERE code = ?
            `,
            [roomCode]
        );
    },
};

module.exports = RoomRepository;