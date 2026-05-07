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
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
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

reviewSchema.pre("save", function (next) {
  if (!this.slug) {
    const idpart = this._id != null ? String(this._id) : `${this.productId}-${Date.now()}`;
    this.slug = slugify(`review-${idpart}`, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model("Review", reviewSchema);
