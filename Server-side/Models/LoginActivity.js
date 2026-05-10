const mongoose = require("mongoose");

// One row per authentication attempt — both successes and failures. Used by
// the admin user-detail page to surface "where is this account being used"
// and to flag suspicious patterns (new device, new IP, repeated failures).
const loginActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Failed attempts may not resolve to a user (wrong email) — store
      // emailAttempted instead. So userId is optional.
      default: null,
      index: true,
    },
    emailAttempted: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },
    success: {
      type: Boolean,
      required: true,
      index: true,
    },
    failureReason: {
      type: String,
      enum: [
        null,
        "user_not_found",
        "wrong_password",
        "not_verified",
        "deactivated",
        "rate_limited",
      ],
      default: null,
    },
    provider: {
      type: String,
      enum: ["local", "google", "facebook"],
      default: "local",
    },
    ip: {
      type: String,
      trim: true,
      default: null,
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    // Coarse device hint parsed from UA string. Avoids shipping a heavy parser
    // dependency — admins just need "iPhone vs Chrome on Mac" granularity.
    deviceHint: {
      type: String,
      trim: true,
      maxlength: 60,
      default: null,
    },
  },
  { timestamps: true }
);

// Auto-purge after 90 days. Audit trail is meaningful for recent escalations
// only; older logs become noise and storage cost.
loginActivitySchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 }
);

loginActivitySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("LoginActivity", loginActivitySchema);
