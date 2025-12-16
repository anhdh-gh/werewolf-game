const pool = require('../config/database');

const UserRepository = {

    async create({email, username, password}) {
        const [result] = await pool.execute(
            `
                INSERT INTO users (email, username, password)
                VALUES (?, ?, ?)
            `,
            [email, username, password]
        );

        return {
            id: result.insertId,
            email,
            username
        };
    },

    async findByEmail(email) {
        const [rows] = await pool.execute(
            `
                SELECT email, username
                FROM users
                WHERE email = ?
            `,
            [email]
        );

        return rows[0] || null;
    },

    async findByUsername(username) {
        const [rows] = await pool.execute(
            `
                SELECT email, username, password
                FROM users
                WHERE username = ?
            `,
            [username]
        );

        return rows[0] || null;
    },

    async updateRefreshToken(username, refreshToken) {
        await pool.execute(
            `
                UPDATE users
                SET refresh_token = ?
                WHERE username = ?
            `,
            [refreshToken, username]
        );
    },

    async clearRefreshToken(id) {
        await pool.execute(
            `
                UPDATE users
                SET refresh_token = NULL
                WHERE id = ?
            `,
            [id]
        );
    },

    async deleteByUsername(username) {
        await pool.execute(
            `
                DELETE
                FROM users
                WHERE username = ?
            `,
            [username]
        );
    }
};

module.exports = UserRepository;

