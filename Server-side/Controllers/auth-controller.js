const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const sendMail = require("../Utils/send-mail");
const generateOtp = require("../Utils/generate-otp");
const User = require("../Models/User");
const jwt = require("jsonwebtoken");
const filterObj = require("../Utils/filter-object");


const signToken = (id) => {
    return jwt.sign({id},process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_EXPIRES_IN,
    })
} 

const creatSendToken = (user, statusCode, res, message) =>{
    const token = signToken(user._id);

    const cookieOption = {
        expires : new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 7) * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    }

    res.cookie("token", token, cookieOption);

    user.password = undefined;
    user.passwordConfirm = undefined;
    user.otp = undefined;

    res.status(statusCode).json({
        status: "success",
        message,
        token,
        data: { user },
    });

}

const registerUser = catchAsync(async(req, res, next)=>{
    const {userData} = filterObj(req.body, "email","password","confirmPassword");

    if(Object.keys(userData).length===0){
        return next(AppError("All fields are required",400));
    }

    if(userData.password !== userData.confirmPassword){
        return next(AppError("Passwords do not match", 400));
    }

    const existingUser = await User.findOne({email});

    if(existingUser){
        return next(new AppError("Provided email already exists, try a different one", 400));
    }

    const otp = generateOtp();
    const otpExpires = Date.now() * 15*60*1000

    const newUser = new User({
        email,
        password,
        otp,
        otpExpires : otpExpires,
        isVerified : false
    })

    await newUser.save()

    await sendEmail({
        email: savedUser.email,
        subject: "Saga Elite – Email Verification Code",
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 30px;">
            <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 8px;">
                
                <h1 style="text-align: center; color: #000;">SAGAA ELITE</h1>
                <p style="text-align: center; letter-spacing: 2px; font-size: 12px; color: #777;">
                    RARE FIT FOREVER
                </p>

                <hr style="margin: 25px 0;" />

                <h2 style="color: #000;">Verify Your Email Address</h2>

                <p style="color: #555; font-size: 14px;">
                    Welcome to <strong>Saga Elite</strong> — Limited Edition Fashion built for the bold.
                </p>

                <p style="color: #555; font-size: 14px;">
                    Please use the verification code below to complete your registration:
                </p>

                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 28px; letter-spacing: 6px; font-weight: bold; color: #000;">
                        ${otp}
                    </span>
                </div>

                <p style="color: #555; font-size: 14px;">
                    This code will expire in <strong>10 minutes</strong>.
                </p>

                <p style="color: #555; font-size: 14px;">
                    If you did not request this, please ignore this email.
                </p>

                <hr style="margin: 25px 0;" />

                <p style="font-size: 12px; color: #999; text-align: center;">
                    © ${new Date().getFullYear()} Saga Elite. All rights reserved.
                </p>
            </div>
        </div>
        `,
    });


    res.status(200).json({
        success : true,
        message : "new user created successfully",
        data : newUser
    })
})

module.exports = {
    registerUser
}
