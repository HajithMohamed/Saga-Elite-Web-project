const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const {
  requireAdmin,
  requirePermission,
} = require("../Middlewares/admin-middleware");
const {
  listPublicZones,
  listAdminZones,
  createZone,
  updateZone,
} = require("../Controllers/shipping-zone-controller");

const router = express.Router();

// Public — checkout pulls fee from this list
router.get("/", listPublicZones);

// Admin
router.get(
  "/admin",
  authMiddleware,
  requireAdmin,
  requirePermission("manageInventory"),
  listAdminZones
);
router.post(
  "/admin",
  authMiddleware,
  requireAdmin,
  requirePermission("manageInventory"),
  createZone
);
router.patch(
  "/admin/:id",
  authMiddleware,
  requireAdmin,
  requirePermission("manageInventory"),
  updateZone
);

module.exports = router;
