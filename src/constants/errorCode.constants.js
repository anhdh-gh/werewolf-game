module.exports = {
    SUCCESS: {
        code: 200,
        message: 'Success'
    },

    INVALID_REQUEST: {
        code: 4001,
        message: 'Invalid request'
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

    // 5xxx – System errors
    INTERNAL_ERROR: {
        code: 5000,
        message: 'Internal server error'
    }
};
