const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireAdmin: adminMiddleware, requirePermission } = require("../Middlewares/admin-middleware");
const { imageUpload } = require("../Middlewares/multer-middleware");
const {
  validateObjectIdParam,
  validateReviewCreate,
  validateReviewUpdate,
  validateReviewFlag,
  validateReviewModeration,
} = require("../Middlewares/request-validation");
const {
  createReview,
  getFeaturedReviews,
  getProductReviews,
  getUserReviews,
  voteHelpful,
  deleteReview,
  getAllReviews,
  moderateReview,
  uploadReviewImages,
  updateReview,
  flagReview,
  getDropAnalytics,
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
adminRouter.get("/drop-analytics/:dropId", authMiddleware, adminMiddleware, requirePermission("analytics"), validateObjectIdParam("dropId", "drop id"), getDropAnalytics);
adminRouter.put("/:reviewId", authMiddleware, adminMiddleware, requirePermission("manageReviews"), validateObjectIdParam("reviewId", "review id"), validateReviewModeration, moderateReview);

module.exports = { userRouter, adminRouter };
