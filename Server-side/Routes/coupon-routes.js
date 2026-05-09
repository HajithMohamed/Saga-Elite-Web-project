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
const {
  validateCouponCreate,
  validateCouponUpdate,
} = require("../Middlewares/request-validation");
const adminLogMiddleware = require("../Middlewares/admin-log-middleware");

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
  validateCouponCreate,
  adminLogMiddleware,
  createCoupon
);
router.patch(
  "/admin/:id",
  authMiddleware,
  requireAdmin,
  requirePermission("sendCampaigns"),
  validateCouponUpdate,
  adminLogMiddleware,
  updateCoupon
);
router.delete(
  "/admin/:id",
  authMiddleware,
  requireAdmin,
  requirePermission("sendCampaigns"),
  adminLogMiddleware,
  deleteCoupon
);

module.exports = router;
