const mongoose = require("mongoose");

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/.+@.+\..+/, "Invalid email address"],
    },
    subscribedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    source: { type: String, default: "homepage" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NewsletterSubscriber", subscriberSchema);
