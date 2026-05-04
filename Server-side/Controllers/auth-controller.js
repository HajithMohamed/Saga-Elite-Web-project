const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const sendMail = require("../Utils/send-mail");
const generateOtp = require("../Utils/generate-otp");
const User = require("../Models/User");
const Guest = require("../Models/Guest");
const filterObj = require("../Utils/filter-object");
const createSendToken = require("../Utils/create-send-token");
const buildEmailTemplate = require("../Utils/email-template");
const logger = require("../Utils/logger");

// how long (in minutes) our one‑time codes stay valid. defaults to 10.
const otpExpiryMinutes = () => Number(process.env.OTP_EXPIRES_IN || 10);
const getOtpExpiryDate = () => Date.now() + otpExpiryMinutes() * 60 * 1000;



// createSendToken is now imported from ../Utils/create-send-token

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

    let mailError = null;
    try {
        await sendMail({
            email: newUser.email,
            subject: "Saga Elite – Email Verification Code",
            html: buildEmailTemplate("Verify Your Email Address", registrationBody),
        });
    } catch (err) {
        // log for debugging, but do not crash the whole request
        logger.error("Registration verification email failed", { error: err });
        mailError = err;
    }

    const responseMessage = mailError
        ? "User registered successfully but verification email could not be sent. Please contact support."
        : "User registered successfully. Please verify your email with the OTP sent.";

    // always return 201 so client doesn’t see a 500 on mail failures
    res.status(201).json({
        status: "success",
        message: responseMessage,
        data: newUser,
        mailError: mailError ? mailError.message : undefined,
    });
});

const otpVerify = catchAsync(async(req, res, next)=>{
    const {otp, userId} = req.body

    if(!otp || !userId){
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
                    <p><strong>Note:</strong> This code is valid for the next 10 minutes. Please do not share it with anyone.</p>
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

    if (!user.isActive) {
        return next(new AppError("Your account has been deactivated. Please contact support.", 403));
    }

    createSendToken(user, 200, res, "Login successful");
});


const logout = catchAsync(async (req, res, next) => {
    res.cookie("token", "loggedout", {
        expires: new Date(Date.now() + 10 * 100),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.status(200).json({
        status: "success",
        message: "Logged out successfully",
    });
});

const changePassword = catchAsync(async (req, res, next) => {
    const { oldPassword, newPassword, passwordConfirm } = req.body;

    if (!newPassword || !passwordConfirm) {
        return next(new AppError("New password and confirmation are required", 400));
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

    const hasExistingPassword = Boolean(user.password);

    if (hasExistingPassword) {
        if (!oldPassword) {
            return next(new AppError("Current password is required", 400));
        }

        const isCorrect = await user.correctPassword(oldPassword, user.password);
        if (!isCorrect) {
            return next(new AppError("Current password is incorrect", 401));
        }
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
        message: hasExistingPassword ? "Password updated successfully" : "Password set successfully",
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

const verifyResetOtp = catchAsync(async (req, res, next) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return next(new AppError("Email and OTP are required", 400));
    }

    const user = await User.findOne({ email });

    if (!user || !user.resetPasswordOtp || user.resetPasswordOtp.toString() !== otp.toString()) {
        return next(new AppError("Invalid or expired OTP", 400));
    }

    if (Date.now() > new Date(user.resetPasswordOtpExpires).getTime()) {
        return next(new AppError("OTP expired, please request a new one", 400));
    }

    res.status(200).json({
        status: "success",
        success: true,
        message: "OTP verified successfully",
    });
});

const resetPassword = catchAsync(async(req, res, next)=>{
    const {email, otp, newPassword, confirmPassword} = req.body;

    if(!email || !otp || !newPassword || !confirmPassword){
        return next(new AppError("All fields are required!",400));
    }

    if(newPassword!==confirmPassword){
        return next(new AppError("Passwords are not matched!!",400));
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
        status: "success",
        success: true,
        message: "Password reset successful. Please login."
    });
});


const checkAuth = catchAsync(async (req, res, next) => {
    const user = req.userInfo;
    if (!user) {
        return next(new AppError("User not found", 404));
    }
    res.status(200).json({
        status: "success",
        success: true,
        message: "Authenticated user",
        data: {
            user,
        },
    });
});

const checkGuest = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    if (!email) return next(new AppError("Email is required", 400));

    const user = await User.findOne({ email });
    const guest = await Guest.findOne({ email });

    res.status(200).json({
        status: "success",
        data: {
            existsAsUser: !!user,
            existsAsGuest: !!guest,
            guestDetails: guest
        }
    });
});

const registerGuest = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    if (!email) return next(new AppError("Email is required", 400));

    const existingUser = await User.findOne({ email });
    if (existingUser) return next(new AppError("User already exists", 400));

    // Generate random 10-char password
    const temporaryPassword = Math.random().toString(36).slice(-10) + "S1!";

    const newUser = await User.create({
        email,
        password: temporaryPassword,
        isVerified: true, 
        provider: "local",
    });

    const guest = await Guest.findOne({ email });
    if (guest) {
        guest.isRegistered = true;
        await guest.save();
    }

    const registrationBody = `
        <p>Hi there,</p>
        <p>Welcome to <strong>Saga Elite</strong>!</p>
        <p>Your account has been created based on your recent activity.</p>
        <p>Your temporary password is: <strong>${temporaryPassword}</strong></p>
        <p>Please log in and change your password for security.</p>
        <br/>
        <p>Happy shopping!<br/>The Saga Elite Team</p>
    `;

    try {
        await sendMail({
            email: newUser.email,
            subject: "Welcome & Your Temporary Password",
            html: buildEmailTemplate("Account Created", registrationBody),
        });
    } catch (err) {
        logger.error("Guest registration email failed", { error: err });
    }

    createSendToken(newUser, 201, res, "Registration successful. Check your email for password.");
});

module.exports = {
    registerUser,
    otpVerify,
    resendOTP,
    login,
    changePassword,
    forgotPassword,
    resendResetPasswordOtp,
    verifyResetOtp,
    resetPassword,
    logout,
    checkAuth,
    checkGuest,
    registerGuest,
};
