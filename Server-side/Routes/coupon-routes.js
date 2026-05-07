const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const optionalAuthMiddleware = require("../Middlewares/optional-auth-middleware");
const {
  requireAdmin,
  requirePermission,
} = require("../Middlewares/admin-middleware");
const {
  validateCoupon,
  listAdminCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require("../Controllers/coupon-controller");

const router = express.Router();

// Public — validate from checkout (auth optional, supports guest)
router.post("/validate", optionalAuthMiddleware, validateCoupon);

// Admin
router.get(
  "/admin",
  authMiddleware,
  requireAdmin,
  requirePermission("sendCampaigns"),
  listAdminCoupons
);
router.post(
  "/admin",
  authMiddleware,
  requireAdmin,
  requirePermission("sendCampaigns"),
  createCoupon
);
router.patch(
  "/admin/:id",
  authMiddleware,
  requireAdmin,
  requirePermission("sendCampaigns"),
  updateCoupon
);
router.delete(
  "/admin/:id",
  authMiddleware,
  requireAdmin,
  requirePermission("sendCampaigns"),
  deleteCoupon
);

module.exports = router;
