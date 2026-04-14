const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const adminMiddleware = require("../Middlewares/admin-middleware");
const {
  getNotifications,
  markNotificationRead,
  sendAdminMessage,
} = require("../Controllers/notification-controller");

const router = express.Router();

router.use(authMiddleware);
router.get("/", getNotifications);
router.patch("/:id/read", markNotificationRead);
router.post("/admin-message", adminMiddleware, sendAdminMessage);

module.exports = router;
