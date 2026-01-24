const mysql = require("mysql2/promise");

function parseBool(v, defaultValue = false) {
    if (v === undefined || v === null || v === "") return defaultValue;
    return ["1", "true", "yes", "on"].includes(String(v).toLowerCase());
}

const useSSL = parseBool(process.env.DB_SSL, false);
const rejectUnauthorized = parseBool(process.env.DB_SSL_REJECT_UNAUTHORIZED, true);

const poolOptions = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    supportBigNumbers: true,
    bigNumberStrings: true,
    namedPlaceholders: true,
};

// ✅ chỉ bật TLS khi env yêu cầu
if (useSSL) {
    poolOptions.ssl = { rejectUnauthorized };
}

const pool = mysql.createPool(poolOptions);
module.exports = pool;
