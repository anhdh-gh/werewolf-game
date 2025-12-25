const { ROLES } = require('../constants/roles.constant')

const PHASE = {
    LOBBY: {
        key: 'LOBBY',
        message: 'Cả làng sẵn sàng đê'
    },

    ALL_VIEW_ROLE: {
        key: 'ALL_VIEW_ROLE',
        time: 3, // TODO: Change
        message: 'Cả làng xem chức năng của mình đê',
    },

    NIGHT_ALL_SLEEP: {
        key: 'NIGHT_ALL_SLEEP',
        message: 'Cả làng đi ngủ'
    },

    NIGHT_SEER: {
        key: 'NIGHT_SEER',
        message: 'Tiên tri thức dậy, đêm nay tiên tri bạn muốn soi ai?'
    },

    NIGHT_GUARD: {
        key: 'NIGHT_GUARD',
        message: 'Bảo vệ thức dậy, đêm nay bảo vệ muốn bảo vệ ai?'
    },

    NIGHT_SILENCED: {
        key: 'NIGHT_SILENCED',
        message: 'Bị câm thức dậy, đêm nay bị câm muốn cho ai câm?'
    },

    NIGHT_WOLF: {
        key: 'NIGHT_WOLF',
        message: 'Sói thức dậy, đêm nay sói muốn cắn ai?'
    },

    NIGHT_WITCH_SAVE: {
        key: 'NIGHT_WITCH_SAVE',
        message: 'Phù thủy thức dậy, đêm nay người này bị chết, phù thủy có muốn cứu không?'
    },

    NIGHT_WITCH_KILL: {
        key: 'NIGHT_WITCH_KILL',
        message: 'Phù thủy có muốn giết ai không?'
    },

    NIGHT_CURSED: {
        key: 'NIGHT_CURSED',
        message: 'Bị nguyền thức dậy, chức năng của bị nguyền là:'
    },

    DAY_DISCUSSION: {
        key: 'DAY_DISCUSSION',
        message: 'Cả làng thức dậy',
        time: 10, // TODO: Change
    },

    END: {
        key: 'END',
        message: 'Kết thúc phe thắng cuộc là: ',
        time: 3, // TODO: Change
    },
};

// TODO: Change
const PHASE_FLOW = [
    {
        phase: PHASE.ALL_VIEW_ROLE,
        next: PHASE.NIGHT_ALL_SLEEP,
        time: 3
    },
    {
        phase: PHASE.NIGHT_ALL_SLEEP,
        next: PHASE.NIGHT_SEER,
        time: 3,
        role: ROLES.SEER
    },
    {
        phase: PHASE.NIGHT_SEER,
        next: PHASE.NIGHT_GUARD,
        time: 3,
        role: ROLES.BODYGUARD
    },
    {
        phase: PHASE.NIGHT_GUARD,
        next: PHASE.NIGHT_SILENCED,
        time: 3,
        role: ROLES.SILENCED
    },
    {
        phase: PHASE.NIGHT_SILENCED,
        next: PHASE.NIGHT_WOLF,
        time: 3,
        role: ROLES.WEREWOLF
    },
    {
        phase: PHASE.NIGHT_WOLF,
        next: PHASE.NIGHT_WITCH_SAVE,
        time: 3,
        role: ROLES.WITCH
    },
    {
        phase: PHASE.NIGHT_WITCH_SAVE,
        next: PHASE.NIGHT_WITCH_KILL,
        time: 3,
        role: ROLES.WITCH
    },
    {
        phase: PHASE.NIGHT_WITCH_KILL,
        next: PHASE.NIGHT_CURSED,
        time: 3,
        role: ROLES.CURSED
    },
    {
        phase: PHASE.NIGHT_CURSED,
        next: PHASE.DAY_DISCUSSION,
        time: 3
    },
    {
        phase: PHASE.END,
        next: PHASE.LOBBY,
        time: 3
    }
]

module.exports = {
    PHASE,
    PHASE_FLOW
};