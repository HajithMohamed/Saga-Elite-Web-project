const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireAdmin: adminMiddleware, requirePermission } = require("../Middlewares/admin-middleware");
const adminLogMiddleware = require("../Middlewares/admin-log-middleware");
const {
  listAlerts,
  acknowledgeAlert,
  triggerCheck,
} = require("../Controllers/smart-alerts-controller");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  requirePermission("manageReviews"),
  listAlerts
);

router.patch(
  "/:id/ack",
  authMiddleware,
  adminMiddleware,
  requirePermission("manageReviews"),
  adminLogMiddleware,
  acknowledgeAlert
);

router.post(
  "/run",
  authMiddleware,
  adminMiddleware,
  requirePermission("manageReviews"),
  adminLogMiddleware,
  triggerCheck
);

module.exports = router;
