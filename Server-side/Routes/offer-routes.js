const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const {
  requireAdmin,
  requirePermission,
} = require("../Middlewares/admin-middleware");
const {
  listPublicOffers,
  listAdminOffers,
  createOffer,
  updateOffer,
  deleteOffer,
} = require("../Controllers/offer-controller");
const {
  validateOfferCreate,
  validateOfferUpdate,
} = require("../Middlewares/request-validation");
const adminLogMiddleware = require("../Middlewares/admin-log-middleware");

const router = express.Router();

// Public — used by storefront
router.get("/", listPublicOffers);

// Admin
router.get(
  "/admin",
  authMiddleware,
  requireAdmin,
  requirePermission("products"),
  listAdminOffers
);
router.post(
  "/admin",
  authMiddleware,
  requireAdmin,
  requirePermission("products"),
  validateOfferCreate,
  adminLogMiddleware,
  createOffer
);
router.patch(
  "/admin/:id",
  authMiddleware,
  requireAdmin,
  requirePermission("products"),
  validateOfferUpdate,
  adminLogMiddleware,
  updateOffer
);
router.delete(
  "/admin/:id",
  authMiddleware,
  requireAdmin,
  requirePermission("products"),
  adminLogMiddleware,
  deleteOffer
);

module.exports = router;
