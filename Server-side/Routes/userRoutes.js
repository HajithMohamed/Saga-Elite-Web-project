const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const adminMiddleware = require("../Middlewares/admin-middleware");
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

router.get("/admin/users", adminMiddleware, getAdminUsers);
router.get("/admin/users/:id", adminMiddleware, getAdminUserDetail);
router.patch("/admin/users/:id/status", adminMiddleware, updateAdminUserStatus);
router.delete("/admin/users/:id", adminMiddleware, deleteAdminUser);

router.get("/cart", getCart);
router.post("/cart", addToCart);
router.patch("/cart/:itemId", updateCartItem);
router.delete("/cart/:itemId", removeCartItem);

router.get("/wishlist", getWishlist);
router.post("/wishlist", addToWishlist);
router.delete("/wishlist/:productId", removeFromWishlist);

module.exports = router;
