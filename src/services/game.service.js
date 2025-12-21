const AppError = require('../errors/AppError');
const RoomRepository = require('../repositories/room.repository');
const ERROR_CODES = require('../constants/errorCode.constants');
const ArrayUtil = require('../utils/array.util')
const { ROLES } = require('../constants/roles.constant')
const { STATUS } = require('../constants/status.constant')
const EVENTS = require("../constants/events");

const GameService = {

    async connectRoom(user, roomCode) {
        //
        await RoomRepository.updateRoom([{
            id: user.id,
            room_code: roomCode,
            role: null,
            status: STATUS.JOINED,
            votes_received: null,
            witch_heal: null,
            witch_poison: null
        }]);

        //
        return await GameService.getByCode(roomCode);
    },

    async getByCode(code) {
        const players = await RoomRepository.getByCode(code)
        return GameService.checkHost(players);
    },

    async leaveRoom(userId, roomCode) {
        //
        await RoomRepository.updateRoom([{
            id: userId,
            room_code: null,
            role: null,
            status: null,
            votes_received: null,
            witch_heal: null,
            witch_poison: null
        }]);

        //
        if(roomCode) {
            return await GameService.getByCode(roomCode);
        }

        //
        return null;
    },

    async startNewGame(userId, roomCode) {
        // 1. Lấy danh sách người chơi
        const players = await GameService.getByCode(roomCode);

        // Validate số lượng
        const n = players.length;
        if (!players || n < 4) {
            throw new AppError(ERROR_CODES.INVALID_REQUEST, "Number of players must be > 3")
        }

        // 2. LOGIC TẠO POOL ROLE (Tạo danh sách thẻ bài)
        let rolePool = [];

        // A. Các role cố định ban đầu (3 role)
        rolePool.push(ROLES.WITCH);
        rolePool.push(ROLES.SEER);
        rolePool.push(ROLES.VILLAGER); // 1 Dân bắt buộc

        // B. Tính số lượng Sói: ((n-1)/4) + 1
        // Lưu ý: JS chia số sẽ ra số thực, cần Math.floor để lấy phần nguyên
        const wolfCount = Math.floor((n - 1) / 4) + 1;
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
            if (currentCount < n) {
                rolePool.push(role);
                currentCount++;
            }
        }

        // D. Nếu vẫn còn người -> Tất cả là Dân làng
        while (currentCount < n) {
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
            player.status = STATUS.ALIVE
            player.votes_received = 0

            // Reset status và init role_data
            if(assignedRole === ROLES.WITCH) {
                player.witch_heal = 1
                player.witch_poison = 1
            }
            if(assignedRole === ROLES.CURSED) {
                player.previous_role = player.role
            }

            //
            return players
        });
        await Promise.all(updatePromises);

        // Update DB
        await RoomRepository.updateRoom(players)

        //
        return players;
    },

    async beginSeer() {
        return await GameService.processRole({label: 'Cả làng'}, ROLES.SEER);
    },

    async doneSeer(roomCode) {
        // Bảo vệ
        let currentRole = await GameService.handleRole(roomCode, ROLES.SEER, ROLES.BODYGUARD);
        if(currentRole) {
            return await GameService.processRole(ROLES.SEER, ROLES.BODYGUARD);
        }

        // Next
        return await GameService.nextGuard(roomCode, ROLES.SEER);
    },

    async nextGuard(roomCode, previousRole = ROLES.BODYGUARD) {
        // Bị câm
        let currentRole = await GameService.handleRole(roomCode, previousRole, ROLES.SILENCED);
        if(currentRole) {
            return await GameService.processRole(previousRole, ROLES.SILENCED);
        }

        // Sói
        return await GameService.processRole(previousRole, ROLES.WEREWOLF);
    },

    async doneSilenced(roomCode, silencedUserId) {
        // Update DB
        await RoomRepository.updateStatus(silencedUserId, roomCode, STATUS.SILENCED)

        // Next Sói
        return await GameService.processRole(ROLES.SILENCED, ROLES.WEREWOLF);
    },

    async doneGuard(roomCode, guardUserId) {
        // Update DB
        if(!await RoomRepository.updateStatus(guardUserId, roomCode, STATUS.PROTECTED)) {
            throw new AppError(ERROR_CODES.INVALID_REQUEST, "Không được bảo vệ cùng một người hai đêm liên tiếp")
        }

        // Next
        return await GameService.nextGuard(roomCode);
    },

    async handleRole(roomCode, previousRole, currentRole) {
        const result = await RoomRepository.getByCode(roomCode, currentRole.key)
        if(!result || result.length < 1) {
            return null;
        }
        return GameService.processRole(previousRole, currentRole);
    },

    async processRole(previousRole, currentRole) {
        return {
            current: {
                message: `${previousRole.label} đi ngủ`
            },
            next: {
                data: {
                    active: currentRole.key,
                    message: currentRole.message
                },
                after: 3000
            }
        }
    },

    async checkHost(players) {
        if (!players || players.length < 1) return null;

        // Lọc ra các player đang là host
        const hosts = players.filter(p => p.is_host);

        // Nếu đã đúng 1 host → không làm gì, trả về players luôn
        if (hosts.length === 1) return players;

        // Nếu không có host hoặc nhiều host → reset và chọn host mới
        players.forEach(p => p.is_host = false);

        // Chọn phần tử đầu tiên làm host mới
        players[0].is_host = true;

        // Chỉ update những player đã thay đổi
        const toUpdate = players
            .filter(p => p.is_host || hosts.includes(p))
            .map(p => ({
                id: p.id,
                is_host: p.is_host
            }));
        await RoomRepository.updateRoom(toUpdate);


        // Trả về mảng players đã được chỉnh sửa
        return players;
    }
};

module.exports = GameService;
