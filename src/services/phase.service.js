const AppError = require('../errors/AppError');
const RoomRepository = require('../repositories/room.repository');
const PlayerRepository = require('../repositories/player.repository');
const ERROR_CODES = require('../constants/errorCode.constants');
const ArrayUtil = require('../utils/array.util')
const { ROLES } = require('../constants/roles.constant')
const { STATUS } = require('../constants/status.constant')
const { PHASE } = require('../constants/phase.constant')
const EVENTS = require('../constants/events');
const roomsCount = new Map()
const phaseBarrier = require('../model/PhaseBarrierManager')
const RoomService = require('../services/room.service')

const PhaseService = {

    async allViewRole(roomCode) {
        return await RoomService.runWithTimeout(
            await RoomService.getRoomLock(roomCode),
            async () => {
                //
                const players = await PlayerRepository.getPlayers(roomCode)

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
            300_000
        );
    }
};

module.exports = PhaseService;
