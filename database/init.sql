drop table if exists users;
CREATE TABLE users
(
    username      VARCHAR(50) UNIQUE NOT NULL PRIMARY KEY,
    email         VARCHAR(50) UNIQUE NOT NULL,
    password      VARCHAR(255)       NOT NULL,
    refresh_token TEXT
);