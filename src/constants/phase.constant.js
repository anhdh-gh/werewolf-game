const PHASE = {
    LOBBY: {
        key: 'LOBBY',
    },

    ALL_VIEW_ROLE: {
        key: 'ALL_VIEW_ROLE',
        time: 10
    },

    NIGHT_ALL_SLEEP: {
        key: 'NIGHT_ALL_SLEEP',
        message: 'Cả làng đi ngủ',
        time: 5
    },

    NIGHT_SEER: {
        key: 'NIGHT_SEER',
        message: 'Tiên tri thức dậy, đêm nay tiên tri bạn muốn soi ai?',
        time_alive: 30,
        time: 10 // DIE
    },

    NIGHT_GUARD: {
        key: 'NIGHT_GUARD',
        message: 'Bảo vệ thức dậy, đêm nay bảo vệ muốn bảo vệ ai?',
        time_alive: 30,
        time: 10 // DIE
    },

    NIGHT_SILENCED: {
        key: 'NIGHT_SILENCED',
        message: 'Bị câm thức dậy, đêm nay bị câm muốn cho ai câm?',
        time_alive: 30,
        time: 10 // DIE
    },

    NIGHT_WOLF: {
        key: 'NIGHT_WOLF',
        message: 'Sói thức dậy, đêm nay sói muốn cắn ai?',
        time_alive: 30,
        time: 10 // DIE
    },

    NIGHT_WITCH_SAVE: {
        key: 'NIGHT_WITCH_SAVE',
        message: 'Phù thủy thức dậy, đêm nay người này bị chết, phù thủy có muốn cứu không?',
        time_alive: 30,
        time: 10 // DIE
    },

    NIGHT_WITCH_KILL: {
        key: 'NIGHT_WITCH_KILL',
        message: 'Phù thủy có muốn giết ai không?',
        time_alive: 30,
        time: 10 // DIE
    },

    NIGHT_CURSED: {
        key: 'NIGHT_CURSED',
        message: 'Bị nguyền thức dậy, chức năng của bị nguyền là:',
        time_alive: 30,
        time: 10 // DIE
    },

    DAY_DISCUSSION: {
        key: 'DAY_DISCUSSION',
        message: 'Cả làng thức dậy, đêm qua',
        time: 1800000 // 30 mins
    },

    END: {
        key: 'END',
        message: 'Kết thúc phe thắng cuộc là:',
        time: 10
    },
};

const PHASE_FLOW = {
    LOBBY: {
        next: PHASE.ALL_VIEW_ROLE,
    },

    ALL_VIEW_ROLE: {
        next: PHASE.NIGHT_ALL_SLEEP,
    },

    NIGHT_ALL_SLEEP: {
        next: PHASE.NIGHT_SEER,
    },

    NIGHT_SEER: {
        next: PHASE.NIGHT_GUARD,
    },

    NIGHT_GUARD: {
        next: PHASE.NIGHT_SILENCED,
    },

    NIGHT_SILENCED: {
        next: PHASE.NIGHT_WOLF,
    },

    NIGHT_WOLF: {
        next: PHASE.NIGHT_WITCH_SAVE,
    },

    NIGHT_WITCH_SAVE: {
        next: PHASE.NIGHT_WITCH_KILL,
    },

    NIGHT_WITCH_KILL: {
        next: PHASE.NIGHT_CURSED,
    },

    NIGHT_CURSED: {
        next: PHASE.DAY_DISCUSSION,
    },

    DAY_DISCUSSION: {
        next: PHASE.END,
    },

    END: {
        next: PHASE.LOBBY,
    },
};

module.exports = {
    PHASE,
    PHASE_FLOW
};