const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const signToken = require("../Utils/signin-token");
const {OAuth2Client} = require("google-auth-library");
const User = require("../Models/User")

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const googleAuth = catchAsync(async(req, res, next)=>{
    const {token} = req.body;

    if(!token){
        return next(new AppError("Google Token is required",400))
    }
    
    const ticket = await client.verifyIdToken({
        idToken : token,
        audience : process.env.GOOGLE_CLIENT_ID
    })

    const payload = ticket.getPayload()

    const {email, sub, picture, email_verified} = payload

    if(!email_verified){
        return next(new AppError("Google email not verified",400))
    }

    const user = await User.findOne({email})

    if(user){
        return next(new AppError("This user is already exist",400));
    }

    const newUser = new User({
        email,
        googleId : sub,
        profilePicture : picture,
        provider : "google",
        isVerified : true
    })

    await newUser.save()

    res.status(200).json({
        success : true,
        message : "Ne User created successfully",
        User : newUser
    })
})

module.exports = {
    googleAuth
}