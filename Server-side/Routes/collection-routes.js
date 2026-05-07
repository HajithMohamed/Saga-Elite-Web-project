const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const {
  requireAdmin,
  requirePermission,
} = require("../Middlewares/admin-middleware");
const {
  listPublicCollections,
  getPublicCollectionBySlug,
  listAdminCollections,
  createCollection,
  updateCollection,
  reorderCollections,
  deleteCollection,
} = require("../Controllers/collection-controller");

const router = express.Router();

// Public
router.get("/", listPublicCollections);
router.get("/slug/:slug", getPublicCollectionBySlug);

// Admin
router.get(
  "/admin",
  authMiddleware,
  requireAdmin,
  requirePermission("products"),
  listAdminCollections
);
router.post(
  "/admin",
  authMiddleware,
  requireAdmin,
  requirePermission("products"),
  createCollection
);
router.patch(
  "/admin/reorder",
  authMiddleware,
  requireAdmin,
  requirePermission("products"),
  reorderCollections
);
router.patch(
  "/admin/:id",
  authMiddleware,
  requireAdmin,
  requirePermission("products"),
  updateCollection
);
router.delete(
  "/admin/:id",
  authMiddleware,
  requireAdmin,
  requirePermission("products"),
  deleteCollection
);

module.exports = router;
