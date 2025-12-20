const pool = require('../config/database');

const UserRepository = {

    async create({email, username, password}) {
        const [result] = await pool.execute(
            `
                INSERT INTO games (email, username, password)
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
                FROM games
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
                FROM games
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
                FROM games
                WHERE id = ?
            `,
            [id]
        );

        return rows[0] || null;
    },

    async updateRefreshToken(id, refreshToken) {
        await pool.execute(
            `
                UPDATE games
                SET refresh_token = ?
                WHERE id = ?
            `,
            [refreshToken, id]
        );
    },

    async deleteById(id) {
        await pool.execute(
            `
                DELETE
                FROM games
                WHERE id = ?
            `,
            [id]
        );
    },

    async getInfo(id) {
        const [rows] = await pool.execute(
            `
                SELECT id, email, username
                FROM games
                WHERE id = ?
            `,
            [id]
        );

        return rows[0] || null;
    },
};

module.exports = UserRepository;

