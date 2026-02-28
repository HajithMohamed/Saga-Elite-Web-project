module.exports = (err, req, res, next) => {
    // always log server errors for debugging
    console.error("[Global Error]", err);

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