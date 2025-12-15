const userRepo = require('../repositories/user.repository');

exports.getUserByEmail = async (email) => {
    return userRepo.findByEmail(email);
};
