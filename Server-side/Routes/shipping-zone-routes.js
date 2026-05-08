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
const {
  validateShippingZoneCreate,
  validateShippingZoneUpdate,
} = require("../Middlewares/request-validation");

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
  validateShippingZoneCreate,
  createZone
);
router.patch(
  "/admin/:id",
  authMiddleware,
  requireAdmin,
  requirePermission("manageInventory"),
  validateShippingZoneUpdate,
  updateZone
);

module.exports = router;
