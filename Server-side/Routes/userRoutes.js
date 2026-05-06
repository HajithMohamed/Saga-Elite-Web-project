const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireAdmin: adminMiddleware, requirePermission } = require("../Middlewares/admin-middleware");
const {
  validateObjectIdParam,
  validateAdminUserStatus,
  validateCartAdd,
  validateCartUpdate,
  validateWishlistAdd,
} = require("../Middlewares/request-validation");
const {
  getAdminUsers,
  getAdminUserDetail,
  updateAdminUserStatus,
  deleteAdminUser,
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require("../Controllers/user-controller");

const router = express.Router();

router.use(authMiddleware);

router.get("/admin/users", adminMiddleware, requirePermission("users"), getAdminUsers);
router.get("/admin/users/:id", adminMiddleware, requirePermission("users"), validateObjectIdParam("id", "user id"), getAdminUserDetail);
router.patch("/admin/users/:id/status", adminMiddleware, requirePermission("users"), validateObjectIdParam("id", "user id"), validateAdminUserStatus, updateAdminUserStatus);
router.delete("/admin/users/:id", adminMiddleware, requirePermission("users"), validateObjectIdParam("id", "user id"), deleteAdminUser);

router.get("/cart", getCart);
router.post("/cart", validateCartAdd, addToCart);
router.patch("/cart/:itemId", validateObjectIdParam("itemId", "cart item id"), validateCartUpdate, updateCartItem);
router.delete("/cart/:itemId", validateObjectIdParam("itemId", "cart item id"), removeCartItem);

router.get("/wishlist", getWishlist);
router.post("/wishlist", validateWishlistAdd, addToWishlist);
router.delete("/wishlist/:productId", validateObjectIdParam("productId", "product id"), removeFromWishlist);

module.exports = router;
