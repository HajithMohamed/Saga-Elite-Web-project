const mongoose = require("mongoose");
const slugify = require("slugify");

/* ===============================
   Variant Schema
=================================*/
const variantSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    size: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },

    color: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
    },

    priceAdjustment: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

/* ===============================
   Product Schema
=================================*/
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    slug: {
      type: String,
      unique: true,
      index: true,
    },

    artNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 50,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    brand: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    category: {
      type: String,
      enum: ["Unisex", "Boys", "Girls"],
      required: true,
    },

    drop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Drop",
      required: true,
      index: true,
    },

    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },

    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    variants: [variantSchema],

    totalStock: {
      type: Number,
      default: 0,
    },

    soldCount: {
      type: Number,
      default: 0,
    },

    isLimited: {
      type: Boolean,
      default: true,
    },

    maxPerUser: {
      type: Number,
      default: 2,
      min: 1,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

/* ===============================
   Index Optimization
=================================*/
productSchema.index({ drop: 1, isActive: 1 });

/* ===============================
   Slug Generation & Stock Calc
=================================*/
productSchema.pre("save", function () {
  if (this.isNew || this.isModified("name")) {
    this.slug = slugify(`${this.name}-${this.artNo}`, {
      lower: true,
      strict: true,
    });
  }
  if (this.variants && this.variants.length > 0) {
    this.totalStock = this.variants.reduce(
      (sum, variant) => sum + variant.stock,
      0
    );
  }
});

/* ===============================
   Virtual: Images (excludes soft-deleted)
=================================*/
productSchema.virtual("images", {
  ref: "Image",
  localField: "_id",
  foreignField: "refId",
  match: { refModel: "Product", isDeleted: false },
});

productSchema.set("toObject", { virtuals: true });
productSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Product", productSchema);