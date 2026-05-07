const mongoose = require("mongoose");

const influencerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    handle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    platform: {
      type: String,
      enum: ["instagram", "tiktok", "youtube", "x", "facebook"],
      required: true,
      index: true,
    },
    campaignName: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    status: {
      type: String,
      enum: ["prospect", "active", "completed", "paused"],
      default: "prospect",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

influencerSchema.index({ platform: 1, handle: 1 }, { unique: true });

module.exports = mongoose.model("Influencer", influencerSchema);
