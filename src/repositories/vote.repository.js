const pool = require('../config/database');

const VoteRepository = {

    async clearVotes(roomCode) {
        if (!roomCode) return;

        pool.getConnection()
            .then(conn => {
                return Promise.all([
                    conn.query('DELETE FROM votes WHERE room_code = ?', [roomCode]),
                ]).finally(() => conn.release());
            })
            .catch(err => {
                console.error('clearVotes failed', err);
            });
    },

    async getVote(roomCode, phase) {
        const [result] = await pool.query(
            `SELECT target_id as player_id, target_username as username, count(*) as num_vote
             FROM votes
             WHERE room_code = ? and phase = ?
             GROUP BY target_id, target_username
             ORDER BY num_vote DESC LIMIT 1`,
            [roomCode, phase]
        );
        return result;
    },
};

module.exports = VoteRepository;