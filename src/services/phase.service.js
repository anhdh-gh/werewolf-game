const AppError = require('../errors/AppError');
const RoomRepository = require('../repositories/room.repository');
const PlayerRepository = require('../repositories/player.repository');
const VoteRepository = require('../repositories/vote.repository');
const ERROR_CODES = require('../constants/errorCode.constants');
const ArrayUtil = require('../utils/array.util')
const { ROLES } = require('../constants/roles.constant')
const { STATUS } = require('../constants/status.constant')
const { PHASE, PHASE_FLOW } = require('../constants/phase.constant')
const { ACTIONS } = require('../constants/action.constant')
const RoomService = require('../services/room.service')

const PHASE_TIMEOUT = 300000;
const EMIT_DELAY = 5000;
const EMIT_DELAY_PER_PHASE = 3000;

const PhaseService = {

    async allViewRole(roomCode) {
        return await RoomService.runWithTimeout(
            await RoomService.getRoomLock(roomCode),
            async () => {
                //
                const players = await PlayerRepository.getPlayers(roomCode)
                if(!players || players?.length < 4) {
                    throw new AppError(ERROR_CODES.INVALID_REQUEST, "Players must be > 3")
                }

                // A. Các role cố định ban đầu (3 role)
                let rolePool = [];
                rolePool.push(ROLES.WITCH);
                rolePool.push(ROLES.SEER);
                rolePool.push(ROLES.VILLAGER); // 1 Dân bắt buộc

                // B. Tính số lượng Sói: ((n-1)/4) + 1
                // Lưu ý: JS chia số sẽ ra số thực, cần Math.floor để lấy phần nguyên
                const wolfCount = Math.floor((players.length - 1) / 4) + 1;
                for (let i = 0; i < wolfCount; i++) {
                    rolePool.push(ROLES.WEREWOLF);
                }

                // C. Các role ưu tiên thêm vào nếu còn chỗ
                // Thứ tự ưu tiên: Bảo vệ -> Bị nguyền -> Bị câm -> Chán đời
                const priorityRoles = [ROLES.BODYGUARD, ROLES.CURSED, ROLES.SILENCED, ROLES.TANNER];

                // Tính số slot còn trống
                let currentCount = rolePool.length;

                // Duyệt qua các role ưu tiên, nếu còn chỗ thì nhét vào
                for (const role of priorityRoles) {
                    if (currentCount < players.length) {
                        rolePool.push(role);
                        currentCount++;
                    }
                }

                // D. Nếu vẫn còn người -> Tất cả là Dân làng
                while (currentCount < players.length) {
                    rolePool.push(ROLES.VILLAGER);
                    currentCount++;
                }

                // 3. XÁO TRỘN VÀ GÁN ROLE
                // Xáo trộn danh sách role
                const shuffledRoles = ArrayUtil.shuffleArray(rolePool);

                // Gán role vào object player và chuẩn bị dữ liệu update DB
                const updatePromises = players.map((player, index) => {
                    const assignedRole = shuffledRoles[index];

                    // Gán vào object hiện tại để trả về client ngay
                    player.role = assignedRole.key;
                    player.initial_role = assignedRole.key;
                    player.is_alive = true
                    player.witch_heal = 1
                    player.witch_poison = 1

                    //
                    return players
                });
                await Promise.all(updatePromises);
                await PlayerRepository.updatePlayers(players)

                // Change phrase
                await RoomRepository.updateRooms([
                    {
                        code: roomCode,
                        status: STATUS.PLAYING,
                        current_phase: PHASE.ALL_VIEW_ROLE.key,
                        phase_expires_at: await RoomRepository.raw('TIMESTAMPADD(SECOND, ?, NOW())', [PHASE.ALL_VIEW_ROLE.time])
                    }
                ])

                //
                return players;
            },
            PHASE_TIMEOUT
        );
    },

    async getNextPhase(room, emit) {
        //
        if(!room || !room?.code || !room?.current_phase) {
            return;
        }

        //
        const roles = await PlayerRepository.getRoles(room.code)
        if(!roles || roles?.length < 1) {
            RoomRepository.clearData(room.code)
            return;
        }

        //
        return await RoomService.runWithTimeout(
            await RoomService.getRoomLock(room.code),
            async () => {
                // Check phase
                const roomCurrent = await RoomRepository.getByCode(room.code);
                if(roomCurrent?.current_phase !== room.current_phase) {
                    return true;
                }
                let currentPhaseTempt = roomCurrent.current_phase

                // Current handle
                let curPhase = PHASE_FLOW.filter(p => p.next.key === currentPhaseTempt)?.[0];

                // Next handle
                let nextPhase;
                let data = {}
                let isRoleAlive
                for(const pi in PHASE_FLOW) {
                    //
                    nextPhase = PHASE_FLOW.filter(p => p.phase.key === currentPhaseTempt)?.[0];
                    if (!nextPhase) {
                        RoomRepository.clearData(room.code)
                        return;
                    }
                    data.phase = nextPhase.next.key;
                    data.message = nextPhase.next.message;
                    data.time = nextPhase.time;
                    data.event = {
                        role: nextPhase?.role?.key || ROLES.ALL.key,
                        action: nextPhase.next.key.includes(ACTIONS.SLEEP) ? ACTIONS.SLEEP : ACTIONS.WAKEUP
                    }

                    //
                    if(!nextPhase?.role) {
                        break;
                    }

                    //
                    if(roles.filter(r => r.initial_role === nextPhase.role.key).length < 1) {
                        currentPhaseTempt = data.phase
                        continue;
                    }

                    //
                    isRoleAlive = await PlayerRepository.isRoleAlive(room.code, [nextPhase?.role.key]);
                    if(!isRoleAlive) {
                        data.time = 15 // TODO: Change
                    } else {
                        if(PHASE.NIGHT_WITCH_SAVE.key === data.phase) {
                            data.data = { players: await PhaseService.getVoteMax(room.code, PHASE.NIGHT_WOLF.key) }
                        }
                    }
                    break;
                }

                //
                if(!data || !data?.phase) {
                    RoomRepository.clearData(room.code)
                    return;
                }

                // Next phase
                await RoomRepository.updateRooms([
                    {
                        code: room.code,
                        status: STATUS.PLAYING,
                        current_phase: data?.phase,
                        phase_expires_at: await RoomRepository.raw('TIMESTAMPADD(SECOND, ?, NOW())', [data?.time])
                    }
                ])

                //
                if(curPhase && curPhase?.role && curPhase?.role.key !== data.event.role) {
                    emit({
                        phase: curPhase.next.key,
                        message: `${curPhase.role.label} ${PHASE.DAY_DISCUSSION.key === curPhase.phase.key ? 'thức dậy' : 'đi ngủ'}`,
                        event: {
                            role: curPhase.role.key,
                            action: PHASE.DAY_DISCUSSION.key === curPhase.phase.key
                                ? ACTIONS.WAKEUP
                                : curPhase.phase.key.includes(ACTIONS.SLEEP) ? ACTIONS.SLEEP : ACTIONS.WAKEUP
                                    ? ACTIONS.SLEEP : ACTIONS.WAKEUP
                        }
                    })
                    setTimeout(() => emit(data), EMIT_DELAY_PER_PHASE)
                } else {
                    emit(data)
                }

                // Complete phase
                if(data?.event.role === ROLES.ALL.key && data?.event?.action === ACTIONS.WAKEUP) {
                    // Process vote
                    await PhaseService.processPhaseDay(room.code, roles, emit)

                    // Check end
                    if(await PhaseService.checkEnd(room.code, roles, emit)) {
                        return true;
                    }
                }

                return true
            },
            PHASE_TIMEOUT
        );
    },

    async checkEnd(roomCode, roles, emit) {
        // WEREWOLF
        let numWolf = await PlayerRepository.countRoleAlive(roomCode, ROLES.WEREWOLF.key)
        if(numWolf < 1) {
            return await PhaseService.handleEnd(roomCode, emit, ROLES.VILLAGER.label)
        }
        let numVillager = await PlayerRepository.countRoleRemainAlive(roomCode, [ROLES.WEREWOLF.key, ROLES.TANNER.key])
        if(numWolf >= numVillager) {
            return await PhaseService.handleEnd(roomCode, emit, ROLES.WEREWOLF.label)
        }

        // TANNER
        if(roles.filter(r => r.initial_role === ROLES.TANNER.key).length >= 1
            && !await PlayerRepository.isRoleAlive(roomCode, [ROLES.TANNER.key])) {
            return await PhaseService.handleEnd(roomCode, emit, ROLES.TANNER.label)
        }

        //
        return false
    },

    async handleEnd(roomCode, emit, roleWin) {
        //
        if(!roleWin) {
            return false;
        }
        await RoomRepository.updateRooms([
            {
                code: roomCode,
                status: STATUS.WAITING,
                current_phase: PHASE.LOBBY.key,
                phase_expires_at: null
            }
        ]);

        // Reset players
        await PlayerRepository.resetGame(roomCode)

        //
        setTimeout(() => {
            emit({
                phase: PHASE.END.key,
                message: PHASE.END.message + roleWin,
                event: {
                    role: ROLES.ALL.key,
                    action: ACTIONS.VIEW
                }
            })
        }, EMIT_DELAY)

        return true
    },

    async getMajorityTarget(votes = []) {
        if (!votes.length) return null;

        const counter = new Map();

        for (const v of votes) {
            counter.set(
                v.target_id,
                (counter.get(v.target_id) || 0) + 1
            );
        }

        let max = 0;
        let targetId = null;

        for (const [id, count] of counter.entries()) {
            if (count > max) {
                max = count;
                targetId = id;
            }
        }

        return targetId;
    },

    async resolveNightResult({ wolfTargetId, protectedId, healedId, poisonedId }) {
        const dead = new Set();
        if (wolfTargetId) dead.add(wolfTargetId);
        if (protectedId) dead.delete(protectedId);
        if (healedId) dead.delete(healedId);
        if (poisonedId) dead.add(poisonedId);

        return [...dead];
    },

    async buildPlayerInfoMap(votes = []) {
        const map = {};

        for (const v of votes) {
            if (!map[v.target_id]) {
                map[v.target_id] = {
                    player_id: v.target_id,
                    username: v.target_username
                };
            }
        }

        return map;
    },

    async getVoteMax(roomCode, phase) {
        // 1. Lấy vote của sói (CHỈ phase này)
        const votes = await VoteRepository.findByRoomAndPhase(roomCode, phase);

        if (!votes || votes.length === 0) {
            return [];
        }

        // 2. Tính target bị vote nhiều nhất
        const targetId = await PhaseService.getMajorityTarget(votes);
        if (!targetId) {
            return [];
        }

        // 3. Build map player_id -> username
        const playerInfoMap = await PhaseService.buildPlayerInfoMap(votes);

        // 4. Trả về players[]
        return [{...playerInfoMap[targetId]}];
    },

    async splitDeadPlayers(roomCode, allRoles, deadIds) {
        //
        if(!allRoles.some(r => r.initial_role === ROLES.CURSED.key)) {
            return { cursedTurnWolfIds: [], realDeadIds: deadIds }
        }

        //
        const roles = await PlayerRepository.getCurRole(roomCode, deadIds);

        const cursedTurnWolfIds = [];
        const realDeadIds = [];

        for (const id of deadIds) {
            const role = roles.find(r => r.player_id === id);

            if (role?.role === ROLES.CURSED.key) {
                cursedTurnWolfIds.push(id);
            } else {
                realDeadIds.push(id);
            }
        }

        return { cursedTurnWolfIds, realDeadIds };
    },

    async processPhaseDay(roomCode, roles, emit) {
        const phases = PHASE_FLOW
            .filter(p => p?.role?.key && p?.next?.key && roles.some(r => r.initial_role === p.role.key))
            .map(p => p.next.key);

        const votes = await VoteRepository.findByRoomAndPhases(roomCode, phases);

        if (!votes.length) {
            setTimeout(() => {
                emit({
                    phase: PHASE.DAY_DISCUSSION.key,
                    message: "Đêm qua không có ai chết",
                    event: { role: ROLES.ALL.key, action: ACTIONS.VOTE }
                });
            }, EMIT_DELAY)
            await VoteRepository.clearVotes(roomCode);
            return;
        }

        const voteMap = votes.reduce((acc, v) => {
            (acc[v.phase] ||= []).push(v);
            return acc;
        }, {});

        const playerInfoMap = await PhaseService.buildPlayerInfoMap(votes);

        const wolfTargetId = await PhaseService.getMajorityTarget(
            voteMap[PHASE.NIGHT_WOLF.key] || []
        );

        const protectedId = voteMap[PHASE.NIGHT_GUARD.key]?.[0]?.target_id || null;
        const healedId    = voteMap[PHASE.NIGHT_WITCH_SAVE.key]?.[0]?.target_id || null;
        const poisonedId  = voteMap[PHASE.NIGHT_WITCH_KILL.key]?.[0]?.target_id || null;
        const mutedId     = voteMap[PHASE.NIGHT_SILENCED.key]?.[0]?.target_id || null;

        const deadIds = await PhaseService.resolveNightResult({
            wolfTargetId,
            protectedId,
            healedId,
            poisonedId
        });

        // CURSED logic
        const { cursedTurnWolfIds, realDeadIds } = await PhaseService.splitDeadPlayers(roomCode, roles, deadIds);

        await VoteRepository.withTransaction(async (conn) => {
            await VoteRepository.resetNight(roomCode, conn);

            if (protectedId) await VoteRepository.setProtected(protectedId, roomCode, conn);
            if (mutedId) await VoteRepository.setMuted(mutedId, roomCode, conn);

            // CURSED → WEREWOLF (KHÔNG CHẾT)
            if (cursedTurnWolfIds.length) {
                await VoteRepository.changeRole(
                    cursedTurnWolfIds,
                    ROLES.WEREWOLF.key,
                    roomCode,
                    conn
                );
            }

            // Chết thật
            if (realDeadIds.length) {
                await VoteRepository.killPlayers(realDeadIds, roomCode, conn);
            }

            if (healedId) await VoteRepository.consumeHeal(roomCode, conn);
            if (poisonedId) await VoteRepository.consumePoison(roomCode, conn);
        });

        const players = [];
        const messages = [];

        if (realDeadIds.length) {
            messages.push(`có ${realDeadIds.length} người chết`);
            realDeadIds.forEach(id =>
                players.push({ ...playerInfoMap[id], is_alive: false })
            );
        }

        if (mutedId) {
            messages.push(`có 1 người bị câm`);
            players.push({ ...playerInfoMap[mutedId], is_muted: true });
        }

        setTimeout(() => {
            emit({
                phase: PHASE.DAY_DISCUSSION.key,
                message: messages.length
                    ? `Đêm qua ${messages.join(', ')}`
                    : "Đêm qua không có ai chết",
                event: { role: ROLES.ALL.key, action: ACTIONS.VOTE },
                data: players.length ? { players } : undefined
            });
        }, EMIT_DELAY)
        await VoteRepository.clearVotes(roomCode);
    },

    async decreasePhaseExpire(roomCode, seconds) {
        return RoomRepository.updateRooms([
            {
                code: roomCode,
                phase_expires_at: RoomRepository.raw(
                    `
                        IF(
                            phase_expires_at IS NULL,
                            NULL,
                            GREATEST(
                                TIMESTAMPADD(SECOND, -?, phase_expires_at),
                                TIMESTAMPADD(SECOND, 5, NOW())
                            )
                        )
                        `,
                    [seconds]
                )
            }
        ]);
    },
};

module.exports = PhaseService;
