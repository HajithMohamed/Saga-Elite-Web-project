const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const {
  requireAdmin,
  requirePermission,
} = require("../Middlewares/admin-middleware");
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
  createInfluencer
);
router.patch(
  "/admin/:id",
  authMiddleware,
  requireAdmin,
  requirePermission("sendCampaigns"),
  updateInfluencer
);
router.delete(
  "/admin/:id",
  authMiddleware,
  requireAdmin,
  requirePermission("sendCampaigns"),
  deleteInfluencer
);

module.exports = router;
