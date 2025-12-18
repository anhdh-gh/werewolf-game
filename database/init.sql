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
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id            BIGINT             NOT NULL unique,
    code               VARCHAR(50) UNIQUE NOT NULL,
    prev_guard_user_id BIGINT,
    is_witch_heal_used BOOLEAN,
    is_witch_kill_used BOOLEAN
);

DROP TABLE IF EXISTS user_room;
CREATE TABLE user_room
(
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_code  BIGINT NOT NULL,
    user_id    BIGINT NOT NULL,
    role       VARCHAR(30),
    pre_role   VARCHAR(30),
    is_owner   BOOLEAN,
    is_dead    BOOLEAN,
    vote_count INT,
    UNIQUE (user_id, room_code)
);