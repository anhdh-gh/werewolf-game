const pool = require('../config/database');

const RoomRepository = {

    async updateRoom(list) {
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

                const sql = `UPDATE games SET ${fields.join(', ')} WHERE id = ?`;

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

    async getByCode(code, role = null) {
        let sql = `
            SELECT id, username, role, status, votes_received, witch_heal, witch_poison, is_host
            FROM games
            WHERE room_code = ?
        `;
        const params = [code];

        // Nếu role được truyền, thêm điều kiện
        if (role !== null && role !== undefined) {
            sql += ' AND role = ?';
            params.push(role);
        }

        const [result] = await pool.execute(sql, params);

        return result;
    },

    async updateStatus(userId, roomCode, status) {
        let sql = `
            UPDATE games
            SET status = ?
            WHERE id = ? and room_code = ? and status != ?
        `;
        const params = [status, userId, roomCode, status];
        const [result] = await pool.execute(sql, params);
        return result.affectedRows > 0;
    },

    async incrVote(userId, roomCode, votedBy) {
        const sql = `
            UPDATE games
            SET votes_received = votes_received + 1,
                voted_by = CONCAT(COALESCE(voted_by, ''), ?)
            WHERE id = ? AND room_code = ? AND (voted_by IS NULL or voted_by NOT LIKE ?)
        `;

        const params = [`${votedBy}-`, userId, roomCode, `%${votedBy}-%`];

        const [result] = await pool.execute(sql, params);
        return result.affectedRows > 0;
    },

    async resetVote(roomCode, userId = null) {
        let sql = `
            UPDATE games
            SET votes_received = 0, voted_by = null
            WHERE room_code = ?
        `;
        const params = [roomCode];

        if (userId !== null && userId !== undefined) {
            sql += ' AND id = ?';
            params.push(userId);
        }

        const [result] = await pool.execute(sql, params);
        return result.affectedRows > 0;
    },

    async isWolfVoteDone(roomCode) {
        const connection = await pool.getConnection();

        try {
            const [rows] = await connection.query(
                `
                  SELECT 
                    (SELECT SUM(votes_received) 
                     FROM games 
                     WHERE room_code = ?) >= 
                    (SELECT COUNT(id) 
                     FROM games 
                     WHERE room_code = ? AND role = 'WEREWOLF' AND status IS NOT NULL AND status != 'DEAD') 
                  AS result
                  `,
                [roomCode, roomCode]
            );

            // result sẽ là 1 (true) hoặc 0 (false)
            return rows[0].result === 1;
        } finally {
            connection.release();
        }
    }
};

module.exports = RoomRepository;