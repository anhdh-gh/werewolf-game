const bcrypt = require('bcryptjs');
const UserRepository = require('../repositories/user.repository');
const jwtUtil = require('../utils/jwt.util');
const AppError = require('../errors/AppError');
const ERROR_CODES = require('../constants/errorCode.constants');
const SALT_ROUNDS = 10;

const AuthService = {

    async register({ email, username, password }) {
        // Check email duplicate
        const emailExists = await UserRepository.findByEmail(email);
        if (emailExists) {
            throw new AppError(ERROR_CODES.EMAIL_ALREADY_EXISTS);
        }

        // Check username duplicate
        const usernameExists = await UserRepository.findByUsername(username);
        if (usernameExists) {
            throw new AppError(ERROR_CODES.USERNAME_ALREADY_EXISTS);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Create user
        return await UserRepository.create({
            email,
            username,
            password: hashedPassword
        });
    },

    async login({ username, password }) {
        // Check username exists
        const user = await UserRepository.findByUsername(username);
        if (!user) {
            throw new AppError(ERROR_CODES.INVALID_REQUEST);
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new AppError(ERROR_CODES.INVALID_REQUEST);
        }

        // Generate tokens
        const accessToken = jwtUtil.generateAccessToken(user);
        const refreshToken = jwtUtil.generateRefreshToken(user);

        // Save refresh token
        await UserRepository.updateRefreshToken(user.username, refreshToken);

        return {
            access_token: accessToken,
            refresh_token: refreshToken
        };
    }
};

module.exports = AuthService;
