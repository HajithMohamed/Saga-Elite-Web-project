const validator = require("validator");
const Guest = require("../Models/Guest");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const generateOtp = require("../Utils/generate-otp");
const sendEmail = require("../Utils/send-mail");
const { sendWhatsAppMessage } = require("../Utils/whatsapp-service");
const {
  isValidSriLankanMobile,
  normalizeSriLankanMobile,
} = require("../Utils/phone-validator");
const logger = require("../Utils/logger");

const OTP_TTL_MS = 10 * 60 * 1000;

const sanitizeGuest = (guest) => {
  if (!guest) return null;
  const obj = guest.toObject ? guest.toObject() : guest;
  delete obj.otp;
  delete obj.otpExpiresAt;
  return obj;
};

const addressMatches = (a, b) =>
  String(a?.street || "").trim().toLowerCase() ===
    String(b?.street || "").trim().toLowerCase() &&
  String(a?.postalCode || "").trim().toLowerCase() ===
    String(b?.postalCode || "").trim().toLowerCase();

const identifyGuest = catchAsync(async (req, res, next) => {
  const token = req.guestToken;
  if (!token) {
    return next(new AppError("Guest token missing", 400));
  }

  // Find existing guest by token. Email is required by schema, so if a guest
  // has only a token and no email yet, we don't create a Mongo doc — we just
  // echo the token back. The doc is created on first email capture (checkout
  // or OTP send).
  const guest = await Guest.findOne({ guestToken: token });

  return res.status(200).json({
    success: true,
    data: {
      guestToken: token,
      guest: sanitizeGuest(guest),
    },
  });
});

const getGuestMe = catchAsync(async (req, res) => {
  const token = req.guestToken;
  const guest = token ? await Guest.findOne({ guestToken: token }) : null;

  return res.status(200).json({
    success: true,
    data: {
      guestToken: token || null,
      guest: sanitizeGuest(guest),
    },
  });
});

const appendActivity = catchAsync(async (req, res, next) => {
  const token = req.guestToken;
  const { type, meta } = req.body || {};

  if (!token) {
    return next(new AppError("Guest token missing", 400));
  }
  if (!type || typeof type !== "string") {
    return next(new AppError("Activity type is required", 400));
  }

  const guest = await Guest.findOne({ guestToken: token });
  if (!guest) {
    // No email yet — no doc to track on. Soft 200 so the client doesn't retry.
    return res.status(200).json({ success: true, data: { tracked: false } });
  }

  guest.activityLog.push({ type, meta, at: new Date() });
  guest.lastUsedAt = new Date();
  await guest.save();

  return res.status(200).json({ success: true, data: { tracked: true } });
});

const getAddresses = catchAsync(async (req, res, next) => {
  const email = String(req.query.email || "").trim().toLowerCase();
  if (!email || !validator.isEmail(email)) {
    return next(new AppError("Valid email is required", 400));
  }

  const guest = await Guest.findOne({ email });
  return res.status(200).json({
    success: true,
    data: { addresses: guest?.addresses || [] },
  });
});

const upsertAddress = catchAsync(async (req, res, next) => {
  const { email, address } = req.body || {};
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail || !validator.isEmail(normalizedEmail)) {
    return next(new AppError("Valid email is required", 400));
  }
  if (!address || !address.street || !address.city || !address.postalCode) {
    return next(new AppError("Address must include street, city and postalCode", 400));
  }

  const guest = await Guest.findOneAndUpdate(
    { email: normalizedEmail },
    {
      $setOnInsert: { email: normalizedEmail, guestToken: req.guestToken },
      $set: { lastUsedAt: new Date() },
    },
    { upsert: true, new: true }
  );

  if (!guest.addresses.some((a) => addressMatches(a, address))) {
    guest.addresses.push(address);
    await guest.save();
  }

  return res.status(200).json({
    success: true,
    data: { addresses: guest.addresses },
  });
});

// ── OTP for guest manual payments ─────────────────────────────────
const sendOtp = catchAsync(async (req, res, next) => {
  const { email, phone, name } = req.body || {};
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail || !validator.isEmail(normalizedEmail)) {
    return next(new AppError("Valid email is required", 400));
  }

  const normalizedPhone = phone ? normalizeSriLankanMobile(phone) : null;
  if (phone && !normalizedPhone) {
    return next(
      new AppError("Provide a valid Sri Lankan mobile number (e.g. 0771234567)", 400)
    );
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  const guest = await Guest.findOneAndUpdate(
    { email: normalizedEmail },
    {
      $set: {
        otp: code,
        otpExpiresAt: expiresAt,
        verified: false,
        lastUsedAt: new Date(),
        ...(normalizedPhone ? { phone: normalizedPhone } : {}),
        ...(name ? { name: String(name).trim() } : {}),
      },
      $setOnInsert: { email: normalizedEmail, guestToken: req.guestToken },
    },
    { upsert: true, new: true }
  );

  // Email — best effort, but report failure since email is required channel.
  try {
    await sendEmail({
      email: normalizedEmail,
      subject: "Your Saga Elite verification code",
      text: `Your verification code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your Saga Elite verification code is:</p>
             <p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${code}</p>
             <p>This code expires in 10 minutes.</p>`,
    });
  } catch (err) {
    logger.error("Guest OTP email failed", { error: err.message, email: normalizedEmail });
    return next(new AppError("Could not send verification email. Try again.", 502));
  }

  // WhatsApp — fire and forget; no-op if not configured.
  if (normalizedPhone) {
    sendWhatsAppMessage({
      to: normalizedPhone,
      message: `Saga Elite: your verification code is ${code}. Expires in 10 minutes.`,
    }).catch((err) =>
      logger.error("Guest OTP WhatsApp failed", { error: err.message })
    );
  }

  return res.status(200).json({
    success: true,
    message: "OTP sent. Check your email and WhatsApp.",
    data: { guestId: guest._id, expiresAt },
  });
});

const verifyOtp = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body || {};
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail || !validator.isEmail(normalizedEmail)) {
    return next(new AppError("Valid email is required", 400));
  }
  if (!otp || !/^\d{4}$/.test(String(otp).trim())) {
    return next(new AppError("Valid 4-digit OTP is required", 400));
  }

  const guest = await Guest.findOne({ email: normalizedEmail });
  if (!guest || !guest.otp || !guest.otpExpiresAt) {
    return next(new AppError("No OTP requested for this email", 400));
  }
  if (guest.otpExpiresAt.getTime() < Date.now()) {
    return next(new AppError("OTP has expired. Request a new one.", 400));
  }
  if (String(guest.otp) !== String(otp).trim()) {
    return next(new AppError("Incorrect OTP", 400));
  }

  guest.verified = true;
  guest.otp = undefined;
  guest.otpExpiresAt = undefined;
  guest.lastUsedAt = new Date();
  if (!guest.guestToken && req.guestToken) {
    guest.guestToken = req.guestToken;
  }
  await guest.save();

  return res.status(200).json({
    success: true,
    message: "Guest verified",
    data: { verified: true },
  });
});

// ── Unsubscribe from promo emails ──────────────────────────────────
const unsubscribe = catchAsync(async (req, res) => {
  const token = String(req.query.token || "").trim();
  if (!token) {
    return res.status(400).send("<h1>Invalid unsubscribe link</h1>");
  }

  await Guest.updateOne(
    { guestToken: token },
    { $set: { "preferences.promoOptIn": false } }
  );

  return res.status(200).send(`<!doctype html>
<html><head><meta charset="utf-8"><title>Unsubscribed</title>
<style>body{font-family:system-ui,sans-serif;max-width:480px;margin:80px auto;padding:24px;text-align:center;color:#1a1a1a;}
h1{color:#0f172a;}p{color:#475569;}</style></head>
<body><h1>You're unsubscribed</h1>
<p>You won't receive promotional emails from Saga Elite anymore.</p>
<p>You can still place orders and receive order-related notifications.</p></body></html>`);
});

module.exports = {
  identifyGuest,
  getGuestMe,
  appendActivity,
  getAddresses,
  upsertAddress,
  sendOtp,
  verifyOtp,
  unsubscribe,
};
