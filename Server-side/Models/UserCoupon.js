const mongoose = require("mongoose");

const userCouponSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    source: {
      type: String,
      enum: [
        "first_order",
        "cart_recovery",
        "vip_tier",
        "review_reward",
        "birthday",
        "referral",
        "drop_launch",
        "mystery_reward",
        "manual",
      ],
      default: "manual",
      index: true,
    },
    sourceRef: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    redeemed: {
      type: Boolean,
      default: false,
      index: true,
    },
    redeemedAt: {
      type: Date,
      default: null,
    },
    redeemedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userCouponSchema.index({ user: 1, coupon: 1 }, { unique: true });
userCouponSchema.index({ user: 1, source: 1, redeemed: 1, expiresAt: 1 });

userCouponSchema.virtual("isExpired").get(function () {
  return Boolean(this.expiresAt && new Date(this.expiresAt).getTime() < Date.now());
});

userCouponSchema.virtual("isAvailable").get(function () {
  return !this.redeemed && !this.isExpired;
});

module.exports = mongoose.model("UserCoupon", userCouponSchema);
