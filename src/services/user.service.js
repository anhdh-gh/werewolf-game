const UserRepository = require('../repositories/user.repository');

const UserService = {

    async deleteUser(id) {
        await UserRepository.deleteById(id);
    },

    async getInfo(id) {
        return await UserRepository.getInfo(id);
    }
};

module.exports = UserService;
