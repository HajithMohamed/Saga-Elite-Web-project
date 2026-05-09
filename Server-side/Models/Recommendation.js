const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    detail: { type: String, default: "", trim: true },
    severity: { type: String, enum: ["high", "medium", "low"], default: "medium" },
    frequency: { type: Number, default: 0 },
    category: { type: String, default: "" },
    refIds: [{ type: mongoose.Schema.Types.ObjectId }],
  },
  { _id: false }
);

const recommendationActionSchema = new mongoose.Schema(
  {
    area: { type: String, required: true, trim: true },
    action: { type: String, required: true, trim: true },
    priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
    expectedImpact: { type: String, default: "", trim: true },
    supportingData: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const recommendationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["reviews", "products", "drops", "analytics", "improvements", "ideas"],
      required: true,
      index: true,
    },
    generatedAt: { type: Date, default: Date.now, index: true },
    summary: { type: String, default: "" },
    items: { type: [itemSchema], default: [] },
    recommendations: { type: [recommendationActionSchema], default: [] },
    trendsObserved: { type: String, default: "" },
    dataSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    model: { type: String, default: "" },
    tokensUsed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

recommendationSchema.index({ type: 1, generatedAt: -1 });

module.exports = mongoose.model("Recommendation", recommendationSchema);
