const express = require("express");
const {
  getAllProducts,
  getLandingProducts,
  getSingleProduct,
  addProduct,
  updateProduct,
  deleteProduct,
  getAdminAnalytics,
  searchProducts,
  getRecommendations,
  recordDwell,
  getCompleteTheLook,
  bulkUpdateProducts,
} = require("../Controllers/product-controller");
const paginatedResult = require("../Middlewares/pagination-middleware");
const Product = require("../Models/Product");
const authMiddleware = require("../Middlewares/auth-middleware");
const optionalAuthMiddleware = require("../Middlewares/optional-auth-middleware");
const { requireAdmin: adminMiddleware, requirePermission } = require("../Middlewares/admin-middleware");
const adminLogMiddleware = require("../Middlewares/admin-log-middleware");
const {
  validateProductCreate,
  validateProductUpdate,
  validateBulkProductAction,
} = require("../Middlewares/request-validation");

const router = express.Router();

router.get("/get-all-products", paginatedResult(Product), getAllProducts);
router.get("/", getLandingProducts);
router.get("/search", optionalAuthMiddleware, searchProducts);
router.get("/recommendations", optionalAuthMiddleware, getRecommendations);
router.post("/:productId/dwell", optionalAuthMiddleware, recordDwell);
router.get("/:productId/complete-the-look", getCompleteTheLook);
router.get("/get-single-product/:slug", optionalAuthMiddleware, getSingleProduct);
router.get("/analytics", authMiddleware, adminMiddleware, requirePermission("products"), getAdminAnalytics);
router.post("/add-product", authMiddleware, adminMiddleware, requirePermission("products"), validateProductCreate, adminLogMiddleware, addProduct);
router.patch("/update-product/:slug", authMiddleware, adminMiddleware, requirePermission("products"), validateProductUpdate, adminLogMiddleware, updateProduct);
router.delete("/delete-product/:slug", authMiddleware, adminMiddleware, requirePermission("products"), adminLogMiddleware, deleteProduct);
router.patch("/bulk", authMiddleware, adminMiddleware, requirePermission("products"), validateBulkProductAction, adminLogMiddleware, bulkUpdateProducts);

module.exports = router;
