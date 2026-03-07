const rateLimiting = require("express-rate-limit");

const createRateLimiting = (maxRequests, time) => {
    return rateLimiting({
        max: maxRequests,
        windowMs: time,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            success: false,
            message: `Too many requests. Limit is ${maxRequests} per ${time / 60000} minutes.`,
        },
    });
};

// Pre-configured limiters for different endpoint types
const authLimiter = createRateLimiting(10, 15 * 60 * 1000); // 10 requests per 15 minutes for auth
const generalLimiter = createRateLimiting(100, 15 * 60 * 1000); // 100 requests per 15 minutes for general

module.exports = { createRateLimiting, authLimiter, generalLimiter };