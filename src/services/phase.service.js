const AppError = require('../errors/AppError');
const RoomRepository = require('../repositories/room.repository');
const PlayerRepository = require('../repositories/player.repository');
const ERROR_CODES = require('../constants/errorCode.constants');
const ArrayUtil = require('../utils/array.util')
const { ROLES } = require('../constants/roles.constant')
const { STATUS } = require('../constants/status.constant')
const { PHASE, PHASE_FLOW } = require('../constants/phase.constant')
const { ACTIONS } = require('../constants/action.constant')
const RoomService = require('../services/room.service')

const PHASE_TIMEOUT = 300000;

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
                const curPhase = PHASE_FLOW.filter(p => p.next.key === currentPhaseTempt)?.[0];

                // Next handle
                let nextPhase;
                let data = {}
                let roleAlive
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
                        action: ACTIONS.WAKEUP
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
                    roleAlive = await PlayerRepository.getRoleAlive(room.code, nextPhase?.role.key);
                    if(!roleAlive) {
                        data.time = 2 // TODO: Change
                    }
                    break;
                }

                //
                if(!data || !data?.phase) {
                    RoomRepository.clearData(room.code)
                    return;
                }

                //
                if(curPhase && curPhase?.role && curPhase?.role.key !== data.event.role) {
                    emit({
                        message: `${curPhase.role.label} đi ngủ`,
                        event: {
                            role: curPhase.role.key,
                            action: ACTIONS.SLEEP
                        }
                    })
                }

                // Next phase
                await RoomRepository.updateRooms([
                    {
                        code: room.code,
                        status: STATUS.PLAYING,
                        current_phase: data?.phase,
                        current_day: await RoomRepository.raw(`current_day + ${data?.phase === PHASE.NIGHT_ALL_SLEEP ? 1 : 0}`),
                        phase_expires_at: await RoomRepository.raw('TIMESTAMPADD(SECOND, ?, NOW())', [data?.time])
                    }
                ])
                emit(data)
                return true
            },
            PHASE_TIMEOUT
        );
    }
};

module.exports = PhaseService;
