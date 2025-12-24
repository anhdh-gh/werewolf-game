const PhaseService = require('../services/phase.service');
const RoomRepository = require('../repositories/room.repository');
const EVENTS = require('../constants/events');
const { getIO } = require('../config/socket');

const CHECK_INTERVAL_MS = 1000;

async function runRoomPhaseJob() {
    try {
        const io = getIO();

        const expiredRooms = await RoomRepository.findExpiredPhases();
        if (!expiredRooms.length) return;

        // Run all room phase resolutions in parallel
        await Promise.all(
            expiredRooms.map(room =>
                PhaseService.getNextPhase(
                room,
                data => io.to(room.code).emit(EVENTS.GAME_DATA_FLOW, data)
                ).then(res => {
                    if(!res) {
                        io.in(room.code).disconnectSockets(true);
                    }
                })
            )
        );
    } catch (err) {
        console.error('[RoomPhaseJob]', err);
    }
}

function startRoomPhaseJob() {
    async function loop() {
        await runRoomPhaseJob();
        setTimeout(loop, CHECK_INTERVAL_MS);
    }

    loop(); // start once
}

module.exports = { startRoomPhaseJob };
