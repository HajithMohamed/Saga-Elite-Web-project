

const winston = require('winston');

// Configure Winston logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

// If not in production, log to console as well
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

const requestLogger = (req, res, next) => {
    const start = Date.now();
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const method = req.method;
    const url = req.originalUrl;
    const userAgent = req.get('User-Agent') || 'unknown';

    // Log after response is finished
    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;

        logger.info({
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