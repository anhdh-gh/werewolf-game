-- Tạo database nếu chưa có
CREATE DATABASE IF NOT EXISTS werewolf_game
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Chọn database
USE werewolf_game;


DROP TABLE IF EXISTS users;
CREATE TABLE users
(
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50) UNIQUE,
    email         VARCHAR(50) UNIQUE,
    password      VARCHAR(255),
    refresh_token TEXT
);

DROP TABLE IF EXISTS rooms;
CREATE TABLE rooms
(
    code             VARCHAR(10) PRIMARY KEY,
    status           ENUM ('WAITING','PLAYING','ENDED') NOT NULL,
    current_phase    ENUM (
        'LOBBY',
        'ALL_VIEW_ROLE',
        'NIGHT_ALL_SLEEP',
        'NIGHT_SEER',
        'NIGHT_GUARD',
        'NIGHT_SILENCED',
        'NIGHT_WOLF',
        'NIGHT_WITCH_SAVE',
        'NIGHT_WITCH_KILL',
        'NIGHT_CURSED',
        'DAY_DISCUSSION',
        'END'
        )                                               NOT NULL,
    max_players INT UNSIGNED NOT NULL,
    phase_expires_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    room_voice_id VARCHAR(255) NULL
);

# Cleanup DELETE FROM players WHERE room_code = :room
DROP TABLE IF EXISTS players;
CREATE TABLE players
(
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    player_id           INT UNSIGNED      NOT NULL,
    username      VARCHAR(50),
    room_code           VARCHAR(10) NOT NULL,
    role                VARCHAR(30),
    initial_role        VARCHAR(30),
    is_alive            BOOLEAN DEFAULT FALSE,
    is_ready            BOOLEAN DEFAULT FALSE,
    is_muted            BOOLEAN DEFAULT FALSE,
    is_connected        BOOLEAN DEFAULT FALSE,
    is_protected        BOOLEAN DEFAULT FALSE,
    witch_heal          INT UNSIGNED DEFAULT 1,
    witch_poison        INT UNSIGNED DEFAULT 1,
    room_voice_token    TEXT NULL,
    UNIQUE (player_id, room_code)
);

# Cleanup Vote chỉ tồn tại trong 1 phase => Resolve xong → clear luôn
DROP TABLE IF EXISTS votes;
CREATE TABLE votes
(
    id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_code VARCHAR(10),
    phase     VARCHAR(30),
    voter_id  INT UNSIGNED,
    target_id INT UNSIGNED,
    target_username      VARCHAR(50),
    UNIQUE (room_code, phase, voter_id)
);

# Cleanup DELETE FROM actions WHERE room_code = :room;
# Action client gửi lên => Idempotence
DROP TABLE IF EXISTS actions;
CREATE TABLE actions
(
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_code   VARCHAR(10),
    phase       VARCHAR(30),
    actor_id    INT UNSIGNED,
    event_code    VARCHAR(50),
    UNIQUE (room_code, phase, actor_id, event_code)
);