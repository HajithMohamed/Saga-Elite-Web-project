const express = require("express");

const authMiddleware = require("../Middlewares/auth-middleware");
const { requireAdmin: adminMiddleware } = require("../Middlewares/admin-middleware");
const { imageUpload } = require("../Middlewares/multer-middleware");
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
} = require("../Controllers/reviewController");

const userRouter = express.Router();
const adminRouter = express.Router();

userRouter.post("/", authMiddleware, createReview);
userRouter.get("/featured", getFeaturedReviews);
userRouter.post(
  "/upload-images",
  authMiddleware,
  imageUpload.array("images", 3),
  uploadReviewImages
);
userRouter.get("/product/:productId", getProductReviews);
userRouter.get("/my-reviews", authMiddleware, getUserReviews);
userRouter.post("/:reviewId/helpful", authMiddleware, voteHelpful);
userRouter.post("/:reviewId/flag", authMiddleware, flagReview);
userRouter.patch("/:reviewId", authMiddleware, updateReview);
userRouter.delete("/:reviewId", authMiddleware, deleteReview);

adminRouter.get("/", authMiddleware, adminMiddleware, getAllReviews);
adminRouter.put("/:reviewId", authMiddleware, adminMiddleware, moderateReview);

module.exports = { userRouter, adminRouter };
