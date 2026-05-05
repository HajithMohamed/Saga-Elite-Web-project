const mongoose = require("mongoose");

const dealSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    discountPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    startsAt: {
      type: Date,
      default: Date.now,
    },
    endsAt: {
      type: Date,
      required: true,
    },
    maxQuantity: {
      type: Number,
      default: null, // null means unlimited within stock limits
    },
    soldCount: {
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

dealSchema.index({ isActive: 1, endsAt: 1, startsAt: 1 });

module.exports = mongoose.model("Deal", dealSchema);