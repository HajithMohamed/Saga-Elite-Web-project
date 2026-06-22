const express = require("express");
const router = express.Router();
const {
  getMyProfile,
  updateMyProfile,
  getViewedProducts,
  clearViewedProducts,
  syncGuestViewedProducts,
  migrateFromGuest,
  getActivityFeed,
} = require("../Controllers/customerController");
const { requireCustomer } = require("../Middlewares/customer-middleware");
const authMiddleware = require("../Middlewares/auth-middleware");

router.use(requireCustomer);

router.get("/me", authMiddleware, getMyProfile);
router.patch("/me", authMiddleware, updateMyProfile);
router.get("/recently-viewed", getViewedProducts);
router.delete("/recently-viewed", clearViewedProducts);
router.post("/recently-viewed/sync", syncGuestViewedProducts);
router.post("/migrate-from-guest", authMiddleware, migrateFromGuest);
router.get("/activity", getActivityFeed);

module.exports = router;
