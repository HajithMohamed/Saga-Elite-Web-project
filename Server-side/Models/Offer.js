const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    badgeText: {
      type: String,
      trim: true,
      maxlength: 60,
      default: "",
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "clearance",
        "tier-discount",
        "aging_stock",
        "new_product",
        "seasonal",
        "flash",
        "percentage_discount",
        "fixed_amount",
        "category_discount",
        "product_discount",
        "buy_x_get_y",
        "cart_value",
        "seasonal_campaign",
      ],
      required: true,
    },
    discountPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    discountAmount: {
      type: Number,
      min: 0,
      default: null,
    },
    minCartValue: {
      type: Number,
      min: 0,
      default: null,
    },
    triggerProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    rewardProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    rewardQuantity: {
      type: Number,
      min: 1,
      default: 1,
    },
    triggerQuantity: {
      type: Number,
      min: 1,
      default: 1,
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    applicableCategories: {
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
    maxApplicationsPerUser: {
      type: Number,
      default: null,
    },
    maxApplicationsTotal: {
      type: Number,
      default: null,
    },
    bannerImage: {
      type: String,
      default: null,
    },
    themeColor: {
      type: String,
      default: null,
    },
    campaignLandingPage: {
      type: String,
      default: null,
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
    showOnHomepage: {
      type: Boolean,
      default: false,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isSystemGenerated: {
      type: Boolean,
      default: false,
    },
    systemKey: {
      type: String,
      trim: true,
      default: null,
    },
    appliesToLeastSellingItems: {
      type: Boolean,
      default: false,
    },
    customerClassificationDiscounts: {
      type: Map,
      of: {
        type: Number,
        min: 0,
        max: 100,
      },
      default: {},
    },
    estimatedMarginAfterDiscount: {
      type: Number,
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

offerSchema.index({ type: 1 });
offerSchema.index({ showOnHomepage: 1, displayOrder: 1 });
offerSchema.index(
  { systemKey: 1 },
  {
    unique: true,
    partialFilterExpression: { systemKey: { $type: "string" } },
  }
);

offerSchema.virtual("isLive").get(function () {
  if (!this.isActive) return false;
  const now = Date.now();
  if (this.startsAt && new Date(this.startsAt).getTime() > now) return false;
  if (this.endsAt && new Date(this.endsAt).getTime() < now) return false;
  return true;
});

const Offer = mongoose.model("Offer", offerSchema);
module.exports = Offer;
