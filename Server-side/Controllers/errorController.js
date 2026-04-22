const winston = require('winston');
const fs = require('fs');
const path = require('path');

const logsDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Configure a simple error logger (reuse or minimal)
const errorLogger = winston.createLogger({
    level: 'error',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/errors.log' }),
    ],
});

if (process.env.NODE_ENV !== 'production') {
    errorLogger.add(new winston.transports.Console());
}

module.exports = (err, req, res, next) => {
    // Log the error with details
    errorLogger.error({
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
    });

    // Handle rate limiting errors specifically
    if (err.statusCode === 429) {
        err.message = 'Too many requests. Please try again later.';
        err.status = 'error';
    }

    // Handle Multer file-size or other upload errors explicitly
    if (err.name === "MulterError") {
        if (err.code === "LIMIT_FILE_SIZE") {
            err.statusCode = 400;
            err.message = "Each image must be 5 MB or smaller";
        } else {
            err.statusCode = 400;
            err.message = err.message || "File upload error";
        }
    }

    // Convert mongoose validation failures to 400 so client sees bad request
    if (err.name === 'ValidationError') {
        err.statusCode = 400;
        err.status = 'fail';
        // message already constructed by Mongoose
    }

    // Convert invalid ObjectId casting to a 400 bad request
    if (err.name === 'CastError') {
        err.statusCode = 400;
        err.status = 'fail';
        err.message = `Invalid ${err.path}: ${err.value}`;
    }

    // Convert auth token errors into 401 unauthorized responses
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        err.statusCode = 401;
        err.status = 'fail';
        err.message = 'Authentication failed. Please log in again.';
    }

    // Convert duplicate key errors into a client-friendly response
    if (err.code === 11000) {
        err.statusCode = 400;
        err.status = 'fail';
        const fields = Object.keys(err.keyValue || {}).join(', ');
        err.message = `Duplicate field value for ${fields}. Please use another value.`;
    }

    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    res.status(err.statusCode).json({
        status: err.status,
        // Expose only necessary details to client
        message: err.message || "An error occurred",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};