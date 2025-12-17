DROP TABLE IF EXISTS users;
CREATE TABLE users
(
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50) UNIQUE NOT NULL,
    email         VARCHAR(50) UNIQUE NOT NULL,
    password      VARCHAR(255)       NOT NULL,
    refresh_token TEXT
);

DROP TABLE IF EXISTS rooms;
CREATE TABLE rooms
(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL unique,
    code VARCHAR(50) UNIQUE NOT NULL,
    prev_guard_user_id BIGINT NULL,
    is_witch_heal_used BOOLEAN,
    is_witch_kill_used BOOLEAN
);

DROP TABLE IF EXISTS user_room;
CREATE TABLE user_room
(
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_id    BIGINT      NOT NULL,
    user_id    BIGINT      NOT NULL,
    role       VARCHAR(30) NOT NULL,
    pre_role   VARCHAR(30) NOT NULL,
    is_owner   BOOLEAN     NOT NULL,
    is_dead    BOOLEAN     NOT NULL,
    vote_count INT         NOT NULL DEFAULT 0,
    UNIQUE (room_id, user_id)
);