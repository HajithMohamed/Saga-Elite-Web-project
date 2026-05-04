const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireAdmin: adminMiddleware } = require("../Middlewares/admin-middleware");
const {
  validateObjectIdParam,
  validateNotificationMessage,
  validateNotificationUpdate,
} = require("../Middlewares/request-validation");
const {
  getNotifications,
  markNotificationRead,
  sendAdminMessage,
  getAdminNotifications,
  getAdminNotification,
  updateNotification,
  deleteNotification,
} = require("../Controllers/notification-controller");

const router = express.Router();

router.use(authMiddleware);
router.get("/", getNotifications);
router.patch("/:id/read", validateObjectIdParam("id", "notification id"), markNotificationRead);
router.post("/admin-message", adminMiddleware, validateNotificationMessage, sendAdminMessage);
router.get("/admin", adminMiddleware, getAdminNotifications);
router.get("/admin/:id", adminMiddleware, validateObjectIdParam("id", "notification id"), getAdminNotification);
router.patch("/admin/:id", adminMiddleware, validateObjectIdParam("id", "notification id"), validateNotificationUpdate, updateNotification);
router.delete("/admin/:id", adminMiddleware, validateObjectIdParam("id", "notification id"), deleteNotification);

module.exports = router;
