const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const optionalAuthMiddleware = require("../Middlewares/optional-auth-middleware");
const { requireAdmin: adminMiddleware } = require("../Middlewares/admin-middleware");
const { contactLimiter } = require("../Middlewares/rateLimitinMiddleware");
const {
  validateContactSubmission,
  validateContactUpdate,
  validateObjectIdParam,
} = require("../Middlewares/request-validation");
const adminLogMiddleware = require("../Middlewares/admin-log-middleware");
const {
  submitContactInquiry,
  getContactInquiries,
  updateContactInquiry,
} = require("../Controllers/contactController");

const router = express.Router();

router.post("/", contactLimiter, optionalAuthMiddleware, validateContactSubmission, submitContactInquiry);
router.get("/admin", authMiddleware, adminMiddleware, getContactInquiries);
router.patch(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  validateObjectIdParam("id", "contact inquiry id"),
  validateContactUpdate,
  adminLogMiddleware,
  updateContactInquiry
);

module.exports = router;
