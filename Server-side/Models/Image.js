// models/Image.js

const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    publicId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
      index: true,
    },

    altText: {
      type: String,
      trim: true,
      default: "",
      maxlength: 200,
    },

    type: {
      type: String,
      enum: [
        "product",
        "drop",
        "hero",
        "dropBanner",
        "ad",
        "category",
        "category-logo",
        "review",
        "logo",
        "system",
        "social-ugc",
        "other",
      ],
      default: "product",
      index: true,
    },

    label: {
      type: String,
      trim: true,
      default: "",
    },

    colorTag: {
      type: String,
      trim: true,
      default: "",
    },

    refId: {
      type: mongoose.Schema.Types.ObjectId,
      required: function () {
        return this.refModel !== "System";
      },
      index: true,
    },

    refModel: {
      type: String,
      required: true,
      enum: ["Product", "Drop", "Ad", "Category", "Review", "User", "System"],
      index: true,
    },

    order: {
      type: Number,
      default: 0,
      index: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    metadata: {
      width: Number,
      height: Number,
      format: String,
      sizeInBytes: Number,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Compound index for fast image retrieval
imageSchema.index({ refId: 1, refModel: 1, order: 1 });

module.exports = mongoose.model("Image", imageSchema);