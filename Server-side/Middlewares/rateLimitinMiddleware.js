const rateLimiting = require("express-rate-limit")

const createRateLimiting = (maxRequests,time)=>{
    return rateLimiting({
        max : maxRequests,
        windowMs : time,
        standardHeader : true,
        legacyHeader : false,
    })
}

module.exports = {createRateLimiting}