const mongoose = require("mongoose");

const guestSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: [require("validator").isEmail, "Provide a valid email address"],
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    orderCount: {
      type: Number,
      default: 0,
    },
    isRegistered: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for quick lookup by email
guestSchema.index({ email: 1 });

module.exports = mongoose.model("Guest", guestSchema);