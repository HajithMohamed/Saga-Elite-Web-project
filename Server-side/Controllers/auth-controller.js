const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const sendMail = require("../Utils/send-mail");
const generateOtp = require("../Utils/generate-otp");
const User = require("../Models/User");
const jwt = require("jsonwebtoken");
const filterObj = require("../Utils/filter-object");

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

const creatSendToken = (user, statusCode, res, message) => {
    const token = signToken(user._id);

    const cookieOption = {
        expires: new Date(
            Date.now() +
                (process.env.JWT_COOKIE_EXPIRES_IN || 7) *
                    24 *
                    60 *
                    60 *
                    1000
        ),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    };

    res.cookie("token", token, cookieOption);

    user.password = undefined;
    user.otp = undefined;

    res.status(statusCode).json({
        status: "success",
        message,
        token,
        data: { user },
    });
};

const registerUser = catchAsync(async (req, res, next) => {
    const userData = filterObj(
        req.body,
        "email",
        "password",
        "confirmPassword"
    );
    const { email, password, confirmPassword } = userData;

    if (!email || !password || !confirmPassword) {
        return next(new AppError("All fields are required", 400));
    }

    if (password !== confirmPassword) {
        return next(new AppError("Passwords do not match", 400));
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        return next(
            new AppError(
                "Provided email already exists, try a different one",
                400
            )
        );
    }

    const otp = generateOtp();
    const otpExpires = Date.now() + 15 * 60 * 1000;

    const newUser = await User.create({
        email,
        password,
        otp,
        otpExpires,
        isVerified: false,
        provider: "local",
    });

    await sendMail({
        email: newUser.email,
        subject: "Saga Elite – Email Verification Code",
        html: `<h2>Your OTP is ${otp}</h2>`,
    });

    res.status(201).json({
        status: "success",
        message:
            "User registered successfully. Please verify OTP.",
    });
});

module.exports = {
    registerUser,
};