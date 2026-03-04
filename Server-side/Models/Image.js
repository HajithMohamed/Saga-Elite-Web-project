// models/Image.js

const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    // Cloudinary secure URL
    url: {
      type: String,
      required: true,
      trim: true,
    },

    // Cloudinary public ID (VERY IMPORTANT for delete/update)
    publicId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    // Alternative text for SEO / accessibility
    altText: {
      type: String,
      trim: true,
      default: "",
    },

    // Image usage type
    type: {
      type: String,
      enum: [
        "product",
        "hero",
        "dropBanner",
        "ad",
        "category",
        "review",
        "logo",
        "system",
        "other",
      ],
      default: "product",
      index: true,
    },

    // Dynamic reference ID (Product, Review, Drop etc.)
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    // Which model this image belongs to
    refModel: {
      type: String,
      required: true,
      enum: [
        "Product",
        "Drop",
        "Ad",
        "Category",
        "Review",
        "User",
        "System",
      ],
      index: true,
    },

    // Used for product image ordering (main image = order 0)
    order: {
      type: Number,
      default: 0,
      index: true,
    },

    // If image should be highlighted (hero, featured banner, etc.)
    isFeatured: {
      type: Boolean,
      default: false,
    },

    // Store image metadata from Cloudinary
    metadata: {
      width: Number,
      height: Number,
      format: String,
      sizeInBytes: Number,
    },

    // Soft delete (recommended for production)
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index for fast product image retrieval
imageSchema.index({ refId: 1, refModel: 1, order: 1 });

module.exports = mongoose.model("Image", imageSchema);