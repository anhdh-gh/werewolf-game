const UserRepository = require('../repositories/user.repository');

const UserService = {

    async deleteUser(username) {
        await UserRepository.deleteByUsername(username);
    }
};

module.exports = UserService;
