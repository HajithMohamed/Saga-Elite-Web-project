const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["clearance", "tier-discount", "mystery-box"],
      required: true,
    },
    discountPercent: {
      type: Number,
      required: function() {
        return this.type === "clearance" || this.type === "tier-discount";
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
    isActive: {
      type: Boolean,
      default: true,
    },
    isSystemGenerated: {
      type: Boolean,
      default: false,
    },
    estimatedMarginAfterDiscount: {
      type: Number,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

offerSchema.index({ type: 1 });
offerSchema.index({ isActive: 1 });

const Offer = mongoose.model("Offer", offerSchema);
module.exports = Offer;
