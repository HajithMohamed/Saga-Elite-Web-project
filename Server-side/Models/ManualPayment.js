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
      uppercase: true,
      maxlength: 12,
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
      enum: [
        "pending_payment",
        "proof_submitted",
        "pending_bank_confirmation",
        "verified",
        "rejected",
        "expired",
      ],
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
    // OCR audit trail — populated when the receipt is auto-processed at upload
    // time. Kept for admin visibility even after auto-decision so an admin can
    // override if the OCR misread something. `ocr_matched` means the slip
    // looks correct but the credit hasn't been confirmed by the bank yet.
    ocr: {
      extractedText: { type: String, default: null, maxlength: 8000 },
      extractedReference: { type: String, default: null, trim: true, uppercase: true, maxlength: 24 },
      extractedAmount: { type: Number, default: null },
      referenceMatched: { type: Boolean, default: null },
      amountMatched: { type: Boolean, default: null },
      decision: {
        type: String,
        // "auto_verified" is a legacy value kept for backward compat with
        // records written before bank confirmation was introduced. New
        // records use "ocr_matched" instead.
        enum: ["ocr_matched", "auto_verified", "auto_rejected", "manual_review", null],
        default: null,
      },
      decisionReason: { type: String, default: null, maxlength: 500 },
      processedAt: { type: Date, default: null },
    },
    // Bank-side confirmation of the credit. Populated by the IMAP email
    // watcher when a matching bank notification arrives, OR by an admin
    // manually approving from the queue. A payment is only "really verified"
    // when bankVerification.confirmed is true.
    bankVerification: {
      confirmed: { type: Boolean, default: false },
      confirmedAt: { type: Date, default: null },
      source: {
        type: String,
        enum: ["imap", "csv", "manual_admin", null],
        default: null,
      },
      bankName: { type: String, default: null, trim: true, maxlength: 100 },
      emailMessageId: { type: String, default: null, trim: true, maxlength: 250 },
      emailFrom: { type: String, default: null, trim: true, maxlength: 250 },
      emailSubject: { type: String, default: null, trim: true, maxlength: 500 },
      extractedAmount: { type: Number, default: null },
      extractedReference: { type: String, default: null, trim: true, uppercase: true, maxlength: 24 },
      transactionId: { type: String, default: null, trim: true, maxlength: 100 },
      amountMismatch: { type: Boolean, default: false },
      rawSnippet: { type: String, default: null, maxlength: 2000 },
    },
  },
  { timestamps: true }
);

// Idempotency for the IMAP watcher — the same email message must never upgrade
// a payment twice (banks resend, IMAP redelivers on disconnect, etc.).
// Partial unique index: enforce uniqueness only when emailMessageId is an actual
// string. `sparse: true` does NOT exclude documents where the field is present
// with value `null` — and the schema's `default: null` makes that the case for
// every new payment, which would otherwise collide on the unique constraint.
manualPaymentSchema.index(
  { "bankVerification.emailMessageId": 1 },
  {
    unique: true,
    partialFilterExpression: {
      "bankVerification.emailMessageId": { $type: "string" },
    },
  }
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
