const TEAMS = {
    VILLAGE: 'VILLAGE',       // Dân làng
    WEREWOLF: 'WEREWOLF',     // Phe sói
    THIRD_PARTY: 'THIRD_PARTY' // Bên thứ 3
};

const ROLES = {
    ALL: {
        key: 'ALL',
        label: 'Cả làng',
    },

    WEREWOLF: {
        key: 'WEREWOLF',
        team: TEAMS.WEREWOLF,
        label: 'Sói',
    },

    BODYGUARD: {
        key: 'BODYGUARD',
        team: TEAMS.VILLAGE,
        label: 'Bảo vệ',
    },

    WITCH: {
        key: 'WITCH',
        team: TEAMS.VILLAGE,
        label: 'Phù thủy',
    },

    SEER: {
        key: 'SEER',
        team: TEAMS.VILLAGE,
        label: 'Tiên tri',
    },

    VILLAGER: {
        key: 'VILLAGER',
        team: TEAMS.VILLAGE,
        label: 'Dân làng',
    },

    CURSED: {
        key: 'CURSED',
        team: TEAMS.VILLAGE,
        label: 'Bị nguyền',
    },

    SILENCED: {
        key: 'SILENCED',
        team: TEAMS.VILLAGE,
        label: 'Bị câm',
    },

    TANNER: {
        key: 'TANNER',
        team: TEAMS.THIRD_PARTY,
        label: 'Chán đời'
    }
};

module.exports = {
    ROLES,
    TEAMS
};
