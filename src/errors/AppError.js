class AppError extends Error {
    constructor(errorCode, errors = null, customMessage) {
        super(customMessage || errorCode.message);
        this.code = errorCode.code;
        this.status = Math.floor(errorCode.code / 10);
        this.errors = errors;
    }
}

module.exports = AppError;
