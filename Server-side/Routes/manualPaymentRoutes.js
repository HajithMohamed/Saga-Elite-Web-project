const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
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
  getPaymentById,
  verifyPayment,
  requestExtension,
} = require("../Controllers/manualPaymentController");

const router = express.Router();

router.post(
  "/manual-payments/:slug/request-extension",
  contactLimiter,
  authMiddleware,
  requestExtension
);
router.post("/manual-payment/generate", authMiddleware, validateManualPaymentReference, generateReference);
router.post("/payments/generate-reference", authMiddleware, validateManualPaymentReference, generateReference);
router.get("/payments/my-pending", authMiddleware, getMyPendingPayments);
router.post("/manual-payment/submit-proof", authMiddleware, validateManualPaymentProof, submitProof);
router.post(
  "/manual-payment/submit-with-receipt",
  authMiddleware,
  receiptUpload.single("receipt"),
  submitWithReceipt
);
router.get("/manual-payment/status/:paymentIdentifier", authMiddleware, getMyPaymentStatus);
router.get("/admin/manual-payments", authMiddleware, requireAdmin, requirePermission("verifyPayments"), getPendingPayments);
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
