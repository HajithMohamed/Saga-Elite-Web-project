// models/Product.js
const mongoose = require("mongoose");
const slugify = require("slugify");

const variantSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      trim: true
    },

    size: {
      type: String,
      required: true
    },

    color: {
      type: String,
      required: true
    },

    stock: {
      type: Number,
      required: true,
      min: 0
    },

    priceAdjustment: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    slug: {
      type: String,
      unique: true,
      index: true
    },

    artNo: {
      type: String,
      required: true,
      unique: true
    },

    description: String,

    brand: {
      type: String,
      required: true
    },

    category: {
      type: String,
      enum: ["Unisex", "Boys", "Girls"],
      required: true
    },

    drop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Drop",
      required: true,
      index: true
    },

    basePrice: {
      type: Number,
      required: true,
      min: 0
    },

    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    variants: [variantSchema],

    totalStock: {
      type: Number,
      default: 0
    },

    soldCount: {
      type: Number,
      default: 0
    },

    isFeatured: {
      type: Boolean,
      default: false
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

/* Auto slug generation */
productSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }

  // Auto calculate total stock
  if (this.variants && this.variants.length > 0) {
    this.totalStock = this.variants.reduce(
      (sum, variant) => sum + variant.stock,
      0
    );
  }

  next();
});

/* Virtual populate for images */
productSchema.virtual("images", {
  ref: "Image",
  localField: "_id",
  foreignField: "refId"
});

productSchema.set("toObject", { virtuals: true });
productSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Product", productSchema);