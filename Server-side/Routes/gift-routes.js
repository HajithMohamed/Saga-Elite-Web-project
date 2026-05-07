const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireAdmin: adminMiddleware, requirePermission } = require("../Middlewares/admin-middleware");
const ctrl = require("../Controllers/gift-controller");

const router = express.Router();

router.get("/", authMiddleware, adminMiddleware, requirePermission("products"), ctrl.getAllGifts);
router.get("/analytics", authMiddleware, adminMiddleware, requirePermission("products"), ctrl.getGiftAnalytics);
router.get("/:giftId/orders", authMiddleware, adminMiddleware, requirePermission("products"), ctrl.getGiftOrders);
router.post("/", authMiddleware, adminMiddleware, requirePermission("products"), ctrl.createGift);
router.patch("/:giftId", authMiddleware, adminMiddleware, requirePermission("products"), ctrl.updateGift);

module.exports = router;