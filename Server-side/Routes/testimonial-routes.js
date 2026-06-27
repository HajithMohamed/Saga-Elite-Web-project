const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireSuperAdmin } = require("../Middlewares/admin-middleware");
const adminLogMiddleware = require("../Middlewares/admin-log-middleware");
const { validateObjectIdParam } = require("../Middlewares/request-validation");
const {
  getActiveTestimonials,
  listTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} = require("../Controllers/testimonial-controller");

const router = express.Router();

// Public — homepage carousel
router.get("/", getActiveTestimonials);

// Admin — Content CMS (super-admin only, consistent with site-config pages)
router.get("/admin", authMiddleware, requireSuperAdmin, listTestimonials);
router.post(
  "/admin",
  authMiddleware,
  requireSuperAdmin,
  adminLogMiddleware,
  createTestimonial
);
router.patch(
  "/admin/:id",
  authMiddleware,
  requireSuperAdmin,
  validateObjectIdParam("id", "testimonial id"),
  adminLogMiddleware,
  updateTestimonial
);
router.delete(
  "/admin/:id",
  authMiddleware,
  requireSuperAdmin,
  validateObjectIdParam("id", "testimonial id"),
  adminLogMiddleware,
  deleteTestimonial
);

module.exports = router;
