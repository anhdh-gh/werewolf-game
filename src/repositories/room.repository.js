const pool = require('../config/database');

const RoomRepository = {

    async creteRoom(userId, code) {
        //
        const [result] = await pool.execute(
            `
                INSERT INTO rooms (user_id, code)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE
                  code = VALUES(code),
                  id = LAST_INSERT_ID(id)
              `,
            [userId, code]
        );

        //
        return result.insertId;
    }
};

module.exports = RoomRepository;

