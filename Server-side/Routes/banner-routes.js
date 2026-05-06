const express = require("express");
const bannerController = require("../Controllers/banner-controller");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireAdmin } = require("../Middlewares/admin-middleware");

const router = express.Router();

router.get("/active", bannerController.getActiveBanners);
router.get("/feed", bannerController.getBannerFeed);

// Protect all routes after this middleware
router.use(authMiddleware);
router.use(requireAdmin);

router
  .route("/")
  .post(bannerController.createBanner);

router
  .route("/:id")
  .patch(bannerController.updateBanner)
  .delete(bannerController.deleteBanner);

module.exports = router;
