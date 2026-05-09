const mongoose = require("mongoose");

const shippingZoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    provinces: {
      type: [String],
      default: [],
    },
    deliveryFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    estimatedDays: {
      type: String,
      trim: true,
      default: "1–3 business days",
      maxlength: 80,
    },
    freeAbove: {
      // Order subtotal above which delivery is free. 0 = never free.
      type: Number,
      default: 0,
      min: 0,
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShippingZone", shippingZoneSchema);
