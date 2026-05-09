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
        "mystery-box",
        "aging_stock",
        "new_product",
        "seasonal",
        "flash",
      ],
      required: true,
    },
    discountPercent: {
      type: Number,
      required: function () {
        return this.type !== "mystery-box";
      },
      min: 0,
      max: 100,
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

offerSchema.virtual("isLive").get(function () {
  if (!this.isActive) return false;
  const now = Date.now();
  if (this.startsAt && new Date(this.startsAt).getTime() > now) return false;
  if (this.endsAt && new Date(this.endsAt).getTime() < now) return false;
  return true;
});

const Offer = mongoose.model("Offer", offerSchema);
module.exports = Offer;
