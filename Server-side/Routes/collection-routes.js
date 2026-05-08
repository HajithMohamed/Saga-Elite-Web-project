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
const {
  validateCollectionCreate,
  validateCollectionUpdate,
  validateCollectionReorder,
} = require("../Middlewares/request-validation");
const adminLogMiddleware = require("../Middlewares/admin-log-middleware");

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
  validateCollectionCreate,
  adminLogMiddleware,
  createCollection
);
router.patch(
  "/admin/reorder",
  authMiddleware,
  requireAdmin,
  requirePermission("products"),
  validateCollectionReorder,
  adminLogMiddleware,
  reorderCollections
);
router.patch(
  "/admin/:id",
  authMiddleware,
  requireAdmin,
  requirePermission("products"),
  validateCollectionUpdate,
  adminLogMiddleware,
  updateCollection
);
router.delete(
  "/admin/:id",
  authMiddleware,
  requireAdmin,
  requirePermission("products"),
  adminLogMiddleware,
  deleteCollection
);

module.exports = router;
