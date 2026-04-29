const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireAdmin: adminMiddleware } = require("../Middlewares/admin-middleware");
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
router.patch("/:id/read", markNotificationRead);
router.post("/admin-message", adminMiddleware, sendAdminMessage);

router.get("/admin", adminMiddleware, getAdminNotifications);
router.get("/admin/:id", adminMiddleware, getAdminNotification);
router.patch("/admin/:id", adminMiddleware, updateNotification);
router.delete("/admin/:id", adminMiddleware, deleteNotification);

module.exports = router;
