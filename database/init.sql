DROP TABLE IF EXISTS games;
CREATE TABLE games
(
    # User
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50) UNIQUE NOT NULL,
    email         VARCHAR(50) UNIQUE NOT NULL,
    password      VARCHAR(255)       NOT NULL,
    refresh_token TEXT,

    # Game
        room_code  VARCHAR(50) UNIQUE,
    socket_id  VARCHAR(30),
    role       VARCHAR(30),
    is_dead    BOOLEAN,
    vote_count INT,
    guard_user_id BIGINT,
    is_heal_used BOOLEAN,
    is_kill_used BOOLEAN
);