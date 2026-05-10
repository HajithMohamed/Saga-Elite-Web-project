const mongoose = require("mongoose");

const smartAlertSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: [
        "refund_spike",
        "cancellation_spike",
        "low_stock_critical",
        "conversion_drop",
        "revenue_drop",
        "review_negative_streak",
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    dataSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    acknowledged: { type: Boolean, default: false, index: true },
    acknowledgedAt: { type: Date, default: null },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
      expires: 60 * 60 * 24 * 30, // 30-day TTL
    },
  },
  { versionKey: false }
);

smartAlertSchema.index({ kind: 1, acknowledged: 1, createdAt: -1 });

module.exports = mongoose.model("SmartAlert", smartAlertSchema);
