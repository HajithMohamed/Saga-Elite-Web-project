const crypto = require("crypto");

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const COOKIE_NAME = "guestToken";

const guestTrackingMiddleware = (req, res, next) => {
  let token = req.cookies && req.cookies[COOKIE_NAME];

  if (!token || typeof token !== "string" || token.length < 8) {
    token = crypto.randomUUID();
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      // In production the SPA (Netlify) and API (Render) are on different
      // origins, so the cookie must be SameSite=None; Secure to survive
      // cross-site requests — matching the auth token cookie behaviour.
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: ONE_YEAR_MS,
    });
  }

  req.guestToken = token;
  next();
};

module.exports = guestTrackingMiddleware;
module.exports.GUEST_COOKIE_NAME = COOKIE_NAME;
