const pool = require('../config/database');

const PlayerRepository = {

    async playerDisconnected(userId) {
        const [result] = await pool.query(
            `UPDATE players 
             SET is_connected = FALSE, is_alive = FALSE
             WHERE player_id = ?`,
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

    async playerReady(playerId, roomCode) {
        await pool.query(
            `INSERT INTO players(player_id, room_code, is_ready, is_connected)
             VALUES (?, ?, true, true)
             ON DUPLICATE KEY UPDATE
               is_connected = true,
               is_ready = true`,
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
    },

    async getPlayers(roomCode) {
        const [result] = await pool.query(
            `SELECT id, player_id FROM players
             WHERE room_code = ? and is_ready = true and is_connected = true`,
            [roomCode]
        );
        return result;
    },

    async checkRoleAlive(roomCode, role) {
        const [rows] = await pool.query(
            `
                SELECT 1
                FROM players
                WHERE room_code = ?
                  AND (role = ? OR initial_role = ?)
                  AND is_alive = true
                  AND is_ready = true
                  AND is_connected = true
                    LIMIT 1
            `,
            [roomCode, role, role]
        );

        return rows.length > 0;
    },

    async updatePlayers(list) {
        const conn = await pool.getConnection(); // Lấy 1 connection duy nhất

        try {
            await conn.beginTransaction();

            for (const item of list) {
                const { id, ...fieldsData } = item;
                if (!id) continue; // bỏ qua nếu không có id

                const fields = [];
                const values = [];

                // Build dynamic SQL
                for (const [key, value] of Object.entries(fieldsData)) {
                    if (value !== undefined) { // chỉ update nếu khác undefined
                        fields.push(`${key} = ?`);

                        // Serialize object/array thành JSON string
                        if (value !== null && typeof value === 'object') {
                            values.push(JSON.stringify(value));
                        } else {
                            values.push(value); // string, number, null đều ok
                        }
                    }
                }

                // Nếu không có field nào hợp lệ → bỏ qua
                if (fields.length === 0) continue;

                values.push(id); // id cuối cùng cho WHERE

                const sql = `UPDATE players SET ${fields.join(', ')} WHERE id = ?`;

                // Debug log (có thể comment khi production)
                // console.log('SQL:', sql);
                // console.log('Values:', values);

                await conn.execute(sql, values);
            }

            await conn.commit();
        } catch (err) {
            // Rollback trong try/catch riêng để chắc chắn không crash
            try {
                await conn.rollback();
            } catch (rollbackErr) {
                console.error('Rollback failed', rollbackErr);
            }
            throw err;
        } finally {
            conn.release();
        }
    },
};

module.exports = PlayerRepository;