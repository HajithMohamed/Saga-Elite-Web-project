const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const { validateObjectIdParam } = require("../Middlewares/request-validation");
const {
  getNotifications,
  markNotificationRead,
} = require("../Controllers/notification-controller");

const router = express.Router();

router.use(authMiddleware);
router.get("/", getNotifications);
router.patch("/:id/read", validateObjectIdParam("id", "notification id"), markNotificationRead);

module.exports = router;
