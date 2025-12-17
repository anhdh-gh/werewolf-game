const UserRepository = require('../repositories/user.repository');

const UserService = {

    async deleteUser(id) {
        await UserRepository.deleteById(id);
    }
};

module.exports = UserService;
