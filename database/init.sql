DROP TABLE IF EXISTS games;
CREATE TABLE games
(
    # User
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    username       VARCHAR(50) UNIQUE NOT NULL,
    email          VARCHAR(50) UNIQUE NOT NULL,
    password       VARCHAR(255)       NOT NULL,
    refresh_token  TEXT,

    #              Game
    room_code      VARCHAR(10),
    role           VARCHAR(30),
    status         VARCHAR(50),
    votes_received INT,
    witch_heal      INT,
    witch_poison      INT,
    previous_role           VARCHAR(30),
    is_host boolean
);