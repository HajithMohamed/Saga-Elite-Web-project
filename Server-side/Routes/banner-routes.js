const express = require("express");
const bannerController = require("../Controllers/banner-controller");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireAdmin, requirePermission } = require("../Middlewares/admin-middleware");
const adminLogMiddleware = require("../Middlewares/admin-log-middleware");
const {
  validateBannerCreate,
  validateBannerUpdate,
} = require("../Middlewares/request-validation");

const router = express.Router();

router.get("/active", bannerController.getActiveBanners);
router.get("/feed", bannerController.getBannerFeed);

// Protect all routes after this middleware
router.use(authMiddleware);
router.use(requireAdmin);
router.use(requirePermission("products"));

router
  .route("/")
  .post(validateBannerCreate, adminLogMiddleware, bannerController.createBanner);

router
  .route("/:id")
  .patch(validateBannerUpdate, adminLogMiddleware, bannerController.updateBanner)
  .delete(adminLogMiddleware, bannerController.deleteBanner);

module.exports = router;
