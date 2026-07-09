const crypto = require("crypto");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const sendMail = require("../Utils/send-mail");
const generateOtp = require("../Utils/generate-otp");
const User = require("../Models/User");
const Guest = require("../Models/Guest");
const filterObj = require("../Utils/filter-object");
const createSendToken = require("../Utils/create-send-token");
const buildEmailTemplate = require("../Utils/email-template");
const {
  cleanPhoneNumber,
  sendWhatsAppMessage,
  sendWhatsAppTemplateMessage,
} = require("../Utils/whatsapp-service");
const {
  isValidSriLankanMobile,
  normalizeSriLankanMobile,
} = require("../Utils/phone-validator");
const logger = require("../Utils/logger");
const { recordLoginAttempt } = require("../Utils/login-activity-service");
const { ensureWelcomeReward } = require("../Utils/reward-service");
const Customer = require("../Models/Customer");
const { migrateGuestToUser, ensureCustomerRecord } = require("../Services/migration-service");
const { isAdminRole } = require("../Utils/admin-roles");

// Best-effort WhatsApp dispatch for auth flows. Never throws — auth must
// continue even if WhatsApp is misconfigured or the user has no phone.
const trySendAuthWhatsApp = async (user, message, label) => {
  const phone = cleanPhoneNumber(user?.phoneNumber);
  if (!phone) return { sent: false, skipped: true };
  try {
    const result = await sendWhatsAppMessage({ to: phone, message });
    if (result?.skipped) {
      logger.warn(`Auth WhatsApp dispatch skipped (${label})`, {
        reason: result.reason,
        userId: user?._id,
      });
      return { sent: false, skipped: true, reason: result.reason };
    }
    return { sent: true, skipped: false };
  } catch (err) {
    logger.error(`Auth WhatsApp dispatch failed (${label})`, {
      error: err?.message || String(err),
      userId: user?._id,
    });
    return { sent: false, skipped: false, error: err };
  }
};

const trySendAuthWhatsAppOtp = async (user, otp, label) => {
  const phone = cleanPhoneNumber(user?.phoneNumber);
  if (!phone) return { sent: false, skipped: true };

  const templateName =
    process.env.WHATSAPP_AUTH_OTP_TEMPLATE_NAME ||
    process.env.WHATSAPP_OTP_TEMPLATE_NAME;
  const languageCode = process.env.WHATSAPP_AUTH_OTP_LANGUAGE || "en_US";
  const buttonSubType = process.env.WHATSAPP_AUTH_OTP_BUTTON_SUB_TYPE || "url";
  const includeButton =
    process.env.WHATSAPP_AUTH_OTP_INCLUDE_BUTTON !== "false";

  try {
    const result = templateName
      ? await sendWhatsAppTemplateMessage({
          to: phone,
          templateName,
          languageCode,
          bodyParameters: [otp],
          buttonParameters: includeButton ? [otp] : [],
          buttonSubType,
        })
      : await sendWhatsAppMessage({
          to: phone,
          message: `Saga Elite verification code: ${otp}\nValid for ${otpExpiryMinutes()} minutes. Don't share this code.`,
        });

    if (result?.skipped) {
      logger.warn(`Auth WhatsApp OTP dispatch skipped (${label})`, {
        reason: result.reason,
        userId: user?._id,
        hasTemplate: Boolean(templateName),
      });
      return { sent: false, skipped: true, reason: result.reason };
    }

    return { sent: true, skipped: false };
  } catch (err) {
    logger.error(`Auth WhatsApp OTP dispatch failed (${label})`, {
      error: err?.message || String(err),
      userId: user?._id,
      hasTemplate: Boolean(templateName),
      templateName: templateName || undefined,
    });
    return { sent: false, skipped: false, error: err };
  }
};

// how long (in minutes) our one‑time codes stay valid. defaults to 10.
const otpExpiryMinutes = () => Number(process.env.OTP_EXPIRES_IN || 10);
const getOtpExpiryDate = () => Date.now() + otpExpiryMinutes() * 60 * 1000;



// createSendToken is now imported from ../Utils/create-send-token

const registerUser = catchAsync(async (req, res, next) => {
    const userData = filterObj(
        req.body,
        "email",
        "password",
        "confirmPassword",
        "phoneNumber",
        "username"
    );
    const { email, password, confirmPassword, phoneNumber, username } = userData;

    if (!email || !password || !confirmPassword) {
        return next(new AppError("Email, password and confirm password are required", 400));
    }

    if (password !== confirmPassword) {
        return next(new AppError("Passwords do not match", 400));
    }

    if (phoneNumber && !isValidSriLankanMobile(phoneNumber)) {
        return next(
            new AppError(
                "Phone number must be a valid Sri Lankan mobile (e.g. 077 123 4567 or +94 77 123 4567).",
                400
            )
        );
    }

    const normalizedPhone = phoneNumber ? normalizeSriLankanMobile(phoneNumber) : undefined;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        if (existingUser.provider && existingUser.provider !== "local") {
            return next(
                new AppError(
                    `This email is already registered via ${existingUser.provider}. Please use the ${existingUser.provider} sign-in button instead.`,
                    400
                )
            );
        }

        if (existingUser.isVerified) {
            return next(
                new AppError(
                    "Provided email already exists, try a different one",
                    400
                )
            );
        }
        // Unverified local account: ownership of the email was never proven,
        // so let the registration be retried instead of dead-ending the user.
        // Refresh the credentials and issue a fresh OTP (falls through below).
    }

    // Same phone shouldn't be reused across local accounts — otherwise the
    // WhatsApp OTP fan-out becomes ambiguous when two users get the same
    // code via the same channel.
    if (normalizedPhone) {
        const phoneOwner = await User.findOne({
            phoneNumber: normalizedPhone,
            ...(existingUser ? { _id: { $ne: existingUser._id } } : {}),
        });
        if (phoneOwner) {
            return next(
                new AppError(
                    "This phone number is already linked to another account.",
                    400
                )
            );
        }
    }

    const otp = generateOtp();
    const otpExpires = getOtpExpiryDate();

    let newUser;
    if (existingUser) {
        // Re-registration of an unverified account: overwrite the stale
        // credentials and OTP. Use .save() so the pre-save hook re-hashes.
        existingUser.password = password;
        existingUser.otp = otp;
        existingUser.otpExpires = otpExpires;
        if (normalizedPhone) existingUser.phoneNumber = normalizedPhone;
        if (username) existingUser.username = username;
        newUser = await existingUser.save();
    } else {
        newUser = await User.create({
            email,
            password,
            otp,
            otpExpires,
            phoneNumber: normalizedPhone || undefined,
            username: username || undefined,
            isVerified: false,
            provider: "local",
        });
    }

    // Ensure Customer enrichment record exists for this user
    try {
      await ensureCustomerRecord({ userId: newUser._id, email: newUser.email });
    } catch (err) {
      logger.warn("Customer record creation failed after registration", {
        userId: newUser._id,
        error: err.message,
      });
    }

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
                This code will expire in <strong>${otpExpiryMinutes()} minutes</strong>.
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
        // log for debugging, but do not crash the whole request. Put the real
        // reason IN the message string — a raw Error serializes to {} in
        // winston's JSON meta, so the actual SMTP failure would otherwise be
        // invisible in the Railway logs.
        logger.error(`Registration verification email failed: ${err?.message || err}`, {
            code: err?.code || err?.responseCode || null,
            response: err?.response || null,
        });
        mailError = err;
    }

    // WhatsApp OTP fan-out for users who supplied a phone at signup.
    const whatsAppResult = await trySendAuthWhatsAppOtp(newUser, otp, "register");

    const responseMessage = mailError
        ? "User registered successfully but verification email could not be sent. Please contact support."
        : whatsAppResult.sent
            ? "User registered successfully. Please verify your email with the OTP sent to your email and WhatsApp."
            : normalizedPhone
                ? "User registered successfully. Please verify your email with the OTP sent. WhatsApp delivery could not be confirmed."
                : "User registered successfully. Please verify your email with the OTP sent.";

    // always return 201 so client doesn’t see a 500 on mail failures
    res.status(201).json({
        status: "success",
        message: responseMessage,
        data: {
            _id: newUser._id,
            email: newUser.email,
            isVerified: newUser.isVerified,
        },
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
                <p>Hi ${user.username || "there"},</p>
                <p>Thank you for verifying your email address. Your Saga Elite account is now active.</p>
                <p>Explore our exclusive collections and enjoy limited‑edition fashion built for the bold.</p>
                <br/>
                <p>Happy shopping!<br/>The Saga Elite Team</p>
            `;

    try {
        await sendMail({
            email: user.email,
            subject: "Welcome to Saga Elite 🎉",
            html: buildEmailTemplate("Welcome to Saga Elite", welcomeBody),
        });
    } catch (err) {
        logger.error("Welcome email failed after OTP verification", { error: err });
    }

    await ensureWelcomeReward(user).catch((err) =>
        logger.warn("Welcome reward issuance failed", {
            userId: user._id,
            error: err?.message,
        })
    );

    try {
        await migrateGuestToUser(req.guestToken, user);
    } catch (err) {
        logger.warn("Guest migration on otpVerify failed", {
            userId: user._id,
            error: err.message,
        });
    }

    // Ensure Customer record exists even when no guest token was present
    try {
        await ensureCustomerRecord({ userId: user._id, email: user.email });
    } catch (err) {
        logger.warn("Customer record ensure on otpVerify failed", {
            userId: user._id,
            error: err.message,
        });
    }

    await trySendAuthWhatsApp(
        user,
        `Welcome to Saga Elite! Your account is now verified — explore our limited drops at any time.`,
        "welcome"
    );

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
                    <p>Hi ${user.username || "there"},</p>
                    <p>We received a request to resend your verification code for Saga Elite.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 28px; letter-spacing: 6px; font-weight: bold; color: #000;">
                            ${newOTP}
                        </span>
                    </div>
                    <p><strong>Note:</strong> This code is valid for the next ${otpExpiryMinutes()} minutes. Please do not share it with anyone.</p>
                    <p>If you didn’t request this, you can safely ignore this email.</p>
                `;

        await sendMail({
            email: user.email,
            subject: "Saga Elite – New Verification Code",
            html: buildEmailTemplate("Email Verification - New Code", resendBody),
        });

        await trySendAuthWhatsAppOtp(user, newOTP, "resend-signup-otp");

        res.status(200).json({
            status: "success",
            message: "OTP sent successfully.",
        });
    } catch (error) {
        // Surface the real reason in the server logs — the customer only sees a
        // generic message, but this is what actually diagnoses a broken SMTP
        // config (bad key, unverified sender, wrong host, connection refused).
        logger.error(`resendOTP email dispatch failed: ${error?.message || error}`, {
            email: user.email,
            code: error?.code || error?.responseCode || null,
            response: error?.response || null,
        });
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError("Error sending email, please try again.", 500));
    }
});

const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError("Please provide email and password", 400));
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        recordLoginAttempt({
            req,
            emailAttempted: email,
            success: false,
            failureReason: "user_not_found",
        });
        return next(new AppError("Incorrect email or password", 401));
    }

    const isPasswordCorrect = await user.correctPassword(password, user.password);

    if (!isPasswordCorrect) {
        recordLoginAttempt({
            req,
            userId: user._id,
            emailAttempted: email,
            success: false,
            failureReason: "wrong_password",
        });
        return next(new AppError("Incorrect email or password", 401));
    }

    if (!user.isVerified) {
        recordLoginAttempt({
            req,
            userId: user._id,
            emailAttempted: email,
            success: false,
            failureReason: "not_verified",
        });
        return next(new AppError("User not verified. Please verify your email first.", 401));
    }

    if (!user.isActive) {
        recordLoginAttempt({
            req,
            userId: user._id,
            emailAttempted: email,
            success: false,
            failureReason: "deactivated",
        });
        return next(new AppError("Your account has been deactivated. Please contact support.", 403));
    }

    // Super-admin reset this account's password — block normal login until
    // they rotate it. We log the attempt as a successful credential check
    // (because the password DID match), but withhold the session token.
    if (user.mustChangePassword) {
        recordLoginAttempt({
            req,
            userId: user._id,
            emailAttempted: email,
            success: true,
        });
        return res.status(200).json({
            status: "must_change_password",
            success: false,
            message:
                "A super admin reset your password. Use the forgot-password flow to set a new one before signing in.",
            email: user.email,
        });
    }

    // Admin 2FA: if admin role AND twoFactorEnabled, send OTP (no token)
    if (isAdminRole(user.role) && user.twoFactorEnabled) {
        const twoFactorOtp = generateOtp(6);
        user.twoFactorOtp = twoFactorOtp;
        user.twoFactorOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save({ validateBeforeSave: false });

        const subject = "Saga Elite — Two-Factor Authentication Code";
        const message = `Your 2FA code is: ${twoFactorOtp}\nValid for 10 minutes.`;
        try {
            await sendMail({
                email: user.email,
                subject,
                message,
                html: buildEmailTemplate(subject, message),
            });
        } catch (error) {
            user.twoFactorOtp = undefined;
            user.twoFactorOtpExpires = undefined;
            await user.save({ validateBeforeSave: false });
            return next(new AppError("Error sending OTP email, please try again.", 500));
        }

        recordLoginAttempt({
            req,
            userId: user._id,
            emailAttempted: email,
            success: true,
        });
        return res.status(200).json({
            status: "two_factor_required",
            success: false,
            email: user.email,
        });
    }

    recordLoginAttempt({
        req,
        userId: user._id,
        emailAttempted: email,
        success: true,
    });

    // Update Customer session tracking
    try {
        await Customer.findOneAndUpdate(
            { userId: user._id },
            { $set: { lastSessionAt: new Date() }, $inc: { sessionCount: 1 } }
        );
    } catch (err) {
        logger.warn("Customer session update failed on login", {
            userId: user._id,
            error: err.message,
        });
    }

    createSendToken(user, 200, res, "Login successful");
});


const logout = catchAsync(async (req, res, next) => {
    res.cookie("token", "loggedout", {
        expires: new Date(0),
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
            // 400 (validation), not 401: the user IS authenticated — a wrong
            // current password must not be treated as a session failure.
            return next(new AppError("Current password is incorrect", 400));
        }
    }

    user.password = newPassword;
    // If this user was forced to rotate (super-admin reset), they've now done so.
    user.mustChangePassword = false;

    await user.save();

    const passwordChangedBody = `
                <p>Your password was successfully changed.</p>
                <p>If this wasn't you, please contact support immediately.</p>
            `;

    try {
        await sendMail({
            email: user.email,
            subject: "Saga Elite – Password Updated",
            html: buildEmailTemplate("Password Updated", passwordChangedBody),
        });
    } catch (err) {
        logger.error("Password change confirmation email failed", { error: err });
    }

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
                    <p>This code is valid for <strong>${otpExpiryMinutes()} minutes</strong>.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                `;

        await sendMail({
            email: user.email,
            subject: "Saga Elite – Password Reset Code",
            html: buildEmailTemplate("Password Reset Request", resetBody),
        });

        await trySendAuthWhatsAppOtp(user, otp, "forgot-password");

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
                <p>This code is valid for <strong>${otpExpiryMinutes()} minutes</strong>.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `;

    try {
        await sendMail({
            email: user.email,
            subject: "Saga Elite – Password Reset Code",
            html: buildEmailTemplate("Password Reset Request", resetBody2),
        });
    } catch (err) {
        user.resetPasswordOtp = undefined;
        user.resetPasswordOtpExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError("Failed to send email. Try again later.", 500));
    }

    await trySendAuthWhatsAppOtp(user, otp, "resend-reset-otp");

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

    if (String(newPassword).length < 8) {
        return next(new AppError("New password must be at least 8 characters long", 400));
    }

    const user = await User.findOne({email});

    if(!user || !user.resetPasswordOtp){
        return next(new AppError("User is not found",404));
    }

    if(user.resetPasswordOtp.toString()!== otp.toString()){
        return next(new AppError("Invalid reset code",400));
    }
    if(user.resetPasswordOtpExpires && new Date(user.resetPasswordOtpExpires).getTime() < Date.now()){
        return next(new AppError("Code is expired",400));
    }

    user.password = newPassword;
    // Clear the super-admin-forced rotation flag. Without this, login() keeps
    // returning `must_change_password` forever — even after a successful reset —
    // so an admin whose password was reset by a super admin can never sign in.
    // This is the root-cause fix for "Admin Reset Password not working".
    user.mustChangePassword = false;

    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;

    await user.save();

    const resetSuccessBody = `
                <p>Your password was successfully updated.</p>
                <p>You can now log in with your new password.</p>
            `;

    try {
        await sendMail({
            email: user.email,
            subject: "Saga Elite – Password Changed Successfully",
            html: buildEmailTemplate("Password Changed", resetSuccessBody),
        });
    } catch (err) {
        logger.error("Password reset confirmation email failed", { error: err });
    }

    res.status(200).json({
        status: "success",
        success: true,
        message: "Password reset successful. Please login."
    });
});


const checkAuth = catchAsync(async (req, res, next) => {
    const user = req.userInfo;
    if (!user) {
        return res.status(200).json({
            status: "success",
            success: false,
            message: "No authenticated user",
            data: {
                user: null,
            },
        });
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

    // Cryptographically random temp password (16 base64url chars + complexity suffix)
    const temporaryPassword = crypto.randomBytes(12).toString("base64url") + "S1!";

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

    try {
        await migrateGuestToUser(req.guestToken, newUser);
    } catch (err) {
        logger.warn("Guest migration on registerGuest failed", {
            userId: newUser._id,
            error: err.message,
        });
    }

    // Ensure Customer record exists even without guest token
    try {
        await ensureCustomerRecord({ userId: newUser._id, email: newUser.email });
    } catch (err) {
        logger.warn("Customer record ensure on registerGuest failed", {
            userId: newUser._id,
            error: err.message,
        });
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

const verifyTwoFactor = catchAsync(async (req, res, next) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return next(new AppError("Email and OTP are required", 400));
    }

    const user = await User.findOne({ email }).select("+twoFactorOtp");
    if (!user) {
        return next(new AppError("User not found", 404));
    }

    if (!user.twoFactorOtp || !user.twoFactorOtpExpires) {
        return next(new AppError("No active 2FA session. Please log in again.", 400));
    }

    if (user.twoFactorOtpExpires < Date.now()) {
        user.twoFactorOtp = undefined;
        user.twoFactorOtpExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError("OTP has expired. Please request a new one.", 400));
    }

    if (user.twoFactorOtp !== otp) {
        return next(new AppError("Invalid OTP", 401));
    }

    user.twoFactorOtp = undefined;
    user.twoFactorOtpExpires = undefined;
    await user.save({ validateBeforeSave: false });

    createSendToken(user, 200, res, "Two-factor authentication successful");
});

const resendTwoFactorOtp = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return next(new AppError("Email is required", 400));
    }

    const user = await User.findOne({ email });
    if (!user) {
        return next(new AppError("User not found", 404));
    }

    if (!isAdminRole(user.role) || !user.twoFactorEnabled) {
        return next(new AppError("2FA not enabled for this account", 400));
    }

    const twoFactorOtp = generateOtp(6);
    user.twoFactorOtp = twoFactorOtp;
    user.twoFactorOtpExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const subject = "Saga Elite — Two-Factor Authentication Code (Resend)";
    const message = `Your 2FA code is: ${twoFactorOtp}\nValid for 10 minutes.`;
    try {
        await sendMail({
            email: user.email,
            subject,
            message,
            html: buildEmailTemplate(subject, message),
        });
    } catch (error) {
        user.twoFactorOtp = undefined;
        user.twoFactorOtpExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError("Error sending OTP email, please try again.", 500));
    }

    res.status(200).json({
        status: "success",
        message: "OTP resent successfully",
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
    verifyResetOtp,
    resetPassword,
    logout,
    checkAuth,
    checkGuest,
    registerGuest,
    verifyTwoFactor,
    resendTwoFactorOtp,
};
