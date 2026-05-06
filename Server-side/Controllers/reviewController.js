const mongoose = require("mongoose");
const Review = require("../Models/Review");
const Order = require("../Models/Order");
const Product = require("../Models/Product");
const Drop = require("../Models/Drop");
const User = require("../Models/User");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const uploadToCloudinary = require("../Utils/image-upload");
const { isAdminRole } = require("../Utils/admin-roles");
const { SOCKET_EVENTS, emitToAll } = require("../Utils/socket-service");
const reviewFilterConfig = require("../Config/review-filter-config");

const normalizeNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const recalculateProductRating = async (productId) => {
  const productObjectId = new mongoose.Types.ObjectId(productId);

  const summary = await Review.aggregate([
    { $match: { productId: productObjectId, status: "approved" } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const averageRating = summary.length
    ? Math.round(summary[0].averageRating * 10) / 10
    : 0;
  const reviewCount = summary.length ? summary[0].reviewCount : 0;

  await Product.findByIdAndUpdate(
    productId,
    { averageRating, reviewCount },
    { new: true }
  );

  return { averageRating, reviewCount };
};

const getRatingStats = async (productId) => {
  const productObjectId = new mongoose.Types.ObjectId(productId);

  const summary = await Review.aggregate([
    { $match: { productId: productObjectId, status: "approved" } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const ratingCounts = await Review.aggregate([
    { $match: { productId: productObjectId, status: "approved" } },
    { $group: { _id: "$rating", count: { $sum: 1 } } },
  ]);

  const totalReviews = summary.length ? summary[0].totalReviews : 0;
  const averageRating = summary.length
    ? Math.round(summary[0].averageRating * 10) / 10
    : 0;

  const distribution = {};
  for (let rating = 1; rating <= 5; rating += 1) {
    const entry = ratingCounts.find((item) => item._id === rating);
    const count = entry ? entry.count : 0;
    const percentage = totalReviews
      ? Math.round((count / totalReviews) * 100)
      : 0;
    distribution[rating] = { count, percentage };
  }

  return {
    averageRating,
    totalReviews,
    distribution: {
      5: distribution[5],
      4: distribution[4],
      3: distribution[3],
      2: distribution[2],
      1: distribution[1],
    },
  };
};

const createReview = catchAsync(async (req, res, next) => {
  const { productId, orderId, rating, title, content, images } = req.body;
  const userId = req.userInfo?._id;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return next(new AppError("Valid product ID is required", 400));
  }

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return next(new AppError("Valid order ID is required", 400));
  }

  if (!rating || Number(rating) < 1 || Number(rating) > 5) {
    return next(new AppError("Rating must be between 1 and 5", 400));
  }

  if (!title || title.trim().length < 3) {
    return next(new AppError("Title must be at least 3 characters", 400));
  }

  if (!content || content.trim().length < 10) {
    return next(new AppError("Content must be at least 10 characters", 400));
  }

  if (Array.isArray(images) && images.length > 3) {
    return next(new AppError("You can upload up to 3 images", 400));
  }

  const order = await Order.findOne({
    _id: orderId,
    user: userId,
    status: "delivered",
    "items.product": productId,
  }).select("_id");

  if (!order) {
    return next(
      new AppError("You can only leave a review after your order is delivered.", 403)
    );
  }

  const existingReview = await Review.findOne({ productId, userId });
  if (existingReview) {
    return next(new AppError("Review already exists for this product", 409));
  }

  const getSentiment = (r) => {
    if (r >= 4) return 'positive';
    if (r === 3) return 'neutral';
    return 'negative';
  };

  const allText = `${title.trim()} ${content.trim()}`;

  const containsProfanity = reviewFilterConfig.BLOCKED_PATTERNS.some((pattern) => pattern.test(allText));

  if (containsProfanity) {
    return res.status(422).json({
      success: false,
      message: 'Your review contains content that cannot be published. Please revise and resubmit.'
    });
  }

  const urlMatches = allText.match(/https?:\/\//g) || [];
  const isSuspicious =
    urlMatches.length > reviewFilterConfig.MAX_URLS_ALLOWED ||
    allText === allText.toUpperCase() ||
    allText.length < reviewFilterConfig.AUTO_FLAG_MIN_LENGTH;

  const review = await Review.create({
    productId,
    userId,
    orderId,
    rating,
    title: title.trim(),
    content: content.trim(),
    sentiment: getSentiment(rating),
    images: Array.isArray(images) ? images : [],
    verifiedPurchase: true,
    status: "pending",
    isFlagged: Boolean(isSuspicious),
    flagReason: isSuspicious ? "Auto-flagged: suspicious pattern" : null,
  });

  emitToAll(SOCKET_EVENTS.REVIEW_REFRESH, {
    userId,
    reviewId: review._id,
    status: review.status,
    productId,
    source: "review-submitted",
  });

  emitToAll(SOCKET_EVENTS.ADMIN_REFRESH, {
    userId,
    reviewId: review._id,
    status: review.status,
    productId,
    source: "review-submitted",
  });

  res.status(201).json({
    success: true,
    message: "Review submitted for approval",
    review,
  });
});

const getProductReviews = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return next(new AppError("Valid product ID is required", 400));
  }

  const rating = normalizeNumber(req.query.rating, null);
  const sort = req.query.sort || "recent";
  const page = Math.max(1, normalizeNumber(req.query.page, 1));
  const limit = Math.max(1, normalizeNumber(req.query.limit, 10));
  const skip = (page - 1) * limit;

  const filter = { productId, status: "approved" };
  if (rating && rating >= 1 && rating <= 5) {
    filter.rating = rating;
  }

  const sortMap = {
    recent: { createdAt: -1 },
    helpful: { helpfulCount: -1 },
    rating_high: { rating: -1 },
    rating_low: { rating: 1 },
  };

  const sortOption = sortMap[sort] || sortMap.recent;

  const [reviews, totalReviews, stats] = await Promise.all([
    Review.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate("userId", "email firstName lastName")
      .lean(),
    Review.countDocuments(filter),
    getRatingStats(productId),
  ]);

  res.status(200).json({
    success: true,
    message: "Reviews fetched successfully",
    reviews,
    stats,
    pagination: {
      total: totalReviews,
      page,
      pages: Math.ceil(totalReviews / limit),
      limit,
      hasMore: skip + reviews.length < totalReviews,
    },
  });
});

const getUserReviews = catchAsync(async (req, res, next) => {
  const userId = req.userInfo?._id;

  const reviews = await Review.find({ userId })
    .sort({ createdAt: -1 })
    .populate("userId", "email firstName lastName")
    .populate({
      path: "productId",
      select: "name slug averageRating reviewCount",
      populate: { path: "images", select: "url isPrimary", options: { sort: { order: 1 } } },
    })
    .lean();

  res.status(200).json({
    success: true,
    message: "User reviews fetched successfully",
    reviews,
  });
});

const getFeaturedReviews = catchAsync(async (req, res, next) => {
  const limit = Math.max(1, normalizeNumber(req.query.limit, 4));
  const featuredReviews = await Review.find({ status: "approved" })
    .sort({ helpfulCount: -1, approvedAt: -1, createdAt: -1 })
    .limit(limit)
    .populate("userId", "email firstName lastName profilePicture")
    .populate("productId", "name slug")
    .lean();

  const reviews = featuredReviews.map((review) => ({
    ...review,
    user: review.userId || null,
    product: review.productId || null,
  }));

  res.status(200).json({
    success: true,
    message: "Featured reviews fetched successfully",
    data: reviews,
  });
});

const voteHelpful = catchAsync(async (req, res, next) => {
  const { reviewId } = req.params;
  const userId = req.userInfo?._id;

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return next(new AppError("Valid review ID is required", 400));
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  if (review.status !== "approved") {
    return next(new AppError("You can only vote on approved reviews", 400));
  }

  const hasVoted = review.helpfulVotes.some(
    (vote) => vote.toString() === userId.toString()
  );

  if (hasVoted) {
    review.helpfulVotes = review.helpfulVotes.filter(
      (vote) => vote.toString() !== userId.toString()
    );
  } else {
    review.helpfulVotes.push(userId);
  }

  review.helpfulCount = review.helpfulVotes.length;
  await review.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    helpful: !hasVoted,
    count: review.helpfulCount,
  });
});

const flagReview = catchAsync(async (req, res, next) => {
  const { reviewId } = req.params;
  const { reason } = req.body;
  const userId = req.userInfo?._id;

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return next(new AppError("Valid review ID is required", 400));
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  if (review.userId.toString() === userId.toString()) {
    return next(new AppError("You cannot flag your own review", 400));
  }

  review.isFlagged = true;
  review.flagReason = reason || "Inappropriate content";
  await review.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Review flagged successfully",
  });
});

const deleteReview = catchAsync(async (req, res, next) => {
  const { reviewId } = req.params;
  const userId = req.userInfo?._id;

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return next(new AppError("Valid review ID is required", 400));
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  const isAdmin = isAdminRole(req.userInfo?.role);

  if (!isAdmin && review.userId.toString() !== userId.toString()) {
    return next(new AppError("You do not have permission to delete this review", 403));
  }

  const wasApproved = review.status === "approved";
  const productId = review.productId;

  await review.deleteOne();

  if (wasApproved) {
    await recalculateProductRating(productId);
  }

  res.status(200).json({
    success: true,
    message: "Review deleted successfully",
  });
});

const updateReview = catchAsync(async (req, res, next) => {
  const { reviewId } = req.params;
  const userId = req.userInfo?._id;
  const { rating, title, content, images } = req.body;

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return next(new AppError("Valid review ID is required", 400));
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  if (review.userId.toString() !== userId.toString()) {
    return next(new AppError("You do not have permission to edit this review", 403));
  }

  if (review.status !== "pending") {
    return next(new AppError("Only pending reviews can be edited", 400));
  }

  if (rating && (Number(rating) < 1 || Number(rating) > 5)) {
    return next(new AppError("Rating must be between 1 and 5", 400));
  }

  if (title && title.trim().length < 3) {
    return next(new AppError("Title must be at least 3 characters", 400));
  }

  if (content && content.trim().length < 10) {
    return next(new AppError("Content must be at least 10 characters", 400));
  }

  if (Array.isArray(images) && images.length > 3) {
    return next(new AppError("You can upload up to 3 images", 400));
  }

  if (rating !== undefined) review.rating = rating;
  if (title !== undefined) review.title = title.trim();
  if (content !== undefined) review.content = content.trim();
  if (images !== undefined) review.images = Array.isArray(images) ? images : [];

  await review.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Review updated successfully",
    review,
  });
});

const getAllReviews = catchAsync(async (req, res, next) => {
  const status = req.query.status || "pending";
  const search = req.query.search || "";
  const countOnly = String(req.query.countOnly || "").toLowerCase() === "true";
  const page = normalizeNumber(req.query.page, 1);
  const limit = normalizeNumber(req.query.limit, 20);
  const skip = (page - 1) * limit;

  const filter = status ? { status } : {};

  if (search) {
    const products = await Product.find({ name: { $regex: search, $options: "i" } }).select("_id");
    const users = await User.find({ email: { $regex: search, $options: "i" } }).select("_id");

    filter.$or = [
      { productId: { $in: products.map((p) => p._id) } },
      { userId: { $in: users.map((u) => u._id) } },
    ];
  }

  if (countOnly) {
    const totalReviews = await Review.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: "Reviews count fetched successfully",
      data: {
        count: totalReviews,
      },
    });
  }

  const [reviews, totalReviews] = await Promise.all([
    Review.find(filter)
      .sort({ isFlagged: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("productId", "name slug")
      .populate("userId", "email firstName lastName")
      .lean(),
    Review.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: "Reviews fetched successfully",
    reviews,
    pagination: {
      total: totalReviews,
      page,
      pages: Math.ceil(totalReviews / limit),
      limit,
      hasMore: skip + reviews.length < totalReviews,
    },
  });
});

const moderateReview = catchAsync(async (req, res, next) => {
  const { reviewId } = req.params;
  const { action, rejectionReason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return next(new AppError("Valid review ID is required", 400));
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  if (!action || !["approve", "reject"].includes(action)) {
    return next(new AppError("Action must be approve or reject", 400));
  }

  if (action === "approve") {
    review.status = "approved";
    review.approvedAt = new Date();
    review.rejectionReason = null;
    await review.save({ validateBeforeSave: false });
    await recalculateProductRating(review.productId);
  } else {
    review.status = "rejected";
    review.rejectionReason = rejectionReason?.trim() || "Rejected by admin";
    review.approvedAt = null;
    await review.save({ validateBeforeSave: false });
  }

  emitToAll(SOCKET_EVENTS.REVIEW_REFRESH, {
    userId: review.userId,
    reviewId: review._id,
    status: review.status,
    productId: review.productId,
    source: "review-moderated",
  });

  emitToAll(SOCKET_EVENTS.ADMIN_REFRESH, {
    userId: review.userId,
    reviewId: review._id,
    status: review.status,
    productId: review.productId,
    source: "review-moderated",
  });

  res.status(200).json({
    success: true,
    message: "Review moderation updated",
    review,
  });
});

const uploadReviewImages = catchAsync(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError("No images uploaded", 400));
  }

  if (req.files.length > 3) {
    return next(new AppError("You can upload up to 3 images", 400));
  }

  const oversized = req.files.find((file) => file.size > 2 * 1024 * 1024);
  if (oversized) {
    return next(new AppError("Each image must be 2MB or smaller", 400));
  }

  const uploadResults = await Promise.all(
    req.files.map((file) =>
      uploadToCloudinary(file.buffer, "saga-elite/review", file.mimetype)
    )
  );

  const images = uploadResults.map((result) => result.secure_url);

  res.status(200).json({
    success: true,
    message: "Images uploaded successfully",
    images,
  });
});

const getDropAnalytics = catchAsync(async (req, res, next) => {
  const { dropId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(dropId)) {
    return next(new AppError("Valid drop ID is required", 400));
  }

  const drop = await Drop.findById(dropId);
  if (!drop) {
    return next(new AppError("Drop not found", 404));
  }

  const products = await Product.find({ drop: dropId }).select("_id name averageRating reviewCount soldCount basePrice totalStock");
  const productIds = products.map(p => p._id);

  let totalSales = 0;
  let revenue = 0;
  let remainingStock = 0;
  let topProductsRaw = [];

  for (const p of products) {
    totalSales += (p.soldCount || 0);
    revenue += (p.soldCount || 0) * (p.basePrice || 0);
    remainingStock += (p.totalStock || 0);
    topProductsRaw.push({
      name: p.name,
      avgRating: p.averageRating || 0,
      reviewCount: p.reviewCount || 0
    });
  }

  const topProducts = topProductsRaw.sort((a, b) => b.avgRating - a.avgRating).slice(0, 5);

  const stats = await Review.aggregate([
    { $match: { productId: { $in: productIds }, status: "approved" } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: "$rating" },
        posCount: {
          $sum: { $cond: [ { $eq: ["$sentiment", "positive"] }, 1, 0 ] }
        },
        neuCount: {
          $sum: { $cond: [ { $eq: ["$sentiment", "neutral"] }, 1, 0 ] }
        },
        negCount: {
          $sum: { $cond: [ { $eq: ["$sentiment", "negative"] }, 1, 0 ] }
        },
        rating5: { $sum: { $cond: [ { $eq: ["$rating", 5] }, 1, 0 ] } },
        rating4: { $sum: { $cond: [ { $eq: ["$rating", 4] }, 1, 0 ] } },
        rating3: { $sum: { $cond: [ { $eq: ["$rating", 3] }, 1, 0 ] } },
        rating2: { $sum: { $cond: [ { $eq: ["$rating", 2] }, 1, 0 ] } },
        rating1: { $sum: { $cond: [ { $eq: ["$rating", 1] }, 1, 0 ] } },
      }
    }
  ]);

  const summary = stats[0] || {
    totalReviews: 0,
    averageRating: 0,
    posCount: 0, neuCount: 0, negCount: 0,
    rating5: 0, rating4: 0, rating3: 0, rating2: 0, rating1: 0
  };

  res.status(200).json({
    success: true,
    data: {
      dropName: drop.name,
      totalReviews: summary.totalReviews,
      averageRating: Math.round(summary.averageRating * 10) / 10,
      sentiment: {
        positive: summary.posCount,
        neutral: summary.neuCount,
        negative: summary.negCount
      },
      ratingDistribution: {
        5: summary.rating5,
        4: summary.rating4,
        3: summary.rating3,
        2: summary.rating2,
        1: summary.rating1
      },
      topProducts,
      totalSales,
      revenue,
      remainingStock
    }
  });
});

module.exports = {
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
  recalculateProductRating,
  getRatingStats,
  getDropAnalytics,
};
