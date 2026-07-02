const mongoose = require("mongoose");
const slugify = require("slugify");

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 500,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (value) => Array.isArray(value) && value.length <= 3,
        message: "A review can include up to 3 images",
      },
    },
    verifiedPurchase: {
      type: Boolean,
      default: true,
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: null,
    },

    // AI-generated classification populated asynchronously after the review
    // is saved. Each score is 0-100. Null means "not yet analyzed" — admin UI
    // should treat that distinctly from "analyzed and clean."
    aiAnalysis: {
      toxicity: { type: Number, default: null, min: 0, max: 100 },
      spam: { type: Number, default: null, min: 0, max: 100 },
      sentimentScore: { type: Number, default: null, min: -100, max: 100 },
      summary: { type: String, default: null, trim: true, maxlength: 280 },
      analyzedAt: { type: Date, default: null },
      model: { type: String, default: null, trim: true },
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
    helpfulVotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isFlagged: {
      type: Boolean,
      default: false,
      index: true,
    },
    flagReason: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "archived"],
      default: "pending",
      index: true,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    previousStatus: {
      type: String,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
      trim: true,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    brandReply: {
      type: String,
      maxlength: 1000,
      trim: true,
      default: "",
    },
    brandReplyAt: {
      type: Date,
      default: null,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    category: {
      type: String,
      enum: ["uncategorized", "fit", "quality", "delivery", "style", "value"],
      default: "uncategorized",
      index: true,
    },
    rewardCouponIssued: {
      type: Boolean,
      default: false,
    },
    rewardCouponCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ productId: 1, status: 1 });
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });
reviewSchema.index({ title: "text", content: "text" });

reviewSchema.pre("save", function () {
  if (!this.slug) {
    const idpart = this._id != null ? String(this._id) : `${this.productId}-${Date.now()}`;
    this.slug = slugify(`review-${idpart}`, { lower: true, strict: true });
  }
});

module.exports = mongoose.model("Review", reviewSchema);
