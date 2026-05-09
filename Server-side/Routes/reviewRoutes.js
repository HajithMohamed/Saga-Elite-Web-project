const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireAdmin: adminMiddleware, requirePermission } = require("../Middlewares/admin-middleware");
const adminLogMiddleware = require("../Middlewares/admin-log-middleware");
const { imageUpload } = require("../Middlewares/multer-middleware");
const {
  validateObjectIdParam,
  validateReviewCreate,
  validateReviewUpdate,
  validateReviewFlag,
  validateReviewCategorize,
} = require("../Middlewares/request-validation");
const {
  createReview,
  getFeaturedReviews,
  getProductReviews,
  getUserReviews,
  voteHelpful,
  deleteReview,
  getAllReviews,
  categorizeReview,
  uploadReviewImages,
  updateReview,
  flagReview,
  getDropAnalytics,
  replyToReview,
  featureReview,
  getReviewsAnalytics,
  getLatestReviewInsights,
  regenerateReviewInsights,
} = require("../Controllers/reviewController");

const userRouter = express.Router();
const adminRouter = express.Router();

userRouter.post("/", authMiddleware, validateReviewCreate, createReview);
userRouter.get("/featured", getFeaturedReviews);
userRouter.post("/upload-images", authMiddleware, imageUpload.array("images", 3), uploadReviewImages);
userRouter.get("/product/:productId", getProductReviews);
userRouter.get("/my-reviews", authMiddleware, getUserReviews);
userRouter.post("/:reviewId/helpful", authMiddleware, validateObjectIdParam("reviewId", "review id"), voteHelpful);
userRouter.post("/:reviewId/flag", authMiddleware, validateObjectIdParam("reviewId", "review id"), validateReviewFlag, flagReview);
userRouter.patch("/:reviewId", authMiddleware, validateObjectIdParam("reviewId", "review id"), validateReviewUpdate, updateReview);
userRouter.delete("/:reviewId", authMiddleware, validateObjectIdParam("reviewId", "review id"), deleteReview);

adminRouter.get("/", authMiddleware, adminMiddleware, requirePermission("manageReviews"), getAllReviews);
adminRouter.get("/analytics", authMiddleware, adminMiddleware, requirePermission("manageReviews"), getReviewsAnalytics);
adminRouter.get("/insights", authMiddleware, adminMiddleware, requirePermission("manageReviews"), getLatestReviewInsights);
adminRouter.post("/insights/regenerate", authMiddleware, adminMiddleware, requirePermission("manageReviews"), adminLogMiddleware, regenerateReviewInsights);
adminRouter.get("/drop-analytics/:dropId", authMiddleware, adminMiddleware, requirePermission("viewAnalytics"), validateObjectIdParam("dropId", "drop id"), getDropAnalytics);
adminRouter.patch("/:reviewId/category", authMiddleware, adminMiddleware, requirePermission("manageReviews"), validateObjectIdParam("reviewId", "review id"), validateReviewCategorize, adminLogMiddleware, categorizeReview);
adminRouter.patch("/:reviewId/reply", authMiddleware, adminMiddleware, requirePermission("manageReviews"), validateObjectIdParam("reviewId", "review id"), adminLogMiddleware, replyToReview);
adminRouter.patch("/:reviewId/feature", authMiddleware, adminMiddleware, requirePermission("manageReviews"), validateObjectIdParam("reviewId", "review id"), adminLogMiddleware, featureReview);

module.exports = { userRouter, adminRouter };
