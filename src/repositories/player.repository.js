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

    async resetGame(roomCode) {
        const [result] = await pool.query(
            `UPDATE players 
             SET is_alive = FALSE, is_ready = FALSE, is_muted = FALSE, is_protected = FALSE, witch_heal = 1, witch_poison = 1, role = null, initial_role = null
             WHERE room_code = ?`,
            [roomCode]
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

    async connectRoom(player, roomCode) {
        await pool.query(
            `INSERT INTO players(player_id, username, room_code, is_connected)
             VALUES (?, ?, ?, true)
             ON DUPLICATE KEY UPDATE
                username = VALUES(username),
                is_connected = true`,
            [player.id, player.username, roomCode]
        );
    },

    async playerReady(player, roomCode) {
        await pool.query(
            `INSERT INTO players(player_id, username, room_code, is_ready, is_connected)
             VALUES (?, ?, ?, true, true)
             ON DUPLICATE KEY UPDATE
               username = VALUES(username),
               is_connected = true,
               is_ready = true`,
            [player.id, player.username, roomCode]
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

    async getPlayerInfo(roomCode, playerIds) {
        let sql = `
            SELECT player_id, username, role, initial_role, is_alive, is_ready,
               is_muted, is_connected, witch_heal, witch_poison, is_protected
            FROM players
            WHERE room_code = ?
        `;

        const params = [roomCode];

        //
        if (playerIds && playerIds.length > 0) {
            sql += ` AND player_id IN (?)`;
            params.push(playerIds);
        }

        const [result] = await pool.query(sql, params);
        return result;
    },

    async getCurRole(roomCode, playerIds) {
        const [result] = await pool.query(`
            SELECT player_id, role
            FROM players
            WHERE room_code = ?
              AND player_id IN (?)
              AND is_alive = TRUE
              AND is_ready = TRUE
              AND is_connected = TRUE
        `, [roomCode, playerIds]);
        return result;
    },

    async getRoles(roomCode) {
        const [result] = await pool.query(
            `SELECT DISTINCT initial_role
             FROM players
             WHERE room_code = ?`,
            [roomCode]
        );
        return result;
    },

    async getRole(roomCode, playerId) {
        const [result] = await pool.query(
            `SELECT role
             FROM players
             WHERE room_code = ?
               AND player_id = ?
               AND is_alive = TRUE
               AND is_ready = TRUE
               AND is_connected = TRUE`,
            [roomCode, playerId]
        );
        return result?.[0];
    },

    async isRoleAlive(roomCode, roles) {
        if (!roles.length) return false;
        const [rows] = await pool.query(
            `
                SELECT 1
                FROM players
                WHERE room_code = ?
                  AND initial_role IN (?)
                  AND is_alive = TRUE
                  AND is_ready = TRUE
                  AND is_connected = TRUE
                LIMIT 1
            `,
            [roomCode, roles]
        );

        return rows.length > 0;
    },

    async getRoleAlive(roomCode, roles = []) {
        if (!roles.length) return null;
        const [rows] = await pool.query(
            `
            SELECT role
            FROM players
            WHERE room_code = ?
              AND initial_role IN (?)
              AND is_alive = TRUE
              AND is_ready = TRUE
              AND is_connected = TRUE
            LIMIT 1
        `,
            [roomCode, roles]
        );

        return rows.length ? rows[0].role : null;
    },

    async checkGuard(roomCode, playerId) {
        const [rows] = await pool.query(
            `
                SELECT 1
                FROM players
                WHERE room_code = ? AND player_id = ? AND is_protected = TRUE
                LIMIT 1
            `,
            [roomCode, playerId]
        );

        return rows.length > 0;
    },

    async countRoleAlive(roomCode, role) {
        const [rows] = await pool.query(
            `
            SELECT COUNT(*) AS num
            FROM players
            WHERE room_code = ?
              AND role = ?
              AND is_alive = TRUE
              AND is_ready = TRUE
              AND is_connected = TRUE
            `,
            [roomCode, role]
        );

        return Number(rows[0].num);
    },

    async countRoleRemainAlive(roomCode, roles) {
        const [rows] = await pool.query(
            `
            SELECT COUNT(*) AS num
            FROM players
            WHERE room_code = ?
              AND role NOT IN (?)
              AND is_alive = TRUE
              AND is_ready = TRUE
              AND is_connected = TRUE
            `,
            [roomCode, roles]
        );

        return Number(rows[0].num);
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