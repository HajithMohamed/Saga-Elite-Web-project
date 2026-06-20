const mongoose = require("mongoose");

const topIssueSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["fit", "quality", "delivery", "style", "value", "uncategorized"],
      default: "uncategorized",
    },
    issue: { type: String, required: true, trim: true },
    frequency: { type: Number, default: 0 },
    severity: { type: String, enum: ["high", "medium", "low"], default: "medium" },
    exampleReviewIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
  },
  { _id: false }
);

const recommendationSchema = new mongoose.Schema(
  {
    area: { type: String, required: true, trim: true },
    action: { type: String, required: true, trim: true },
    priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
    expectedImpact: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const reviewInsightSchema = new mongoose.Schema(
  {
    generatedAt: { type: Date, default: Date.now, index: true },
    totalReviewsAnalyzed: { type: Number, default: 0 },
    dateRange: {
      from: { type: Date },
      to: { type: Date },
    },
    summary: { type: String, default: "" },
    topIssues: { type: [topIssueSchema], default: [] },
    recommendations: { type: [recommendationSchema], default: [] },
    trendsObserved: { type: String, default: "" },
    model: { type: String, default: "" },
    tokensUsed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReviewInsight", reviewInsightSchema);
