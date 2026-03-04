const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const User = require("../Models/User");
const createSendToken = require("../Utils/create-send-token");

const googleAuth = catchAsync(async (req, res, next) => {
    const { accessToken } = req.body;

    if (!accessToken) {
        return next(new AppError("Google access token is required", 400));
    }

    // exchange access token for user profile via Google's userinfo endpoint
    const googleRes = await fetch(
        `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`
    );

    if (!googleRes.ok) {
        return next(new AppError("Failed to verify Google token", 400));
    }

    const { email, sub, picture, email_verified } = await googleRes.json();

    if (!email_verified) {
        return next(new AppError("Google email is not verified", 400));
    }

    const existingUser = await User.findOne({ email });

    // account registered with email & password — sign them in directly
    if (existingUser && existingUser.provider === "local") {
        return createSendToken(existingUser, 200, res, "Signed in successfully");
    }

    // existing Google user — sign in
    if (existingUser && existingUser.provider === "google") {
        return createSendToken(existingUser, 200, res, "Signed in successfully");
    }

    // new user — create Google account
    const newUser = await User.create({
        email,
        googleId: sub,
        profilePicture: picture,
        provider: "google",
        isVerified: true,
    });

    return createSendToken(newUser, 201, res, "Account created successfully");
});

module.exports = {
    googleAuth,
};