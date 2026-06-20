const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireAdmin: adminMiddleware, requirePermission } = require("../Middlewares/admin-middleware");
const adminLogMiddleware = require("../Middlewares/admin-log-middleware");
const {
  getLatestRecommendation,
  getAllLatestRecommendations,
  regenerateRecommendation,
} = require("../Controllers/recommendations-controller");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  requirePermission("manageReviews"),
  getAllLatestRecommendations
);

router.get(
  "/:type",
  authMiddleware,
  adminMiddleware,
  requirePermission("manageReviews"),
  getLatestRecommendation
);

router.post(
  "/:type/regenerate",
  authMiddleware,
  adminMiddleware,
  requirePermission("manageReviews"),
  adminLogMiddleware,
  regenerateRecommendation
);

module.exports = router;
