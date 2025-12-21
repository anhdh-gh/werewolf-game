const TEAMS = {
    VILLAGE: 'VILLAGE',       // Dân làng
    WEREWOLF: 'WEREWOLF',     // Phe sói
    THIRD_PARTY: 'THIRD_PARTY' // Bên thứ 3
};

const ROLES = {
    WEREWOLF: {
        key: 'WEREWOLF',
        team: TEAMS.WEREWOLF,
        label: 'Sói',
        message: "Sói thức dậy, đêm nay bạn muốn cắn ai?"
    },

    BODYGUARD: {
        key: 'BODYGUARD',
        team: TEAMS.VILLAGE,
        label: 'Bảo vệ',
        message: "Bảo vệ thức dậy, đêm nay bạn muốn bảo vệ ai?"
    },

    WITCH: {
        key: 'WITCH',
        team: TEAMS.VILLAGE,
        label: 'Phù thủy'
    },

    SEER: {
        key: 'SEER',
        team: TEAMS.VILLAGE,
        label: 'Tiên tri',
        message: "Tiên trì thức dậy, đêm nay bạn muốn tiên tri ai?"
    },

    VILLAGER: {
        key: 'VILLAGER',
        team: TEAMS.VILLAGE,
        label: 'Dân làng'
    },

    CURSED: {
        key: 'CURSED',
        team: TEAMS.VILLAGE,
        label: 'Bị nguyền',
        message: "Bị nguyền thức dậy, chức năng của bạn là:"
    },

    SILENCED: {
        key: 'SILENCED',
        team: TEAMS.VILLAGE,
        label: 'Bị câm',
        message: "Bị câm thức dậy, đêm nay bạn muốn cho ai câm?"
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
