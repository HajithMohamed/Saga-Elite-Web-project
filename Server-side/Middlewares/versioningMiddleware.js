const urlversionning = (version) => (req, res, next) => {
    // Check if the request is under the correct API version prefix
    if (req.baseUrl === `/api/${version}`) {
        next();
    } else {
        res.status(404).json({
            success: false,
            message: "API version is not supported"
        });
    }
};

module.exports = { urlversionning };