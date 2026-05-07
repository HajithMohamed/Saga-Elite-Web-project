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
      enum: ["Ladies", "Gents", "Unisex"],
      required: true,
    },

    categoryPath: {
      type: String,
      trim: true,
      description: "E.g., Ladies > Dresses > Midi",
    },

    tags: [{
      type: String,
      trim: true,
    }],

    arrivedAt: {
      type: Date,
      default: Date.now,
    },

    relatedProductIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    }],
    trendScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    isDeal: {
      type: Boolean,
      default: false,
    },
    dealEndsAt: {
      type: Date,
      default: null,
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
    originalPrice: {
      type: Number,
      min: 0,
    },
    salePrice: {
      type: Number,
      min: 0,
    },

    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    costPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastSoldAt: {
      type: Date,
      default: null,
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

    wishCount: {
      type: Number,
      default: 0,
    },

    viewCount: {
      type: Number,
      default: 0,
    },

    cartAddCount: {
      type: Number,
      default: 0,
    },

    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
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
productSchema.index({ 
  name: "text", 
  category: "text", 
  tags: "text", 
  brand: "text",
  categoryPath: "text" 
}, {
  weights: {
    name: 10,
    category: 5,
    tags: 5,
    brand: 3,
    categoryPath: 2
  },
  name: "productSearchIndex"
});

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
  if (typeof this.originalPrice !== "number") {
    this.originalPrice = this.basePrice;
  }
  if (typeof this.salePrice !== "number") {
    this.salePrice = Math.max(0, Math.round(this.basePrice * (100 - (this.discountPercent || 0)) / 100));
  }
  
});


/* ===============================
   Virtuals
=================================*/
productSchema.virtual("profitMarginPercent").get(function () {
  if (!this.costPrice || this.costPrice === 0) return null;
  const effectivePrice = this.salePrice || this.basePrice;
  return Math.round(((effectivePrice - this.costPrice) / effectivePrice) * 100);
});

productSchema.methods.marginAfterDiscount = function (discountPercent) {
  const discountedPrice = Math.round(this.basePrice * (1 - discountPercent / 100));
  if (!this.costPrice || this.costPrice === 0) return null;
  return Math.round(((discountedPrice - this.costPrice) / discountedPrice) * 100);
};

productSchema.virtual("agingDays").get(function () {
  const ref = this.lastSoldAt || this.createdAt;
  return Math.floor((Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60 * 24));
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