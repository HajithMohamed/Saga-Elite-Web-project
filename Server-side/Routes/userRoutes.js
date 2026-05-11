const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireAdmin: adminMiddleware, requirePermission } = require("../Middlewares/admin-middleware");
const {
  validateObjectIdParam,
  validateAdminUserStatus,
  validateCartAdd,
  validateCartUpdate,
  validateWishlistAdd,
  validateBulkUserTag,
} = require("../Middlewares/request-validation");
const adminLogMiddleware = require("../Middlewares/admin-log-middleware");
const {
  getAdminUsers,
  getAdminUserDetail,
  updateAdminUserStatus,
  bulkTagUsers,
  triggerAdminPasswordReset,
  deleteAdminUser,
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getMyProfile,
  updateMyProfile,
  getMyAddresses,
  addMyAddress,
  removeMyAddress,
  getMyManualPayments,
} = require("../Controllers/user-controller");

const router = express.Router();

router.use(authMiddleware);

// Self-service profile (current user). Used by the account page to show /
// edit name + phone. Phone is required for WhatsApp notifications, so
// Google-OAuth users hit this endpoint after signup to fill the gap.
router.get("/me", getMyProfile);
router.patch("/me", updateMyProfile);

router.get("/admin/users", adminMiddleware, requirePermission("users"), getAdminUsers);
router.get("/admin/users/:id", adminMiddleware, requirePermission("users"), validateObjectIdParam("id", "user id"), getAdminUserDetail);
router.patch("/admin/users/:id/status", adminMiddleware, requirePermission("users"), validateObjectIdParam("id", "user id"), validateAdminUserStatus, adminLogMiddleware, updateAdminUserStatus);
router.post("/admin/users/:id/reset-password", adminMiddleware, requirePermission("users"), validateObjectIdParam("id", "user id"), adminLogMiddleware, triggerAdminPasswordReset);
router.delete("/admin/users/:id", adminMiddleware, requirePermission("users"), validateObjectIdParam("id", "user id"), adminLogMiddleware, deleteAdminUser);
router.patch("/admin/users/bulk/tag", adminMiddleware, requirePermission("users"), validateBulkUserTag, adminLogMiddleware, bulkTagUsers);

router.get("/cart", getCart);
router.post("/cart", validateCartAdd, addToCart);
router.patch("/cart/:itemId", validateObjectIdParam("itemId", "cart item id"), validateCartUpdate, updateCartItem);
router.delete("/cart/:itemId", validateObjectIdParam("itemId", "cart item id"), removeCartItem);

router.get("/wishlist", getWishlist);
router.post("/wishlist", validateWishlistAdd, addToWishlist);
router.delete("/wishlist/:productId", validateObjectIdParam("productId", "product id"), removeFromWishlist);

router.get("/addresses", getMyAddresses);
router.post("/addresses", addMyAddress);
router.delete("/addresses/:addressId", validateObjectIdParam("addressId", "address id"), removeMyAddress);

router.get("/manual-payments", getMyManualPayments);

module.exports = router;
