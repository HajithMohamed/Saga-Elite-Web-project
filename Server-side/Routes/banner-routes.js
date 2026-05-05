const express = require("express");
const bannerController = require("../Controllers/banner-controller");
const authController = require("../Controllers/auth-controller");

const router = express.Router();

router.get("/active", bannerController.getActiveBanners);

// Protect all routes after this middleware
router.use(authController.protect);
router.use(authController.restrictTo("super-admin", "admin"));

router
  .route("/")
  .post(bannerController.createBanner);

router
  .route("/:id")
  .patch(bannerController.updateBanner)
  .delete(bannerController.deleteBanner);

module.exports = router;