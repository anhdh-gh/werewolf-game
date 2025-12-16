// dtos/auth.dto.js
const { z } = require('zod');

exports.registerDto = z.object({
    email: z
        .string()
        .max(50, { message: 'Email must be at most 50 characters' })
        .email({ message: 'Invalid email format' }),

    username: z
        .string()
        .trim()
        .min(3, { message: 'Username must be at least 3 characters' })
        .max(50, { message: 'Username must be at most 50 characters' }),

    password: z
        .string()
        .min(6, { message: 'Password must be at least 6 characters' })
        .max(50, { message: 'Password must be at most 50 characters' })
});

exports.loginDto = z.object({
    username: z
        .string()
        .trim()
        .min(3, { message: 'Username must be at least 3 characters' })
        .max(50, { message: 'Username must be at most 50 characters' }),

    password: z
        .string()
        .min(6, { message: 'Password must be at least 6 characters' })
        .max(50, { message: 'Password must be at most 50 characters' })
});

exports.refreshDto = z.object({
    refresh_token: z
        .string()
        .trim()
        .nonempty({ message: 'Refresh token must be empty' })
        .max(500, { message: 'Refresh token must be at most 500 characters' }),
});

