const prisma = require('../config/prisma');

exports.findByEmail = (email) =>
    prisma.user.findUnique({
        where: { email }
    });

exports.findById = (id) =>
    prisma.user.findUnique({
        where: { id: BigInt(id) }
    });

exports.create = (data) =>
    prisma.user.create({ data });

exports.updateRefreshToken = (id, refreshToken) =>
    prisma.user.update({
        where: { id: BigInt(id) },
        data: { refreshToken }
    });

exports.clearRefreshToken = (id) =>
    prisma.user.update({
        where: { id: BigInt(id) },
        data: { refreshToken: null }
    });
