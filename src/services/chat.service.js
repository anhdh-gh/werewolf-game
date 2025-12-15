exports.handleMessage = async (text) => {
    return {
        message: text,
        created_at: new Date()
    };
};
