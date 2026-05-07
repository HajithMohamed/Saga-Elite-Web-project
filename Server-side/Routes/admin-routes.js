const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireAdmin, requireSuperAdmin, requirePermission } = require("../Middlewares/admin-middleware");
const { exportCustomersCsv } = require("../Controllers/user-controller");
const { getAgingProducts, getProductAnalytics } = require("../Controllers/product-controller");

const router = express.Router();

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

module.exports = router;