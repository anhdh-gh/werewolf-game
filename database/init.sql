drop table if exists users;
CREATE TABLE users
(
    id            BIGINT PRIMARY KEY AUTO_INCREMENT,
    email         VARCHAR(50) UNIQUE NOT NULL,
    username      VARCHAR(50) UNIQUE NOT NULL,
    password      VARCHAR(255)       NOT NULL,
    refresh_token TEXT
);