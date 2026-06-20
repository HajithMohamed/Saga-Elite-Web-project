const express = require("express");
const dealController = require("../Controllers/deal-controller");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireAdmin, requirePermission } = require("../Middlewares/admin-middleware");
const adminLogMiddleware = require("../Middlewares/admin-log-middleware");

const router = express.Router();

router.get("/active", dealController.getActiveDeals);

// Protect all routes after this middleware
router.use(authMiddleware);
router.use(requireAdmin);
router.use(requirePermission("products"));

router
  .route("/")
  .post(adminLogMiddleware, dealController.createDeal);

router
  .route("/:id")
  .patch(adminLogMiddleware, dealController.updateDeal)
  .delete(adminLogMiddleware, dealController.deleteDeal);

module.exports = router;
