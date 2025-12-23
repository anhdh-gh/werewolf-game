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

const GameService = {

    /**[ DISCONNECT ]* */
    async playerDisconnected(userId, cleaner) {
        //
        const rooms = await PlayerRepository.getRoom(userId);
        for (let room of rooms) {
            GameService.leaveRoom(userId, room?.room_code).then(() => cleaner(room?.room_code)).catch(err => console.log(err))
        }
    },

    /**[ CONNECT_ROOM ]* */
    async connectRoom(playerId, roomCode) {
        //
        const room = await RoomRepository.getByCode(roomCode)
        if(!room) {
            throw new AppError(ERROR_CODES.ROOM_NOT_FOUND)
        }

        //
        await PlayerRepository.connectRoom(playerId, roomCode)
    },

    /**[ LEAVE_ROOM ]* */
    async leaveRoom(playerId, roomCode) {
        const room = await RoomRepository.getByCode(roomCode)
        if(!room) {
            throw new AppError(ERROR_CODES.ROOM_NOT_FOUND)
        }

        //
        if(STATUS.PLAYING === room.status) {
            await PlayerRepository.playerDisconnected(playerId, roomCode)
            return;
        }

        //
        await PlayerRepository.leaveRoom(playerId, roomCode)

        //
        return roomCode
    },

    /**[ PLAYER_READY ]* */
    async playerReady(playerId, roomCode) {
        const room = await RoomRepository.getByCode(roomCode)
        if(!room) {
            throw new AppError(ERROR_CODES.ROOM_NOT_FOUND)
        }

        //
        if(STATUS.WAITING !== room.status || PHASE.LOBBY.key !== room.current_phase) {
            throw new AppError(ERROR_CODES.ROOM_PLAYING)
        }

        //
        await PlayerRepository.playerReady(playerId, roomCode);

        //
        return phaseBarrier.register(roomCode, PHASE.LOBBY.key, room.max_players, playerId)
    },

    async startGame(roomCode, handler) {
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
        handler(players)

        // TODO: Change phrase

        // Finally
        phaseBarrier.clear(roomCode, PHASE.LOBBY.key)
    }
};

module.exports = GameService;
