module.exports = (err, req, res, next) => {
    // always log server errors for debugging
    console.error("[Global Error]", err);

    // handle Multer file-size or other upload errors explicitly
    if (err.name === "MulterError") {
        // multer sets code like LIMIT_FILE_SIZE, LIMIT_FILE_COUNT, etc.
        if (err.code === "LIMIT_FILE_SIZE") {
            err.statusCode = 400;
            err.message = "Each image must be 5 MB or smaller";
        } else {
            // generic multer error
            err.statusCode = 400;
            err.message = err.message || "File upload error";
        }
    }

    // convert mongoose validation failures to 400 so client sees bad request
    if (err.name === 'ValidationError') {
        err.statusCode = 400;
        err.status = 'fail';
        // message already constructed by Mongoose
    }

    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    res.status(err.statusCode).json({
        status: err.status,
        // expose only necessary details to client
        message: err.message || "An error occurred",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};