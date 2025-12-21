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

    async getByCode(code) {
        const [result] = await pool.execute(
            `
                SELECT id, username, role, status, votes_received, meta_data
                FROM games
                WHERE room_code = ?
            `,
            [code]
        );

        return result;
    },
};

module.exports = RoomRepository;