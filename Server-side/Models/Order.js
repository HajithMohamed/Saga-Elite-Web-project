const mongoose = require("mongoose");
const slugify = require("slugify");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    productArtNo: {
      type: String,
      required: true,
      trim: true,
    },
    productSlug: {
      type: String,
      required: true,
      trim: true,
    },
    variantSku: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guest",
    },
    guestEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [
        (items) => items && items.length > 0,
        "Order must contain at least one item",
      ],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingAddress: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    paymentMethod: {
      type: String,
      enum: ["payhere", "gpay", "manual", "manual_bank_transfer", "card", "lankapay", "cash"],
      required: true,
    },
    paymentProofUrl: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    transactionId: {
      type: String,
      trim: true,
      index: true,
    },
    paymentProofHash: {
      type: String,
      trim: true,
    },
    paymentVerifiedAt: {
      type: Date,
      default: null,
    },
    referenceNumber: {
      type: String,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "pending_payment", "verification_pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    cancelledAt: {
      type: Date,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    expiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// TTL Index for auto-expiring pending orders
orderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

orderSchema.index({ user: 1 });
orderSchema.index({ user: 1, status: 1, createdAt: -1 });

orderSchema.pre("save", function (next) {
  if (!this.slug) {
    const base = this.referenceNumber || String(this._id);
    this.slug = slugify(`order-${base}`, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
