const express = require("express");
const dealController = require("../Controllers/deal-controller");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireAdmin } = require("../Middlewares/admin-middleware");

const router = express.Router();

router.get("/active", dealController.getActiveDeals);

// Protect all routes after this middleware
router.use(authMiddleware);
router.use(requireAdmin);

router
  .route("/")
  .post(dealController.createDeal);

router
  .route("/:id")
  .patch(dealController.updateDeal)
  .delete(dealController.deleteDeal);

module.exports = router;
