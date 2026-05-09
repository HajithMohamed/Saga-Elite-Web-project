const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    headline: {
      type: String,
      trim: true,
    },
    ctaText: {
      type: String,
      default: "Shop Now",
    },
    redirectUrl: {
      type: String,
      required: true,
    },
    activeFrom: {
      type: Date,
      default: Date.now,
    },
    activeTo: {
      type: Date,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

bannerSchema.index({ isActive: 1, activeFrom: 1, activeTo: 1 });

module.exports = mongoose.model("Banner", bannerSchema);