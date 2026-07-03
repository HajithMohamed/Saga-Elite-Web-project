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
    // Snapshot of the product/variant image at order time so the order summary
    // always renders a thumbnail, even if the product is later edited/deleted.
    productImage: {
      type: String,
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
    // Optional billing/permanent address — equals shippingAddress when the
    // customer ticks "delivery address is same as permanent address".
    billingAddress: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    alternativePhone: {
      type: String,
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
      enum: [
        "pending",
        "pending_payment",
        "verification_pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
        "refund_requested",
        "refunded",
      ],
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
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    refundNote: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    refundedAt: {
      type: Date,
    },
    refundedBy: {
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
    couponCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },
    couponDiscount: {
      type: Number,
      default: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// NOTE: TTL auto-deletion was removed to prevent silent data loss (stock
// was never restored before the document vanished). Expired orders are now
// handled by the manual-payment-cleanup job which restores stock first.
orderSchema.index({ expiresAt: 1 });

// Single-field { user: 1 } index already declared via `index: true` on the field above.
orderSchema.index({ user: 1, status: 1, createdAt: -1 });

orderSchema.pre("save", function () {
  if (!this.slug) {
    const base = this.referenceNumber || String(this._id);
    this.slug = slugify(`order-${base}`, { lower: true, strict: true });
  }

});

module.exports = mongoose.model("Order", orderSchema);
