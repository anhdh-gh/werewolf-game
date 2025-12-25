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

async function clearRoom(rooms) {
    try {
        if (!rooms.length) return;

        // Run all room phase resolutions in parallel
        await Promise.all(
            rooms.map(room =>
                RoomRepository.clearData(room.code)
            )
        );
    } catch (err) {
        console.error('[ClearRoom]', err);
    }
}

function startRoomPhaseJob() {
    async function loop() {
        await runRoomPhaseJob();
        setTimeout(loop, CHECK_INTERVAL_MS);
    }

    loop(); // start once
}

function startClearRoomJob() {
    async function loop() {
        await clearRoom(await RoomRepository.findRoomsCreatedOverHours(8));
        setTimeout(loop, 1800000);
    }

    loop(); // start once
}

function startClearRoomDisconnectJob() {
    async function loop() {
        await clearRoom(await RoomRepository.findRoomsAllDisconnected());
        setTimeout(loop, 900000);
    }

    loop(); // start once
}

function startClearRoomNotPlayerJob() {
    async function loop() {
        await clearRoom(await RoomRepository.findEmptyRoomsCreatedOverHours(1));
        setTimeout(loop, 1200000);
    }

    loop(); // start once
}

module.exports = { startRoomPhaseJob, startClearRoomJob, startClearRoomDisconnectJob, startClearRoomNotPlayerJob };
