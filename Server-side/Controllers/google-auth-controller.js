const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const User = require("../Models/User");
const createSendToken = require("../Utils/create-send-token");
const sendMail = require("../Utils/send-mail");
const buildEmailTemplate = require("../Utils/email-template");
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

// ── Google Sign-In (existing users only) ──
const googleSignIn = catchAsync(async (req, res, next) => {
    const profile = await verifyGoogleToken(req.body.accessToken, next);
    if (!profile) return; // error already sent by verifyGoogleToken

    const existingUser = await User.findOne({ email: profile.email });

    if (!existingUser) {
        return next(
            new AppError(
                "No account found with this email. Please sign up first.",
                404
            )
        );
    }

    // block admin / superadmin from using Google sign-in
    if (existingUser.role === "admin" || existingUser.role === "superadmin") {
        return next(
            new AppError("Admin accounts cannot use Google sign-in", 403)
        );
    }

    return createSendToken(existingUser, 200, res, "Signed in successfully");
});

// ── Google Sign-Up (new users only — sends welcome email) ──
const googleSignUp = catchAsync(async (req, res, next) => {
    const profile = await verifyGoogleToken(req.body.accessToken, next);
    if (!profile) return;

    const { email, sub, picture } = profile;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        return next(
            new AppError(
                "An account with this email already exists. Please sign in instead.",
                400
            )
        );
    }

    const newUser = await User.create({
        email,
        googleId: sub,
        profilePicture: picture,
        provider: "google",
        isVerified: true,
    });

    // send welcome email (non-blocking — account creation still succeeds on mail failure)
    const welcomeBody = `
        <p>Hi there,</p>
        <p>Thank you for joining <strong>Saga Elite</strong> — Limited Edition Fashion built for the bold.</p>
        <p>Your account has been created successfully using Google.</p>
        <p>Explore our exclusive collections and enjoy limited‑edition fashion.</p>
        <br/>
        <p>Happy shopping!<br/>The Saga Elite Team</p>
    `;

    try {
        await sendMail({
            email: newUser.email,
            subject: "Welcome to Saga Elite 🎉",
            html: buildEmailTemplate("Welcome to Saga Elite", welcomeBody),
        });
    } catch (err) {
        logger.error("Google sign-up welcome email failed", { error: err });
    }

    return createSendToken(newUser, 201, res, "Account created successfully");
});

module.exports = {
    googleSignIn,
    googleSignUp,
};
