const mongoose = require("mongoose");
const slugify = require("slugify");

const manualPaymentSchema = new mongoose.Schema(
  {
    referenceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
      sparse: true,
      trim: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    guestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guest",
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "LKR",
      trim: true,
    },
    proofUrl: {
      type: String,
      default: null,
      trim: true,
      maxlength: 1000,
    },
    proofSubmittedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending_payment", "proof_submitted", "verified", "rejected", "expired"],
      default: "pending_payment",
      index: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    expiredAt: {
      type: Date,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
      trim: true,
      maxlength: 1000,
    },
    adminNotes: {
      type: String,
      default: null,
      trim: true,
      maxlength: 2000,
    },
    extensionGranted: {
      type: Boolean,
      default: false,
    },
    extensionRequestedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

manualPaymentSchema.pre("save", function setExpiry() {
  if (!this.slug || this.isModified("referenceNumber")) {
    this.slug = slugify(String(this.referenceNumber || ""), {
      lower: true,
      strict: true,
    });
  }

  if (!this.expiresAt) {
    const generatedAt = this.generatedAt ? new Date(this.generatedAt) : new Date();
    this.expiresAt = new Date(generatedAt.getTime() + 24 * 60 * 60 * 1000);
  }
});

manualPaymentSchema.index({ status: 1, createdAt: -1 });
manualPaymentSchema.index({ expiresAt: 1 });
manualPaymentSchema.index({ orderId: 1, status: 1 });

module.exports = mongoose.model("ManualPayment", manualPaymentSchema);
