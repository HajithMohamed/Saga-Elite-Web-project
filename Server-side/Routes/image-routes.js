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
  getSocialUgcImages,
  setPrimaryImage,
  toggleActiveImage,
  deleteImage,
  reorderImages,
  deleteAllImages,
  updateImage,
} = require("../Controllers/image-controller");
const authMiddleware = require("../Middlewares/auth-middleware");
const optionalAuthMiddleware = require("../Middlewares/optional-auth-middleware");
const { requireAdmin: adminMiddleware, requirePermission } = require("../Middlewares/admin-middleware");
const adminLogMiddleware = require("../Middlewares/admin-log-middleware");
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
  adminLogMiddleware,
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
  adminLogMiddleware,
  updateImage
);

router.get("/get-product-images/:id", getProductImages);
router.get("/get-drop-images/:id", getDropImages);
router.get("/get-review-images/:id", getReviewImages);
router.get("/get-hero-images", optionalAuthMiddleware, getHeroImages);
router.get("/get-ad-images", optionalAuthMiddleware, getAdImages);
router.get("/get-logo-images", optionalAuthMiddleware, getLogoImages);
router.get("/get-category-logo-images", optionalAuthMiddleware, getCategoryLogoImages);
router.get("/get-social-ugc-images", optionalAuthMiddleware, getSocialUgcImages);

router.patch("/set-primary/:id", authMiddleware, adminMiddleware, requirePermission("products"), validateObjectIdParam("id", "image id"), adminLogMiddleware, setPrimaryImage);
router.patch("/toggle-active/:id", authMiddleware, adminMiddleware, requirePermission("products"), validateObjectIdParam("id", "image id"), adminLogMiddleware, toggleActiveImage);
router.delete("/delete-image/:id", authMiddleware, adminMiddleware, requirePermission("products"), adminLogMiddleware, deleteImage);
router.delete("/delete-all-images", authMiddleware, adminMiddleware, requirePermission("products"), validateDeleteAllImages, adminLogMiddleware, deleteAllImages);
router.patch("/reorder-images", authMiddleware, adminMiddleware, requirePermission("products"), validateImageReorder, adminLogMiddleware, reorderImages);

module.exports = router;
