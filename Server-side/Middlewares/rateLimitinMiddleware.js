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
const contactLimiter = createRateLimiting(3, 60 * 60 * 1000); // 3 requests per 60 minutes for contact

module.exports = { createRateLimiting, authLimiter, generalLimiter, contactLimiter };