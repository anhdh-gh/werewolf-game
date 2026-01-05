module.exports = {
    SUCCESS: {
        code: 200,
        message: 'Success'
    },

    INVALID_REQUEST: {
        code: 4001,
        message: 'Invalid request'
    },

    EMAIL_ALREADY_EXISTS: {
        code: 4002,
        message: 'Email already exists'
    },

    USERNAME_ALREADY_EXISTS: {
        code: 4003,
        message: 'Username already exists'
    },

    LOCK_TIMEOUT: {
        code: 4004,
        message: 'Lock timeout'
    },

    ALREADY_CONNECTED: {
        code: 4005,
        message: 'You are already connected from another session'
    },

    ROOM_PLAYING: {
        code: 4006,
        message: 'Room is playing'
    },

    PHASE_IS_INVALID: {
        code: 4007,
        message: 'Phase is invalid'
    },

    TARGET_ID_IS_INVALID: {
        code: 4008,
        message: 'Target id is invalid'
    },

    PLAYER_IS_INVALID: {
        code: 4009,
        message: 'Player is invalid'
    },

    ROOM_IS_FULL: {
        code: 4010,
        message: 'Room is full'
    },

    UNAUTHORIZED: {
        code: 4011,
        message: 'Unauthorized'
    },

    FORBIDDEN: {
        code: 4031,
        message: 'Forbidden'
    },

    NOT_FOUND: {
        code: 4041,
        message: 'Resource not found'
    },

    ROOM_NOT_FOUND: {
        code: 4042,
        message: 'Room not found'
    },

    PLAYER_NOT_FOUND: {
        code: 4043,
        message: 'Player not found'
    },

    // 5xxx – System errors
    INTERNAL_ERROR: {
        code: 5000,
        message: 'Internal server error. Try again'
    }
};
