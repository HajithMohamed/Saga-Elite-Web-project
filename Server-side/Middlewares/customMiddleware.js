const logger = require("../Utils/logger");

const requestLogger = (req, res, next) => {
    const start = Date.now();
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const method = req.method;
    const url = req.originalUrl;
    const userAgent = req.get("User-Agent") || "unknown";

    res.on("finish", () => {
        const duration = Date.now() - start;
        const status = res.statusCode;

        logger.info("HTTP request completed", {
            ip,
            method,
            url,
            userAgent,
            status,
            duration: `${duration}ms`,
        });
    });

    next();
};

module.exports = { requestLogger };
