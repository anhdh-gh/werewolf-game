const { z } = require('zod');

exports.createRoomDto = z.object({
    room: z.object({
        max_players: z
            .int32()
            .min(4, { message: 'Max players must be >= 4' })
    })
});

exports.joinRoomDto = z.object({
    room: z.object({
        code: z
            .string()
            .trim()
            .min(5, { message: 'Room code must be at least 5 characters' })
            .max(10, { message: 'Room code must be at most 10 characters' }),
    })
});

