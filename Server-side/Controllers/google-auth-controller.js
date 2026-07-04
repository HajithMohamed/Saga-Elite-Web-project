const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const User = require("../Models/User");
const createSendToken = require("../Utils/create-send-token");
const sendMail = require("../Utils/send-mail");
const buildEmailTemplate = require("../Utils/email-template");
const Customer = require("../Models/Customer");
const { ensureCustomerRecord } = require("../Services/migration-service");
const { isAdminRole } = require("../Utils/admin-roles");
const logger = require("../Utils/logger");

// ── shared helper: exchange Google access token for profile ──
const verifyGoogleToken = async (accessToken, next) => {
    if (!accessToken) {
        return next(new AppError("Google access token is required", 400));
    }

    const googleRes = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!googleRes.ok) {
        return next(new AppError("Failed to verify Google token", 400));
    }

    const profile = await googleRes.json();

    if (!profile.email_verified) {
        return next(new AppError("Google email is not verified", 400));
    }

    return profile;
};

// ── Google Auth (consolidated sign-in & sign-up) ──
const googleAuth = catchAsync(async (req, res, next) => {
    const profile = await verifyGoogleToken(req.body.accessToken, next);
    if (!profile) return; // error already sent by verifyGoogleToken

    const { email, sub, picture } = profile;

    let user = await User.findOne({ email });

    if (user) {
        // Block ALL admin roles (admin, super_admin, sub_admin) from Google
        // sign-in — admins must use email/password so the 2FA gate applies.
        if (isAdminRole(user.role)) {
            return next(new AppError("Admin accounts cannot use Google sign-in", 403));
        }
        
        // Update google id and picture if not present
        if (!user.googleId || !user.profilePicture) {
            user.googleId = sub || user.googleId;
            user.profilePicture = picture || user.profilePicture;
            await user.save({ validateBeforeSave: false });
        }

        // Update Customer session tracking
        try {
            await Customer.findOneAndUpdate(
                { userId: user._id },
                { $set: { lastSessionAt: new Date() }, $inc: { sessionCount: 1 } }
            );
        } catch (err) {
            logger.warn("Customer session update failed on Google login", {
                userId: user._id,
                error: err.message,
            });
        }

        return createSendToken(user, 200, res, "Signed in successfully");
    }

    // Creating new user
    user = await User.create({
        email,
        googleId: sub,
        profilePicture: picture,
        provider: "google",
        isVerified: true,
    });

    // Ensure Customer enrichment record exists
    try {
        await ensureCustomerRecord({ userId: user._id, email: user.email });
    } catch (err) {
        logger.warn("Customer record creation failed after Google sign-up", {
            userId: user._id,
            error: err.message,
        });
    }

    // send welcome email (non-blocking)
    const welcomeBody = `
        <p>Hi there,</p>
        <p>Thank you for joining <strong>Saga Elite</strong> — Limited Edition Fashion built for the bold.</p>
        <p>Your account has been created successfully using Google.</p>
        <p>Explore our exclusive collections and enjoy limited‑edition fashion.</p>
        <br/>
        <p>Happy shopping!<br/>The Saga Elite Team</p>
    `;

    // Fire-and-forget: the account is already created and the user is being
    // signed in — the welcome email must never block (or fail) the signup
    // response. Awaiting it here meant a slow/dead SMTP hung the whole Google
    // sign-up request and the browser showed a "network error".
    sendMail({
        email: user.email,
        subject: "Welcome to Saga Elite 🎉",
        html: buildEmailTemplate("Welcome to Saga Elite", welcomeBody),
    }).catch((err) => {
        logger.error("Google sign-up welcome email failed", { error: err });
    });

    return createSendToken(user, 201, res, "Account created successfully");
});

module.exports = {
    googleAuth,
};
