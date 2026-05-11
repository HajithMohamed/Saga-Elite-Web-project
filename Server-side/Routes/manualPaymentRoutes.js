const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const optionalAuthMiddleware = require("../Middlewares/optional-auth-middleware");
const { requireAdmin, requirePermission } = require("../Middlewares/admin-middleware");
const adminLogMiddleware = require("../Middlewares/admin-log-middleware");
const { contactLimiter } = require("../Middlewares/rateLimitinMiddleware");
const { receiptUpload } = require("../Middlewares/multer-middleware");
const {
  validateObjectIdParam,
  validateManualPaymentReference,
  validateManualPaymentProof,
  validateManualPaymentDecision,
} = require("../Middlewares/request-validation");
const {
  generateReference,
  submitProof,
  submitWithReceipt,
  getMyPaymentStatus,
  getMyPendingPayments,
  getPendingPayments,
  getMethodSummary,
  getPaymentById,
  verifyPayment,
  requestExtension,
  lookupPayment,
  sendPaymentLink,
} = require("../Controllers/manualPaymentController");

const router = express.Router();

// Public lookup — guest or registered user recovers their payment slug
// using email + reference / order ID. Rate-limited to deter enumeration.
router.post("/manual-payments/lookup", contactLimiter, lookupPayment);

// Resend payment link by email + WhatsApp. Email-gated for guests via the
// authorizePaymentAccess helper — a registered owner is auto-authorized.
router.post(
  "/manual-payments/:slug/send-link",
  contactLimiter,
  optionalAuthMiddleware,
  sendPaymentLink
);

router.post(
  "/manual-payments/:slug/request-extension",
  contactLimiter,
  optionalAuthMiddleware,
  requestExtension
);
router.post("/manual-payment/generate", authMiddleware, validateManualPaymentReference, generateReference);
router.post("/payments/generate-reference", authMiddleware, validateManualPaymentReference, generateReference);
router.get("/payments/my-pending", authMiddleware, getMyPendingPayments);
router.post(
  "/manual-payment/submit-proof",
  optionalAuthMiddleware,
  validateManualPaymentProof,
  submitProof
);
router.post(
  "/manual-payment/submit-with-receipt",
  optionalAuthMiddleware,
  receiptUpload.single("receipt"),
  submitWithReceipt
);
router.get(
  "/manual-payment/status/:paymentIdentifier",
  optionalAuthMiddleware,
  getMyPaymentStatus
);
router.get("/admin/manual-payments", authMiddleware, requireAdmin, requirePermission("verifyPayments"), getPendingPayments);
// Mount /summary BEFORE /:id so the literal path wins over the ObjectId param.
router.get("/admin/manual-payments/summary", authMiddleware, requireAdmin, requirePermission("verifyPayments"), getMethodSummary);
router.get("/admin/manual-payments/:id", authMiddleware, requireAdmin, requirePermission("verifyPayments"), validateObjectIdParam("id", "payment id"), getPaymentById);
router.put(
  "/admin/manual-payments/:id/verify",
  authMiddleware,
  requireAdmin,
  requirePermission("verifyPayments"),
  validateObjectIdParam("id", "payment id"),
  validateManualPaymentDecision,
  adminLogMiddleware,
  verifyPayment
);

module.exports = router;
