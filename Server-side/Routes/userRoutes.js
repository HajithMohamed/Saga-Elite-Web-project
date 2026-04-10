const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const {
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

router.get("/cart", getCart);
router.post("/cart", addToCart);
router.patch("/cart/:itemId", updateCartItem);
router.delete("/cart/:itemId", removeCartItem);

router.get("/wishlist", getWishlist);
router.post("/wishlist", addToWishlist);
router.delete("/wishlist/:productId", removeFromWishlist);

module.exports = router;
