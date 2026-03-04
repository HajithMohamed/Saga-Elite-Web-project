const signToken = require("./signin-token");

/**
 * Signs a JWT, sets it as an httpOnly cookie, and sends a JSON response.
 * Shared by auth-controller and google-auth-controller so the logic
 * lives in exactly one place.
 */
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

    // strip sensitive fields before sending to the client
    user.password = undefined;
    user.passwordConfirm = undefined;
    user.otp = undefined;

    res.status(statusCode).json({
        status: "success",
        message,
        token,
        data: { user },
    });
};

module.exports = createSendToken;
