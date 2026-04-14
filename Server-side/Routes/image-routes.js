const express = require("express");
const {
  uploadImages,
  uploadReceiptImage,
  getProductImages,
  getDropImages,
  getHeroImages,
  getAdImages,
  getLogoImages,
  getCategoryLogoImages,
  getReviewImages,
  setPrimaryImage,
  deleteImage,
  reorderImages,
  deleteAllImages,
  updateImage,
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
  upload.array("images", 10),
  uploadImages,
);

/* ==============================
   Upload Receipt Image (Users)
============================== */
router.post(
  "/upload-receipt",
  authMiddleware,
  upload.single("receipt"),
  uploadReceiptImage
);

/* ==============================
   Update Image (admin only)
============================== */
router.patch(
  "/update-image/:id",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  updateImage,
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
router.get("/get-category-logo-images", getCategoryLogoImages);

/* ==============================
   Admin actions
============================== */
router.patch("/set-primary/:id", authMiddleware, adminMiddleware, setPrimaryImage);
router.delete("/delete-image/:id", authMiddleware, adminMiddleware, deleteImage);
router.delete("/delete-all-images", authMiddleware, adminMiddleware, deleteAllImages);
router.patch("/reorder-images", authMiddleware, adminMiddleware, reorderImages);

module.exports = router;