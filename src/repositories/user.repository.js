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
                SELECT id, email, username
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
                SELECT id, email, username, password
                FROM users
                WHERE username = ?
            `,
            [username]
        );

        return rows[0] || null;
    },

    async getByUsername(username) {
        const [rows] = await pool.execute(
            `
                SELECT id, email, username, refresh_token
                FROM users
                WHERE username = ?
            `,
            [username]
        );

        return rows[0] || null;
    },

    async getById(id) {
        const [rows] = await pool.execute(
            `
                SELECT id, email, username, refresh_token
                FROM users
                WHERE id = ?
            `,
            [id]
        );

        return rows[0] || null;
    },

    async updateRefreshToken(id, refreshToken) {
        await pool.execute(
            `
                UPDATE users
                SET refresh_token = ?
                WHERE id = ?
            `,
            [refreshToken, id]
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

    async deleteById(id) {
        await pool.execute(
            `
                DELETE
                FROM users
                WHERE id = ?
            `,
            [id]
        );
    }
};

module.exports = UserRepository;

