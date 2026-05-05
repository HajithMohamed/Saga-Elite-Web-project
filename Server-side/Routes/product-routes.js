const express = require("express");
const {
  getAllProducts,
  getSingleProduct,
  addProduct,
  updateProduct,
  deleteProduct,
  getAdminAnalytics,
} = require("../Controllers/product-controller");
const paginatedResult = require("../Middlewares/pagination-middleware");
const Product = require("../Models/Product");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireAdmin: adminMiddleware, requirePermission } = require("../Middlewares/admin-middleware");
const {
  validateProductCreate,
  validateProductUpdate,
} = require("../Middlewares/request-validation");

const router = express.Router();

router.get("/get-all-products", paginatedResult(Product), getAllProducts);
router.get("/get-single-product/:slug", getSingleProduct);
router.get("/analytics", authMiddleware, adminMiddleware, requirePermission("products"), getAdminAnalytics);
router.post("/add-product", authMiddleware, adminMiddleware, requirePermission("products"), validateProductCreate, addProduct);
router.patch("/update-product/:slug", authMiddleware, adminMiddleware, requirePermission("products"), validateProductUpdate, updateProduct);
router.delete("/delete-product/:slug", authMiddleware, adminMiddleware, requirePermission("products"), deleteProduct);

module.exports = router;
