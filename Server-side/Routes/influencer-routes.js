const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const {
  requireAdmin,
  requirePermission,
} = require("../Middlewares/admin-middleware");
const adminLogMiddleware = require("../Middlewares/admin-log-middleware");
const {
  listInfluencers,
  createInfluencer,
  updateInfluencer,
  deleteInfluencer,
} = require("../Controllers/influencer-controller");

const router = express.Router();

router.get(
  "/admin",
  authMiddleware,
  requireAdmin,
  requirePermission("sendCampaigns"),
  listInfluencers
);
router.post(
  "/admin",
  authMiddleware,
  requireAdmin,
  requirePermission("sendCampaigns"),
  adminLogMiddleware,
  createInfluencer
);
router.patch(
  "/admin/:id",
  authMiddleware,
  requireAdmin,
  requirePermission("sendCampaigns"),
  adminLogMiddleware,
  updateInfluencer
);
router.delete(
  "/admin/:id",
  authMiddleware,
  requireAdmin,
  requirePermission("sendCampaigns"),
  adminLogMiddleware,
  deleteInfluencer
);

module.exports = router;
