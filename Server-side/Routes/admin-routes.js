const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireAdmin, requireSuperAdmin, requirePermission } = require("../Middlewares/admin-middleware");
const { exportCustomersCsv } = require("../Controllers/user-controller");
const { getAgingProducts, getProductAnalytics } = require("../Controllers/product-controller");
const { getOrderInvoice } = require("../Controllers/order-controller");
const { validateObjectIdParam } = require("../Middlewares/request-validation");

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
router.get(
    "/orders/:id/invoice",
    authMiddleware,
    requireAdmin,
    requirePermission("orders"),
    validateObjectIdParam("id", "order id"),
    getOrderInvoice
);

module.exports = router;