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
    },

    size: {
      type: String,
      required: true,
      trim: true,
    },

    color: {
      type: String,
      required: true,
      trim: true,
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
  { _id: true } // keep _id for atomic stock updates
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
    },

    description: {
      type: String,
      trim: true,
    },

    brand: {
      type: String,
      required: true,
      trim: true,
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

    /* Limited Edition Controls */
    isLimited: {
      type: Boolean,
      default: true,
    },

    maxPerUser: {
      type: Number,
      default: 2, // Prevent bulk buying
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
productSchema.index({ slug: 1 });
productSchema.index({ artNo: 1 });

/* ===============================
   Slug Generation
=================================*/
productSchema.pre("validate", function (next) {
  if (!this.slug) {
    this.slug = slugify(`${this.name}-${this.artNo}`, {
      lower: true,
      strict: true,
    });
  }
  next();
});

/* ===============================
   Auto Calculate Total Stock
=================================*/
productSchema.pre("save", function (next) {
  if (this.variants && this.variants.length > 0) {
    this.totalStock = this.variants.reduce(
      (sum, variant) => sum + variant.stock,
      0
    );
  }
  next();
});

/* ===============================
   Virtual: Images
=================================*/
productSchema.virtual("images", {
  ref: "Image",
  localField: "_id",
  foreignField: "refId",
});

productSchema.set("toObject", { virtuals: true });
productSchema.set("toJSON", { virtuals: true });

/* ===============================
   Export Model
=================================*/
module.exports = mongoose.model("Product", productSchema);