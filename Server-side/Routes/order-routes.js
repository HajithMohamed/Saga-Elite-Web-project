const express = require("express");
const router = express.Router();

const optionalAuthMiddleware = require("../Middlewares/optional-auth-middleware");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireAdmin: adminMiddleware } = require("../Middlewares/admin-middleware");
const {
  createOrder,
  getUserOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getDashboardStats,
} = require("../Controllers/order-controller");

router.post("/create-order", optionalAuthMiddleware, createOrder);
router.get("/user-orders", authMiddleware, getUserOrders);
router.get("/get-order/:id", authMiddleware, getOrderById);
router.get("/get-all-orders", authMiddleware, adminMiddleware, getAllOrders);
router.put("/:id/status", authMiddleware, adminMiddleware, updateOrderStatus);
router.patch("/update-order-status/:id", authMiddleware, adminMiddleware, updateOrderStatus);
router.get("/dashboard-stats", authMiddleware, adminMiddleware, getDashboardStats);

module.exports = router;
