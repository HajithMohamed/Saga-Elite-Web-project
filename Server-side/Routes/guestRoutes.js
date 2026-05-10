const express = require("express");
const { contactLimiter } = require("../Middlewares/rateLimitinMiddleware");
const {
  identifyGuest,
  getGuestMe,
  appendActivity,
  getAddresses,
  upsertAddress,
  sendOtp,
  verifyOtp,
  unsubscribe,
  getGuestManualPayments,
} = require("../Controllers/guestController");

const router = express.Router();

// Identify / track
router.post("/identify", identifyGuest);
router.get("/me", getGuestMe);
router.post("/activity", appendActivity);

// Pending manual payments owned by the guest cookie (Fix #1).
router.get("/manual-payments", getGuestManualPayments);

// Addresses
router.get("/addresses", getAddresses);
router.post("/addresses", upsertAddress);

// OTP for guest manual payments — rate-limited to deter abuse.
router.post("/otp/send", contactLimiter, sendOtp);
router.post("/otp/verify", contactLimiter, verifyOtp);

// One-click unsubscribe from promo emails (GET so it works from email link).
router.get("/unsubscribe", unsubscribe);

module.exports = router;
