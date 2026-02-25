// models/Image.js
const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true
    },

    altText: {
      type: String,
      trim: true
    },

    type: {
      type: String,
      enum: [
        "product",
        "dropBanner",
        "ad",
        "hero",
        "category",
        "other"
      ],
      default: "product"
    },

    refId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },

    refModel: {
      type: String,
      required: true,
      enum: ["Product", "Drop", "Ad", "Category"]
    },

    metadata: {
      order: {
        type: Number,
        default: 0
      },
      width: Number,
      height: Number
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Image", imageSchema);