const pool = require('../config/database');
const { ROLES } = require('../constants/roles.constant')

const VoteRepository = {

    async clearVotes(roomCode) {
        if (!roomCode) return;

        pool.getConnection()
            .then(conn => {
                return Promise.all([
                    conn.query('DELETE FROM votes WHERE room_code = ?', [roomCode]),
                    conn.query('DELETE FROM actions WHERE room_code = ?', [roomCode])
                ]).finally(() => conn.release());
            })
            .catch(err => {
                console.error('clearVotes failed', err);
            });
    },

    async findByRoomAndPhase(roomCode, phase) {
        if (!roomCode || !phase) return [];
        const [rows] = await pool.query(
            `SELECT phase, target_id, target_username
             FROM votes
             WHERE room_code = ? AND phase = ?`,
            [roomCode, phase]
        );
        return rows;
    },

    async findByRoomAndPhases(roomCode, phases = []) {
        if (!roomCode || !phases.length) return [];
        const [rows] = await pool.query(
            `SELECT phase, target_id, target_username
             FROM votes
             WHERE room_code = ? AND phase IN (?)`,
            [roomCode, phases]
        );
        return rows;
    },

    async withTransaction(callback) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            const result = await callback(conn);
            await conn.commit();
            return result;
        } catch (e) {
            await conn.rollback();
            throw e;
        } finally {
            conn.release();
        }
    },

    /* ===== PLAYER UPDATE ===== */

    async resetNight(roomCode, conn) {
        await conn.query(
            `UPDATE players
             SET is_protected = false, is_muted = false
             WHERE room_code = ?`,
            [roomCode]
        );
    },

    async setProtected(playerId, roomCode, conn) {
        await conn.query(
            `UPDATE players
             SET is_protected = true
             WHERE room_code = ? AND player_id = ?`,
            [roomCode, playerId]
        );
    },

    async setMuted(playerId, roomCode, conn) {
        await conn.query(
            `UPDATE players
             SET is_muted = true
             WHERE room_code = ? AND player_id = ?`,
            [roomCode, playerId]
        );
    },

    async killPlayers(playerIds, roomCode, conn) {
        await conn.query(
            `UPDATE players
             SET is_alive = false
             WHERE room_code = ? AND player_id IN (?)`,
            [roomCode, playerIds]
        );
    },

    async consumeHeal(roomCode, conn) {
        await conn.query(
            `UPDATE players
             SET witch_heal = witch_heal - 1
             WHERE room_code = ? AND role = ?`,
            [roomCode, ROLES.WITCH.key]
        );
    },

    async consumePoison(roomCode, conn) {
        await conn.query(
            `UPDATE players
             SET witch_poison = witch_poison - 1
             WHERE room_code = ? AND role = ?`,
            [roomCode, ROLES.WITCH.key]
        );
    }
};

module.exports = VoteRepository;