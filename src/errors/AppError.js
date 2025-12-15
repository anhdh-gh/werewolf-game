class AppError extends Error {
    constructor(errorCode, customMessage) {
        super(customMessage || errorCode.message);
        this.code = errorCode.code;
        this.status = Math.floor(errorCode.code / 10);
    }
}

module.exports = AppError;
