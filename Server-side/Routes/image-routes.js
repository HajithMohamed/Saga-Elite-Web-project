const express = require("express");
const {
  uploadImages,
  getProductImages,
  getDropImages,
  getHeroImages,
  getAdImages,
  getLogoImages,
  getReviewImages,
  setPrimaryImage,
  deleteImage,
  reorderImages,
  deleteAllImages,
} = require("../Controllers/image-controller");
const authMiddleware = require("../Middlewares/auth-middleware");
const adminMiddleware = require("../Middlewares/admin-middleware");
const upload = require("../Middlewares/multer-middleware");

const router = express.Router();

/* ==============================
   Upload (admin only)
============================== */
router.post(
  "/upload-image",
  authMiddleware,
  adminMiddleware,
  upload.any(),
  uploadImages,
);

/* ==============================
   Fetch images — entity-specific
============================== */
router.get("/get-product-images/:id", getProductImages);
router.get("/get-drop-images/:id", getDropImages);
router.get("/get-review-images/:id", getReviewImages);

/* ==============================
   Fetch images — system (public)
============================== */
router.get("/get-hero-images", getHeroImages);
router.get("/get-ad-images", getAdImages);
router.get("/get-logo-images", getLogoImages);

/* ==============================
   Admin actions
============================== */
router.patch("/set-primary/:id", authMiddleware, adminMiddleware, setPrimaryImage);
router.delete("/delete-image/:id", authMiddleware, adminMiddleware, deleteImage);
router.delete("/delete-all-images", authMiddleware, adminMiddleware, deleteAllImages);
router.patch("/reorder-images", authMiddleware, adminMiddleware, reorderImages);

module.exports = router;