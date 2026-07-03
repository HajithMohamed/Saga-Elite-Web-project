const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 40,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    discountType: {
      type: String,
      enum: ["percent", "fixed"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxUses: {
      type: Number,
      default: null, // null = unlimited
      min: 0,
    },
    perUserLimit: {
      type: Number,
      default: null,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
      min: 0,
    },
    firstOrderOnly: {
      type: Boolean,
      default: false,
      index: true,
    },
    stackable: {
      type: Boolean,
      default: false,
    },
    autoApply: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPersonalized: {
      type: Boolean,
      default: false,
      index: true,
    },
    eligibleMemberships: {
      type: [String],
      enum: ["standard", "elite", "rare", "legend", "vip"],
      default: [],
    },
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    applicableCategories: {
      type: [String],
      default: [],
    },
    startsAt: {
      type: Date,
      default: null,
    },
    endsAt: {
      type: Date,
      default: null,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    issuedFor: {
      type: String,
      enum: [
        "review_reward",
        "vip",
        "vip_tier",
        "campaign",
        "manual",
        "referral",
        "birthday",
        "first_order",
        "cart_recovery",
        "drop_launch",
        "welcome",
        "loyalty",
        "flash_sale",
      ],
      default: "manual",
    },
    maxDailyUses: {
      type: Number,
      default: null,
      min: 1,
    },
    userGroups: {
      type: [String],
      default: [],
    },
    requiredProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    requiredCategories: {
      type: [String],
      default: [],
    },
    excludedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    excludedCategories: {
      type: [String],
      default: [],
    },
    stackablePriority: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

couponSchema.virtual("isExhausted").get(function () {
  if (this.maxUses == null) return false;
  return this.usedCount >= this.maxUses;
});

couponSchema.virtual("isLive").get(function () {
  if (!this.isActive) return false;
  if (this.maxUses != null && this.usedCount >= this.maxUses) return false;
  const now = Date.now();
  if (this.startsAt && new Date(this.startsAt).getTime() > now) return false;
  if (this.endsAt && new Date(this.endsAt).getTime() < now) return false;
  return true;
});

const Coupon = mongoose.model("Coupon", couponSchema);
module.exports = Coupon;
