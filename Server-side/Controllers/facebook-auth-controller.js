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

// Mirror of google-auth-controller. Two Facebook-specific differences:
//   1. We MUST verify the access token via Graph /debug_token before
//      trusting the profile, because /me will happily return data for
//      any valid token — including tokens minted for a different app.
//      /debug_token's app_id check blocks token-substitution attacks.
//   2. Facebook accounts can lack an email (phone-only signups). We
//      reject in that case rather than fabricating a placeholder
//      address that breaks downstream email flows.

const isFacebookConfigured = () =>
  Boolean(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET);

// Step 1 — confirm the token is for our app and still valid.
const debugFacebookToken = async (accessToken) => {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  const appAccessToken = `${appId}|${appSecret}`;

  const url = `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(
    accessToken
  )}&access_token=${encodeURIComponent(appAccessToken)}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new AppError("Could not verify Facebook token", 401);
  }
  const json = await res.json();
  const data = json?.data || {};

  if (data.is_valid !== true) {
    throw new AppError("Facebook token is invalid or expired", 401);
  }
  if (String(data.app_id) !== String(appId)) {
    throw new AppError("Facebook token was issued for a different app", 401);
  }
  return data;
};

// Step 2 — fetch the profile.
const fetchFacebookProfile = async (accessToken) => {
  const url =
    "https://graph.facebook.com/me?fields=id,name,email,picture.type(large)" +
    `&access_token=${encodeURIComponent(accessToken)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new AppError("Failed to fetch Facebook profile", 400);
  }
  return res.json();
};

const facebookAuth = catchAsync(async (req, res, next) => {
  if (!isFacebookConfigured()) {
    return next(
      new AppError(
        "Facebook sign-in is not configured on this server.",
        503
      )
    );
  }

  const { accessToken } = req.body || {};
  if (!accessToken) {
    return next(new AppError("Facebook access token is required", 400));
  }

  await debugFacebookToken(accessToken);
  const profile = await fetchFacebookProfile(accessToken);

  const email = profile?.email;
  const fbId = profile?.id;
  const name = profile?.name || "";
  const picture = profile?.picture?.data?.url || null;

  if (!email) {
    return next(
      new AppError(
        "Your Facebook account does not have an email address. Please add one in Facebook settings, or sign up with email and password instead.",
        400
      )
    );
  }
  if (!fbId) {
    return next(new AppError("Facebook profile id was missing from the response.", 400));
  }

  let user = await User.findOne({ email });

  if (user) {
    // Same admin guard as Google — admins (all roles) must use
    // email/password so the 2FA gate applies. isAdminRole covers
    // admin, super_admin and sub_admin.
    if (isAdminRole(user.role)) {
      return next(
        new AppError("Admin accounts cannot use Facebook sign-in", 403)
      );
    }

    // Backfill facebookId + picture on the existing record so subsequent
    // sign-ins skip the lookup. We do NOT change `provider` because the
    // first-mover signup channel is the source of truth for analytics
    // (e.g. a user who originally signed up with Google stays attributed
    // to Google even after they later use Facebook).
    let mutated = false;
    if (!user.facebookId) {
      user.facebookId = fbId;
      mutated = true;
    }
    if (!user.profilePicture && picture) {
      user.profilePicture = picture;
      mutated = true;
    }
    if (mutated) {
      await user.save({ validateBeforeSave: false });
    }

    // Update Customer session tracking
    try {
      await Customer.findOneAndUpdate(
        { userId: user._id },
        { $set: { lastSessionAt: new Date() }, $inc: { sessionCount: 1 } }
      );
    } catch (err) {
      logger.warn("Customer session update failed on Facebook login", {
        userId: user._id,
        error: err.message,
      });
    }

    return createSendToken(user, 200, res, "Signed in successfully");
  }

  // New user — create with provider: "facebook".
  user = await User.create({
    email,
    name: name || undefined,
    facebookId: fbId,
    profilePicture: picture,
    provider: "facebook",
    isVerified: true,
  });

  // Ensure Customer enrichment record exists
  try {
    await ensureCustomerRecord({ userId: user._id, email: user.email });
  } catch (err) {
    logger.warn("Customer record creation failed after Facebook sign-up", {
      userId: user._id,
      error: err.message,
    });
  }

  // Welcome email (non-blocking; mirrors Google flow).
  const welcomeBody = `
    <p>Hi ${name ? name.split(" ")[0] : "there"},</p>
    <p>Thank you for joining <strong>Saga Elite</strong> — Limited Edition Fashion built for the bold.</p>
    <p>Your account has been created using Facebook.</p>
    <p>Explore our exclusive drops and enjoy limited-edition fashion.</p>
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
    logger.error("Facebook sign-up welcome email failed", {
      error: err?.message || String(err),
    });
  }

  return createSendToken(user, 201, res, "Account created successfully");
});

module.exports = {
  facebookAuth,
};
