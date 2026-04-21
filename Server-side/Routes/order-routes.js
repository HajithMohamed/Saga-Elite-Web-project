const express = require("express");
const router = express.Router();

const authMiddleware = require("../Middlewares/auth-middleware");
const adminMiddleware = require("../Middlewares/admin-middleware");
const {
  createOrder,
  getUserOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getDashboardStats,
} = require("../Controllers/order-controller");

router.post("/create-order", authMiddleware, createOrder);
router.get("/user-orders", authMiddleware, getUserOrders);
router.get("/get-order/:id", authMiddleware, getOrderById);
router.get("/get-all-orders", authMiddleware, adminMiddleware, getAllOrders);
router.patch("/update-order-status/:id", authMiddleware, adminMiddleware, updateOrderStatus);
router.get("/dashboard-stats", authMiddleware, adminMiddleware, getDashboardStats);

module.exports = router;
