const mongoose = require("mongoose");

const userActivityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    sessionId: {
      type: String,
      default: null,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ["view", "wishlist_add", "wishlist_remove", "cart_add", "cart_remove", "purchase"],
      required: true,
      index: true,
    },
    category: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
      expires: 60 * 60 * 24 * 180,
    },
  },
  { versionKey: false }
);

userActivityLogSchema.index({ userId: 1, createdAt: -1 });
userActivityLogSchema.index({ sessionId: 1, createdAt: -1 });
userActivityLogSchema.index({ productId: 1, action: 1 });

module.exports = mongoose.model("UserActivityLog", userActivityLogSchema);
