const pool = require('../config/database');
const { STATUS } = require('../constants/status.constant')
const { PHASE } = require('../constants/phase.constant')
const crypto = require('crypto');
const AppError = require('../errors/AppError');
const ERROR_CODES = require('../constants/errorCode.constants');

const RoomRepository = {

    async createRoom(max_players) {
        const maxRetries = 5;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            // Generate a random 6-character alphanumeric code
            const code = crypto.randomBytes(3).toString('hex').toUpperCase(); // e.g., 'A1B2C3'

            try {
                // Insert room into DB
                await pool.query(
                    `INSERT INTO rooms (code, status, current_phase, max_players) 
                     VALUES (?, ?, ?, ?)`,
                    [code, STATUS.WAITING, PHASE.LOBBY.key, max_players]
                );

                // Success: return the room code
                return code;
            } catch (err) {
                // Duplicate code: retry
                if (err.code === 'ER_DUP_ENTRY') {
                    continue;
                }
                // Other errors: throw
                throw err;
            }
        }

        throw new AppError(ERROR_CODES.INTERNAL_ERROR);
    },

    async getByCode(roomCode) {
        if(!roomCode) {
            return
        }

        const [result] = await pool.query(
            `SELECT status, current_phase, max_players FROM rooms
             WHERE code = ?`,
            [roomCode]
        );

        return result?.[0];
    },

    async getByCodeAndPhase(roomCode, phase) {
        if(!roomCode || !phase) {
            return
        }

        const [result] = await pool.query(
            `SELECT status, max_players FROM rooms
             WHERE code = ? AND current_phase = ?`,
            [roomCode, phase]
        );

        return result?.[0];
    },

    async upsertVote(roomCode, phase, voterId, target) {
        if (!roomCode || !phase || !voterId || !target) {
            return;
        }

        const [result] = await pool.query(
            `
                INSERT INTO votes (room_code, phase, voter_id, target_id, target_username)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    target_id = VALUES(target_id),
                    target_username = VALUES(target_username)
            `,
            [roomCode, phase, voterId, target.id, target.username]
        );

        return result;
    },

    async clearData(roomCode) {
        if (!roomCode) return;

        pool.getConnection()
            .then(conn => {
                return Promise.all([
                    conn.query('DELETE FROM votes WHERE room_code = ?', [roomCode]),
                    conn.query('DELETE FROM actions WHERE room_code = ?', [roomCode]),
                    conn.query('DELETE FROM players WHERE room_code = ?', [roomCode]),
                    conn.query('DELETE FROM rooms WHERE code = ?', [roomCode]),
                ]).finally(() => conn.release());
            })
            .catch(err => {
                console.error('clearData failed', err);
            });
    },

    async updateRooms(list) {
        const conn = await pool.getConnection();

        try {
            await conn.beginTransaction();

            for (const item of list) {
                const { code, ...fieldsData } = item;
                if (!code) continue;

                const fields = [];
                const values = [];

                for (const [key, value] of Object.entries(fieldsData)) {
                    if (value === undefined) continue;

                    // ✅ CASE 1: RAW SQL (TIMESTAMPADD, NOW, ...)
                    if (value && value.__raw === true) {
                        fields.push(`${key} = ${value.sql}`);
                        if (Array.isArray(value.params)) {
                            values.push(...value.params);
                        }
                        continue;
                    }

                    // ✅ CASE 2: Normal value
                    fields.push(`${key} = ?`);

                    if (value !== null && typeof value === 'object') {
                        values.push(JSON.stringify(value));
                    } else {
                        values.push(value);
                    }
                }

                if (fields.length === 0) continue;

                values.push(code);

                const sql = `
                    UPDATE rooms
                    SET ${fields.join(', ')}
                    WHERE code = ?
                `;

                await conn.execute(sql, values);
            }

            await conn.commit();
        } catch (err) {
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

    async raw(sql, params = []) {
        return {
            __raw: true,
            sql,
            params
        }
    },

    async findExpiredPhases() {
        const conn = await pool.getConnection();
        try {
            const [rows] = await conn.query(
                `
                SELECT code, current_phase
                FROM rooms
                WHERE status = 'PLAYING'
                  AND phase_expires_at IS NOT NULL
                  AND phase_expires_at <= NOW()
                LIMIT 20
                `
            );

            return rows;
        } finally {
            conn.release();
        }
    },

    async findStartGame() {
        const conn = await pool.getConnection();
        try {
            const [rows] = await conn.query(
                `
                    SELECT r.code as code
                    FROM rooms r
                    JOIN players p ON p.room_code = r.code
                    WHERE r.status = 'WAITING'
                      AND r.current_phase = 'LOBBY'
                      AND r.max_players >= 4
                      AND p.is_ready = TRUE
                      AND p.is_connected = TRUE
                    GROUP BY r.code, r.max_players
                    HAVING COUNT(*) = r.max_players
                    LIMIT 20;
                `
            );

            return rows;
        } finally {
            conn.release();
        }
    },

    async findRoomsCreatedOverHours(hours) {
        const conn = await pool.getConnection();
        try {
            const [rows] = await conn.query(
                `
                    SELECT code
                    FROM rooms
                    WHERE created_at <= NOW() - INTERVAL ? HOUR
                    LIMIT 20
                `,
                [hours]
            );
            return rows;
        } finally {
            conn.release();
        }
    },

    async findRoomsAllDisconnected(limit = 20) {
        const conn = await pool.getConnection();
        try {
            const [rows] = await conn.query(
                `
                    SELECT room_code as code
                    FROM players
                    GROUP BY room_code
                    HAVING SUM(is_connected = 1) = 0 LIMIT ?
                `,
                [limit]
            );
            return rows;
        } finally {
            conn.release();
        }
    },

    async findEmptyRoomsCreatedOverHours(hours, limit = 20) {
        const conn = await pool.getConnection();
        try {
            const [rows] = await conn.query(
                `
                    SELECT r.code as code
                    FROM rooms r
                    WHERE r.created_at <= DATE_SUB(NOW(), INTERVAL ? HOUR)
                      AND NOT EXISTS (SELECT 1
                                      FROM players p
                                      WHERE p.room_code = r.code)
                        LIMIT ?
                `,
                [hours, limit]
            );
            return rows;
        } finally {
            conn.release();
        }
    }
};

module.exports = RoomRepository;