const loadKeyFromEnv = (envKey) => {
    if (!process.env[envKey]) {
        throw new Error(`Missing env: ${envKey}`);
    }

    return Buffer.from(process.env[envKey], 'base64');
};

module.exports = {
    privateKey: loadKeyFromEnv('JWT_PRIVATE_KEY'),
    publicKey: loadKeyFromEnv('JWT_PUBLIC_KEY')
};
