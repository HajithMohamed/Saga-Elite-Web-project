const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const optionalAuthMiddleware = require("../Middlewares/optional-auth-middleware");
const { requireAdmin: adminMiddleware } = require("../Middlewares/admin-middleware");
const { contactLimiter } = require("../Middlewares/rateLimitinMiddleware");
const {
  submitContactInquiry,
  getContactInquiries,
  updateContactInquiry,
} = require("../Controllers/contactController");

const router = express.Router();

router.post("/", contactLimiter, optionalAuthMiddleware, submitContactInquiry);

router.get("/admin", authMiddleware, adminMiddleware, getContactInquiries);
router.patch("/admin/:id", authMiddleware, adminMiddleware, updateContactInquiry);

module.exports = router;
