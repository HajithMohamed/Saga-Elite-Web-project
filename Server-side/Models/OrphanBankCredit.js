// A bank credit notification arrived but no ManualPayment matched the
// reference parsed from the email. Could be: customer typed a wrong
// reference, an unrelated incoming transfer, a refund return, or a parser
// false-extraction. We never silently drop these — admins surface them in a
// reconciliation tab and either link them to a payment, mark them resolved,
// or note them as unrelated.

const mongoose = require("mongoose");

const orphanBankCreditSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "LKR", trim: true, maxlength: 8 },
    extractedReference: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
      maxlength: 64,
    },
    transactionId: { type: String, default: null, trim: true, maxlength: 100 },
    bankName: { type: String, default: null, trim: true, maxlength: 100 },

    emailMessageId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      maxlength: 250,
    },
    emailFrom: { type: String, default: null, trim: true, maxlength: 250 },
    emailSubject: { type: String, default: null, trim: true, maxlength: 500 },
    emailDate: { type: Date, default: null },
    rawSnippet: { type: String, default: null, maxlength: 4000 },

    resolved: { type: Boolean, default: false, index: true },
    resolvedAt: { type: Date, default: null },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolutionNote: { type: String, default: null, maxlength: 1000 },
    linkedPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ManualPayment",
      default: null,
    },
  },
  { timestamps: true }
);

orphanBankCreditSchema.index({ resolved: 1, createdAt: -1 });

module.exports = mongoose.model("OrphanBankCredit", orphanBankCreditSchema);
