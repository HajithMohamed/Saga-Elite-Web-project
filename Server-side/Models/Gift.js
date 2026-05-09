const mongoose = require("mongoose");

const giftSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    drop: { type: mongoose.Schema.Types.ObjectId, ref: "Drop", default: null },
    isActive: { type: Boolean, default: true },
    probability: { type: Number, default: 100, min: 0, max: 100 }, // Chance % (0.1-100) to trigger
    condition: {
      type: String,
      enum: ["always", "min_order_value", "per_drop"],
      default: "always",
    },
    minOrderValue: { type: Number, default: 0 },
    description: { type: String, trim: true },
    internalNotes: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Gift", giftSchema);