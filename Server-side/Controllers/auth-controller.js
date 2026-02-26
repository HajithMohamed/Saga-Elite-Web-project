const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const sendMail = require("../Utils/send-mail");     // ← use your real util name
const generateOtp = require("../Utils/generate-otp");
const User = require("../Models/User");
const filterObj = require("../Utils/filter-object");
const signToken = require("../Utils/signin-token");

// how long (in minutes) our one‑time codes stay valid. defaults to 10.
const otpExpiryMinutes = () => Number(process.env.OTP_EXPIRES_IN || 10);
const getOtpExpiryDate = () => Date.now() + otpExpiryMinutes() * 60 * 1000;

// helper that wraps any message in the standard Saga Elite email design
const buildEmailTemplate = (heading, bodyHtml) => {
    return `
        <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 30px;">
            <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 8px;">
                <h1 style="text-align: center; color: #000;">SAGA ELITE</h1>
                <p style="text-align: center; letter-spacing: 2px; font-size: 12px; color: #777;">
                    RARE FIT FOREVER
                </p>
                <hr style="margin: 25px 0;" />
                <h2 style="color: #000;">${heading}</h2>
                ${bodyHtml}
                <hr style="margin: 25px 0;" />
                <p style="font-size: 12px; color: #999; text-align: center;">
                    © ${new Date().getFullYear()} Saga Elite. All rights reserved.
                </p>
            </div>
        </div>
    `;
};

const createSendToken = (user, statusCode, res, message) => {
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
    user.passwordConfirm = undefined;     // ← added from remote (good)
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
    const otpExpires = getOtpExpiryDate();

    const newUser = await User.create({
        email,
        password,
        otp,
        otpExpires,
        isVerified: false,
        provider: "local",
    });

    // send user verification email using shared template helper
    const registrationBody = `
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
        `;

    await sendMail({
        email: newUser.email,
        subject: "Saga Elite – Email Verification Code",
        html: buildEmailTemplate("Verify Your Email Address", registrationBody),
    });
    res.status(201).json({
        status: "success",
        message: "User registered successfully. Please verify your email with the OTP sent.",
        data : newUser
    });
});

const otpVerify = catchAsync(async(req, res, next)=>{
    const {otp, userId} = req.body

    if(!otp && !userId){
        return next(new AppError("All fields are required",400));
    }

    const user = await User.findById(userId)

    if(!user){
        return next(new AppError("User is not found",404));
    }

     if (user.otp.toString() !== otp.toString()) {
        return next(new AppError("Invalid OTP", 400));
    }

    if (Date.now() > new Date(user.otpExpires).getTime()) {
        return next(new AppError("OTP expired, Please request new otp", 400));
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save({ validateBeforeSave: false });

    const welcomeBody = `
                <p>Hi ${user.userName || "there"},</p>
                <p>Thank you for verifying your email address. Your Saga Elite account is now active.</p>
                <p>Explore our exclusive collections and enjoy limited‑edition fashion built for the bold.</p>
                <br/>
                <p>Happy shopping!<br/>The Saga Elite Team</p>
            `;

    await sendMail({
        email: user.email,
        subject: "Welcome to Saga Elite 🎉",
        html: buildEmailTemplate("Welcome to Saga Elite", welcomeBody),
    });
    createSendToken(user, 200, res, "Email has been verified.");
});

const resendOTP = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return next(new AppError("Email is required to resend OTP", 400));
    }

    const user = await User.findOne({ email });

    if (!user) {
        return next(new AppError("User not found", 404));
    }

    if (user.isVerified) {
        return next(new AppError("This account is already verified", 400));
    }

    const newOTP = generateOtp();
    user.otp = newOTP;
    user.otpExpires = getOtpExpiryDate();

    await user.save({ validateBeforeSave: false });

    try {
        const resendBody = `
                    <p>Hi ${user.userName || "there"},</p>
                    <p>We received a request to resend your verification code for Saga Elite.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 28px; letter-spacing: 6px; font-weight: bold; color: #000;">
                            ${newOTP}
                        </span>
                    </div>
                    <p><strong>Note:</strong> This code is valid for the next 24 hours. Please do not share it with anyone.</p>
                    <p>If you didn’t request this, you can safely ignore this email.</p>
                `;

        await sendMail({
            email: user.email,
            subject: "Saga Elite – New Verification Code",
            html: buildEmailTemplate("Email Verification - New Code", resendBody),
        });

        res.status(200).json({
            status: "success",
            message: "OTP sent successfully.",
        });
    } catch (error) {
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError("Error sending email, please try again."));
    }
});

const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError("Please provide email and password", 400));
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        return next(new AppError("Incorrect email or password", 401));
    }

    const isPasswordCorrect = await user.correctPassword(password, user.password);

    if (!isPasswordCorrect) {
        return next(new AppError("Incorrect email or password", 401));
    }

    if (!user.isVerified) {
        return next(new AppError("User not verified. Please verify your email first.", 401));
    }

    createSendToken(user, 200, res, "Login successful");
});


const logout = catchAsync(async (req, res, next) => {
    res.cookie("token", "loggedout", {
        expires: new Date(Date.now() + 10 * 100),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({
        status: "success",
        message: "Logged out successfully",
    });
});

const changePassword = catchAsync(async (req, res, next) => {
    const { oldPassword, newPassword, passwordConfirm } = req.body;

    if (!oldPassword || !newPassword || !passwordConfirm) {
        return next(new AppError("Old password, new password, and confirmation are required", 400));
    }

    if (newPassword !== passwordConfirm) {
        return next(new AppError("New passwords do not match", 400));
    }

    if (newPassword.length < 8) {
        return next(new AppError("New password must be at least 8 characters long", 400));
    }

    // re-fetch the user from database with password field included
    let user = req.userInfo;
    if (!user) {
        return next(new AppError("Authentication required", 401));
    }

    // grab fresh copy that includes the hashed password (select is false by default)
    user = await User.findById(user.id).select("+password");
    if (!user) {
        return next(new AppError("User not found", 404));
    }

    const isCorrect = await user.correctPassword(oldPassword, user.password);
    if (!isCorrect) {
        return next(new AppError("Current password is incorrect", 401));
    }

    user.password = newPassword;

    await user.save();

    const passwordChangedBody = `
                <p>Your password was successfully changed.</p>
                <p>If this wasn't you, please contact support immediately.</p>
            `;

    await sendMail({
        email: user.email,
        subject: "Saga Elite – Password Updated",
        html: buildEmailTemplate("Password Updated", passwordChangedBody),
    });

    res.status(200).json({
        status: "success",
        message: "Password updated successfully",
    });
});

const forgotPassword = catchAsync(async(req, res, next)=>{
    const { email } = req.body;

    if (!email) {
        return next(new AppError("Email is required", 400));
    }

    const user = await User.findOne({ email });

    if (!user) {
        return next(new AppError("User not found", 404));
    }

    const otp = generateOtp();

    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = getOtpExpiryDate();

    await user.save({ validateBeforeSave: false });

    try {
        const resetBody = `
                    <p>We received a request to reset your Saga Elite password.</p>
                    <p>Use the following code to reset your password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 28px; letter-spacing: 8px; font-weight: bold; color: #000;">
                            ${otp}
                        </span>
                    </div>
                    <p>This code is valid for <strong>15 minutes</strong>.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                `;

        await sendMail({
            email: user.email,
            subject: "Saga Elite – Password Reset Code",
            html: buildEmailTemplate("Password Reset Request", resetBody),
        });

        res.status(200).json({
            status: "success",
            message: "Reset code sent to your email",
        });
    } catch (err) {
        user.resetPasswordOtp = undefined;
        user.resetPasswordOtpExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError("Failed to send email. Try again later.", 500));
    }
});

const resendResetPasswordOtp = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return next(new AppError("Email is required", 400));
    }

    const user = await User.findOne({ email });

    if (!user) {
        return next(new AppError("User not found", 404));
    }

    const otp = generateOtp();
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = getOtpExpiryDate();
    await user.save({ validateBeforeSave: false });

    const resetBody2 = `
                <p>We received a request to reset your Saga Elite password.</p>
                <p>Use the following code to reset your password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 28px; letter-spacing: 8px; font-weight: bold; color: #000;">
                        ${otp}
                    </span>
                </div>
                <p>This code is valid for <strong>15 minutes</strong>.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `;

    await sendMail({
        email: user.email,
        subject: "Saga Elite – Password Reset Code",
        html: buildEmailTemplate("Password Reset Request", resetBody2),
    });

    res.status(200).json({
        status: "success",
        message: "Reset code sent to your email",
    });
});

const resetPassword = catchAsync(async(req, res, next)=>{
    const {email, otp, newPassword, confirmPassword} = req.body;

    if(!email || !otp || !newPassword || !confirmPassword){
        return next(new AppError("All fields are required!",403));
    }

    if(newPassword!==confirmPassword){
        return next(new AppError("Passwords are not matched!!",403));
    }

    const user = await User.findOne({email});

    if(!user || !user.resetPasswordOtp){
        return next(new AppError("User is not found",404));
    }

    if(user.resetPasswordOtp.toString()!== otp.toString()){
        return next(new AppError("Invalid reset code",400));
    }
    if(user.resetPasswordOtpExpires && user.resetPasswordOtpExpires<Date.now()){
        return next(new AppError("Code is expired",400));
    }

    user.password = newPassword;

    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;

    await user.save();

    const resetSuccessBody = `
                <p>Your password was successfully updated.</p>
                <p>You can now log in with your new password.</p>
            `;

    await sendMail({
        email: user.email,
        subject: "Saga Elite – Password Changed Successfully",
        html: buildEmailTemplate("Password Changed", resetSuccessBody),
    });

    res.status(200).json({
        success: true,
        message: "Password reset successful. Please login."
    });
});


module.exports = {
    registerUser,
    otpVerify,
    resendOTP,
    login,
    changePassword,
    forgotPassword,
    resendResetPasswordOtp,
    resetPassword,
    logout
};