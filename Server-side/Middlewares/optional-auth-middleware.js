const jwt = require("jsonwebtoken");
const User = require("../Models/User");

const optionalAuthMiddleware = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token || token === "loggedout") {
        return next(); // Continue without user — public access
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user && user.isActive) {
            req.userInfo = user;
        }
    } catch (_) {
        // Invalid token — treat as unauthenticated, don't block
    }

    next();
};

module.exports = optionalAuthMiddleware;