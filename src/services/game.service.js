const AppError = require('../errors/AppError');
const RoomRepository = require('../repositories/room.repository');
const PlayerRepository = require('../repositories/player.repository');
const ERROR_CODES = require('../constants/errorCode.constants');
const { STATUS } = require('../constants/status.constant')
const { PHASE, PHASE_TIME_MAX } = require('../constants/phase.constant')
const PhaseService = require('../services/phase.service')
const RoomService = require("./room.service");
const ActionsRepository = require('../repositories/action.repository');
const EVENTS = require('../constants/events');
const VoteRepository = require("../repositories/vote.repository");
const {ROLES} = require("../constants/roles.constant");
const {ACTIONS} = require("../constants/action.constant");

const GameService = {

    /**[ DISCONNECT ]* */
    async playerDisconnected(userId, cleaner) {
        //
        const rooms = await PlayerRepository.getRoom(userId);

        //
        await Promise.all(
            rooms.map(room =>
                GameService.leaveRoom(userId, room?.room_code).then(() => cleaner(room?.room_code)).catch(err => console.log(err))
            )
        );
    },

    /**[ CONNECT_ROOM ]* */
    async connectRoom(player, roomCode) {
        //
        const room = await RoomRepository.getByCode(roomCode)
        if(!room) {
            throw new AppError(ERROR_CODES.ROOM_NOT_FOUND)
        }

        //
        if(STATUS.WAITING !== room.status || PHASE.LOBBY.key !== room.current_phase) {
            throw new AppError(ERROR_CODES.ROOM_PLAYING)
        }

        //
        await PlayerRepository.connectRoom(player, roomCode)
    },

    /**[ ROOM_INFO ]* */
    async roomInfo(player, roomCode) {
        //
        const room = await RoomRepository.getByCode(roomCode)
        if(!room) {
            throw new AppError(ERROR_CODES.ROOM_NOT_FOUND)
        }

        //
        return room;
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
    async playerReady(player, roomCode) {
        const room = await RoomRepository.getByCode(roomCode)
        if(!room) {
            throw new AppError(ERROR_CODES.ROOM_NOT_FOUND)
        }

        //
        if(STATUS.WAITING !== room.status || PHASE.LOBBY.key !== room.current_phase) {
            throw new AppError(ERROR_CODES.ROOM_PLAYING)
        }

        //
        await PlayerRepository.playerReady(player, roomCode);
    },

    /**[ PLAYER_INFO ]* */
    async playerInfo(playerIds, roomCode) {
        const room = await RoomRepository.getByCode(roomCode)
        if(!room) {
            throw new AppError(ERROR_CODES.ROOM_NOT_FOUND)
        }
        //
        return await GameService.getPlayerInfo(roomCode, playerIds);
    },

    /**[ PLAYER_DONE ]* */
    async playerDone(userId, roomCode, currentPhase, emit) {
        return RoomService.withRoomLock(roomCode, async () => {
            const player = await GameService.validateActions(
                userId,
                roomCode,
                currentPhase
            );

            //
            await ActionsRepository.upsertAction(roomCode, currentPhase, userId, EVENTS.PLAYER_DONE)

            //
            if(PHASE.DAY_DISCUSSION.key === currentPhase) {
                //
                if(!await ActionsRepository.isPhaseCompleted(roomCode, currentPhase, null)) {
                    return
                }

                //
                const players = await PhaseService.getVoteMax(roomCode, PHASE.DAY_DISCUSSION.key);
                if(players) {
                    await VoteRepository.killPlayerList(roomCode, players.map(p => p.player_id));

                    //
                    emit({
                        phase: PHASE.DAY_DISCUSSION.key,
                        message: `Có ${players.length} người bị vote chết`,
                        event: { role: ROLES.ALL.key, action: ACTIONS.VIEW },
                        data: players.length ? { players } : undefined
                    });

                    //
                    const roles = await PlayerRepository.getRoles(roomCode)
                    if(!roles || roles?.length < 1) {
                        RoomRepository.clearData(roomCode)
                        return;
                    }

                    //
                    if(await PhaseService.checkEnd(roomCode, roles, emit)) {
                        await ActionsRepository.clearActions(roomCode)
                        return;
                    }
                }

                //
                await RoomRepository.updateRooms([
                    {
                        code: roomCode,
                        status: STATUS.PLAYING,
                        current_phase: PHASE.ALL_VIEW_ROLE.key,
                        phase_expires_at: await RoomRepository.raw('TIMESTAMPADD(SECOND, ?, NOW())', [PHASE.ALL_VIEW_ROLE?.time])
                    }
                ])
            } else {
                //
                if(!await ActionsRepository.isPhaseCompleted(roomCode, currentPhase, player.role)) {
                    return
                }

                //
                await PhaseService.decreasePhaseExpire(roomCode, PHASE_TIME_MAX);
            }

            //
            await ActionsRepository.clearActions(roomCode)
        });
    },

    /**[ PLAYER_VOTE ]* */
    async playerVote(userId, roomCode, currentPhase, target) {
        // return RoomService.withRoomLock(roomCode, async () => {
            await GameService.validateActions(
                userId,
                roomCode,
                currentPhase
            );

            //
            if(PHASE.NIGHT_GUARD.key === currentPhase && await PlayerRepository.checkGuard(roomCode, target.id)) {
                throw new AppError(ERROR_CODES.TARGET_ID_IS_INVALID, "Không được bảo vệ một người hai đêm liên tiếp")
            }

            //
            await RoomRepository.upsertVote(
                roomCode,
                currentPhase,
                userId,
                target
            );
        // });
    },

    async getPlayerInfo(roomCode, playerIds) {
        return await PlayerRepository.getPlayerInfo(roomCode, playerIds);
    },

    async validateActions(userId, roomCode, currentPhase) {
        //
        const room = await RoomRepository.getByCodeAndPhase(roomCode, currentPhase)
        if(!room) {
            throw new AppError(ERROR_CODES.PHASE_IS_INVALID)
        }

        //
        const player = await PlayerRepository.getRole(roomCode, userId)
        if(!player) {
            throw new AppError(ERROR_CODES.PLAYER_IS_INVALID)
        }

        //
        return player;
    }
};

module.exports = GameService;
