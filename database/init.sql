DROP TABLE IF EXISTS users;
CREATE TABLE users
(
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50) UNIQUE,
    email         VARCHAR(50) UNIQUE,
    password      VARCHAR(255),
    refresh_token TEXT
);

# Cleanup ended_at < NOW() - INTERVAL 1 DAY and status = 'ENDED'
DROP TABLE IF EXISTS rooms;
CREATE TABLE rooms
(
    code             VARCHAR(10) PRIMARY KEY,
    status           ENUM ('WAITING','PLAYING','ENDED') NOT NULL,
    current_day      INT                                NOT NULL DEFAULT 0,
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
    max_players INT NOT NULL,
    phase_expires_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at   DATETIME NULL
);

# Cleanup DELETE FROM players WHERE room_code = :room
DROP TABLE IF EXISTS players;
CREATE TABLE players
(
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    player_id           BIGINT      NOT NULL,
    room_code           VARCHAR(10) NOT NULL,
    role                VARCHAR(30),
    initial_role        VARCHAR(30),
    is_alive            BOOLEAN DEFAULT FALSE,
    is_ready            BOOLEAN DEFAULT FALSE,
    is_muted            BOOLEAN DEFAULT FALSE,
    is_connected        BOOLEAN DEFAULT FALSE,
    witch_heal          INT DEFAULT 1,
    witch_poison        INT DEFAULT 1,
    protected_until_day INT,
    UNIQUE (player_id, room_code)
);

# Cleanup DELETE FROM actions WHERE room_code = :room;
# Action client gửi lên => Idempotence
DROP TABLE IF EXISTS actions;
CREATE TABLE actions
(
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_code   VARCHAR(10),
    current_day INT,
    phase       VARCHAR(30),
    actor_id    BIGINT,
    target_id   BIGINT,
    event_id    VARCHAR(50) UNIQUE
);

# Cleanup Vote chỉ tồn tại trong 1 phase => Resolve xong → clear luôn
DROP TABLE IF EXISTS votes;
CREATE TABLE votes
(
    id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_code VARCHAR(10),
    phase     VARCHAR(30),
    voter_id  BIGINT,
    target_id BIGINT,
    UNIQUE (room_code, phase, voter_id)
);