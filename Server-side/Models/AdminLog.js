const mongoose = require("mongoose");

const adminLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["auth", "product", "order", "payment", "user", "drop",
             "notification", "review", "system", "admin"],
      default: "system",
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    resourceId: {
      type: String,
      default: null,
    },
    method: {
      type: String,
      required: true,
    },
    route: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Auto-expire logs after 1 year (production-grade retention)
adminLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });
adminLogSchema.index({ adminId: 1, createdAt: -1 });
adminLogSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model("AdminLog", adminLogSchema);
