const jwt = require("jsonwebtoken")
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const User = require("../Models/User")

const authMiddleware = catchAsync(async (req,res,next)=>{
    // Express stores headers in req.headers (plural)
    const authHeader = req.headers.authorization;

    // If header missing or doesn't start with Bearer token, user is not authenticated
    if(!authHeader || !authHeader.startsWith("Bearer")){
        // set 401 unauthorized status
        return next(new AppError("user not authenticated. Please login first", 401));
    }

    const token = authHeader.split(" ")[1];

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decodedToken.id);

    if (!user) {
        return next(new AppError("User no longer exists.", 401));
    }

    req.userInfo = user;

    next();
})

module.exports = authMiddleware;