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
const { requireAdmin: adminMiddleware, requirePermission } = require("../Middlewares/admin-middleware");
const { imageUpload, receiptUpload } = require("../Middlewares/multer-middleware");
const {
  validateObjectIdParam,
  validateImageUploadRequest,
  validateImageReorder,
  validateDeleteAllImages,
} = require("../Middlewares/request-validation");

const router = express.Router();

router.post(
  "/upload-image",
  authMiddleware,
  adminMiddleware,
  requirePermission("products"),
  imageUpload.array("images", 10),
  validateImageUploadRequest,
  uploadImages
);

router.post(
  "/upload-receipt",
  authMiddleware,
  receiptUpload.single("receipt"),
  uploadReceiptImage
);

router.patch(
  "/update-image/:id",
  authMiddleware,
  adminMiddleware,
  requirePermission("products"),
  imageUpload.single("image"),
  validateObjectIdParam("id", "image id"),
  updateImage
);

router.get("/get-product-images/:id", getProductImages);
router.get("/get-drop-images/:id", getDropImages);
router.get("/get-review-images/:id", getReviewImages);
router.get("/get-hero-images", getHeroImages);
router.get("/get-ad-images", getAdImages);
router.get("/get-logo-images", getLogoImages);
router.get("/get-category-logo-images", getCategoryLogoImages);

router.patch("/set-primary/:id", authMiddleware, adminMiddleware, requirePermission("products"), validateObjectIdParam("id", "image id"), setPrimaryImage);
router.delete("/delete-image/:id", authMiddleware, adminMiddleware, requirePermission("products"), deleteImage);
router.delete("/delete-all-images", authMiddleware, adminMiddleware, requirePermission("products"), validateDeleteAllImages, deleteAllImages);
router.patch("/reorder-images", authMiddleware, adminMiddleware, requirePermission("products"), validateImageReorder, reorderImages);

module.exports = router;
