const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireAdmin } = require("../Middlewares/admin-middleware");
const adminLogMiddleware = require("../Middlewares/admin-log-middleware");
const {
  generateReference,
  submitProof,
  getMyPaymentStatus,
  getPendingPayments,
  getPaymentById,
  verifyPayment,
} = require("../Controllers/manualPaymentController");

const router = express.Router();

router.post("/manual-payment/generate", authMiddleware, generateReference);
router.post("/manual-payment/submit-proof", authMiddleware, submitProof);
router.get("/manual-payment/status/:referenceNumber", authMiddleware, getMyPaymentStatus);

router.get("/admin/manual-payments", authMiddleware, requireAdmin, getPendingPayments);
router.get("/admin/manual-payments/:id", authMiddleware, requireAdmin, getPaymentById);
router.put(
  "/admin/manual-payments/:id/verify",
  authMiddleware,
  requireAdmin,
  adminLogMiddleware,
  verifyPayment,
);

module.exports = router;