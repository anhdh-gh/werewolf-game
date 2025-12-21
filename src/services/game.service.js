const AppError = require('../errors/AppError');
const RoomRepository = require('../repositories/room.repository');
const ERROR_CODES = require('../constants/errorCode.constants');
const ArrayUtil = require('../utils/array.util')
const { ROLES } = require('../constants/roles.constant')
const { STATUS } = require('../constants/status.constant')

const GameService = {

    async connectRoom(user, roomCode, socketId) {
        //
        await RoomRepository.updateRoom([{
            id: user.id,
            room_code: roomCode,
            socket_id: socketId,
            role: null,
            status: STATUS.JOINED,
            votes_received: null,
            meta_data: null
        }]);

        //
        return await GameService.getByCode(roomCode);
    },

    async getByCode(code) {
        return await RoomRepository.getByCode(code)
    },

    async leaveRoom(userId) {
        //
        await RoomRepository.updateRoom([{
            id: userId,
            room_code: null,
            socket_id: null,
            role: null,
            status: null,
            votes_received: null,
            meta_data: null
        }]);

        //
        return userId;
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
            player.meta_data = {}
            player.status = STATUS.ALIVE
            player.votes_received = 0

            // Reset status và init role_data
            if(assignedRole === ROLES.WITCH) player.meta_data = { heal: 1, poison: 1 };

            //
            return players
        });
        await Promise.all(updatePromises);

        // Update DB
        await RoomRepository.updateRoom(players)

        //
        return players;
    },

    async beginGameFlow(userId, roomCode) {
        return {
            current: {
                message: "Cả làng đi ngủ"
            },
            next: {
                data: {
                    message: "Bảo vệ thức dậy, đêm nay bạn muốn bảo vệ ai"
                },
                after: 5000
            }
        }
    }
};

module.exports = GameService;
