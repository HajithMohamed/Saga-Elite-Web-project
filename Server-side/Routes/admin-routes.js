const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireAdmin, requireSuperAdmin, requirePermission } = require("../Middlewares/admin-middleware");
const { exportCustomersCsv } = require("../Controllers/user-controller");
const { getAgingProducts, getProductAnalytics } = require("../Controllers/product-controller");
const { getOrderInvoice } = require("../Controllers/order-controller");
const {
  salesAnalytics,
  productsAnalytics,
  dropsAnalytics,
  customersAnalytics,
  reviewsAnalytics,
} = require("../Controllers/analytics-controller");
const { validateObjectIdParam } = require("../Middlewares/request-validation");
const { globalSearch } = require("../Controllers/admin-search-controller");
const { listMyVisibleLogs } = require("../Controllers/admin-log-controller");
const {
    createCategory,
    updateCategory,
    deleteCategory,
} = require("../Controllers/category-controller");

const router = express.Router();

router.get("/search", authMiddleware, requireAdmin, globalSearch);
router.get("/activity", authMiddleware, requireAdmin, listMyVisibleLogs);

router.get("/users/export", authMiddleware, requireSuperAdmin, exportCustomersCsv);
router.get(
    "/products/aging",
    authMiddleware,
    requireAdmin,
    requirePermission("products"),
    getAgingProducts
);
router.get(
    "/products/:id/analytics",
    authMiddleware,
    requireAdmin,
    requirePermission("products"),
    getProductAnalytics
);
router.get(
    "/orders/:id/invoice",
    authMiddleware,
    requireAdmin,
    requirePermission("orders"),
    validateObjectIdParam("id", "order id"),
    getOrderInvoice
);

router.get(
    "/analytics/sales",
    authMiddleware,
    requireAdmin,
    requirePermission("viewAnalytics"),
    salesAnalytics
);
router.get(
    "/analytics/products",
    authMiddleware,
    requireAdmin,
    requirePermission("viewAnalytics"),
    productsAnalytics
);
router.get(
    "/analytics/drops",
    authMiddleware,
    requireAdmin,
    requirePermission("viewAnalytics"),
    dropsAnalytics
);
router.get(
    "/analytics/customers",
    authMiddleware,
    requireAdmin,
    requirePermission("viewAnalytics"),
    customersAnalytics
);
router.get(
    "/analytics/reviews",
    authMiddleware,
    requireAdmin,
    requirePermission("viewAnalytics"),
    reviewsAnalytics
);

// Admin category management
router.post(
    "/categories",
    authMiddleware,
    requireAdmin,
    requirePermission("categories"),
    createCategory
);

router.put(
    "/categories/:id",
    authMiddleware,
    requireAdmin,
    requirePermission("categories"),
    validateObjectIdParam("id", "category id"),
    updateCategory
);

router.delete(
    "/categories/:id",
    authMiddleware,
    requireAdmin,
    requirePermission("categories"),
    validateObjectIdParam("id", "category id"),
    deleteCategory
);

module.exports = router;