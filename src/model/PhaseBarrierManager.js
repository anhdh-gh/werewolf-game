class PhaseBarrierManager {
    constructor() {
        /**
         * key: `${roomCode}:${phase}`
         * value: {
         *   expected: number,
         *   acted: Set<number>
         * }
         */
        this.map = new Map();
    }

    /**
     * Register a player action for a phase
     *
     * @param {string} roomCode
     * @param {string} phase
     * @param {number} expected - expected number of actions
     * @param {number} playerId
     *
     * @returns {boolean} true if phase is completed
     */
    register(roomCode, phase, expected, playerId) {
        const key = `${roomCode}:${phase}`;

        let state = this.map.get(key);

        // Init phase state if not exists
        if (!state) {
            state = {
                expected,
                acted: new Set()
            };
            this.map.set(key, state);
        } else {
            // Update expected dynamically (player join/leave/die)
            state.expected = expected;
        }

        // Prevent double action
        if (state.acted.has(playerId)) {
            return false;
        }

        state.acted.add(playerId);

        return state.acted.size >= state.expected;
    }

    /**
     * Remove player from current phase (disconnect / death)
     *
     * @returns {boolean} true if phase is completed after removal
     */
    remove(roomCode, phase, playerId) {
        const key = `${roomCode}:${phase}`;
        const state = this.map.get(key);
        if (!state) return false;

        state.acted.delete(playerId);
        state.expected = Math.max(0, state.expected - 1);

        return state.acted.size >= state.expected;
    }

    /**
     * Clear phase state
     */
    clear(roomCode, phase) {
        this.map.delete(`${roomCode}:${phase}`);
    }
}

module.exports = new PhaseBarrierManager();
