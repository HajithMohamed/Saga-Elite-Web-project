const express = require("express");
const optionalAuthMiddleware = require("../Middlewares/optional-auth-middleware");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireAdmin: adminMiddleware, requirePermission } = require("../Middlewares/admin-middleware");
const adminLogMiddleware = require("../Middlewares/admin-log-middleware");
const {
  validateObjectIdParam,
  validateOrderCreate,
  validateOrderStatusUpdate,
} = require("../Middlewares/request-validation");
const {
  createOrder,
  getUserOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  refundOrder,
  getDashboardStats,
} = require("../Controllers/order-controller");

const router = express.Router();

router.post("/create-order", optionalAuthMiddleware, validateOrderCreate, createOrder);
router.get("/user-orders", authMiddleware, getUserOrders);
router.get("/get-order/:id", authMiddleware, validateObjectIdParam("id", "order id"), getOrderById);
router.get("/get-all-orders", authMiddleware, adminMiddleware, requirePermission("orders"), getAllOrders);
router.put("/:id/status", authMiddleware, adminMiddleware, requirePermission("orders"), validateObjectIdParam("id", "order id"), validateOrderStatusUpdate, adminLogMiddleware, updateOrderStatus);
router.patch("/update-order-status/:id", authMiddleware, adminMiddleware, requirePermission("orders"), validateObjectIdParam("id", "order id"), validateOrderStatusUpdate, adminLogMiddleware, updateOrderStatus);
router.patch("/:id/refund", authMiddleware, adminMiddleware, requirePermission("verifyPayments"), validateObjectIdParam("id", "order id"), adminLogMiddleware, refundOrder);
router.get("/dashboard-stats", authMiddleware, adminMiddleware, getDashboardStats);

module.exports = router;
