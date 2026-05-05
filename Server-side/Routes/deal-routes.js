const express = require("express");
const dealController = require("../Controllers/deal-controller");
const authController = require("../Controllers/auth-controller");

const router = express.Router();

router.get("/active", dealController.getActiveDeals);

// Protect all routes after this middleware
router.use(authController.protect);
router.use(authController.restrictTo("super-admin", "admin"));

router
  .route("/")
  .post(dealController.createDeal);

router
  .route("/:id")
  .patch(dealController.updateDeal)
  .delete(dealController.deleteDeal);

module.exports = router;