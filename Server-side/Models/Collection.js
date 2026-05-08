const mongoose = require("mongoose");
const slugify = require("slugify");

const collectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    bannerImageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

collectionSchema.index({ isFeatured: 1, displayOrder: 1 });

collectionSchema.pre("save", function () {
  if (this.isModified("name") || !this.slug) {
    const base = this.name || String(this._id || Date.now());
    this.slug = slugify(`collection-${base}`, { lower: true, strict: true });
  }
});

module.exports = mongoose.model("Collection", collectionSchema);
