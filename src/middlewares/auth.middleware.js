const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Missing access token'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Gắn user vào request
        req.user = {
            id: decoded.sub,
            username: decoded.username,
            role: decoded.role
        };

        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired access token'
        });
    }
};
