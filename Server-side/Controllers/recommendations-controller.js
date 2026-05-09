const Recommendation = require("../Models/Recommendation");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const { GENERATORS } = require("../Utils/recommendations-job");

const VALID_TYPES = ["reviews", "products", "drops", "analytics", "improvements", "ideas"];

const getLatestRecommendation = catchAsync(async (req, res, next) => {
  const { type } = req.params;
  if (!VALID_TYPES.includes(type)) {
    return next(new AppError(`Unknown recommendation type: ${type}`, 400));
  }
  const recommendation = await Recommendation.findOne({ type }).sort({ generatedAt: -1 }).lean();
  res.status(200).json({
    success: true,
    data: { recommendation },
  });
});

const getAllLatestRecommendations = catchAsync(async (req, res) => {
  const all = await Promise.all(
    VALID_TYPES.map(async (type) => {
      const recommendation = await Recommendation.findOne({ type })
        .sort({ generatedAt: -1 })
        .lean();
      return [type, recommendation];
    })
  );
  const byType = Object.fromEntries(all);
  res.status(200).json({
    success: true,
    data: { byType },
  });
});

const regenerateRecommendation = catchAsync(async (req, res, next) => {
  const { type } = req.params;
  if (!VALID_TYPES.includes(type)) {
    return next(new AppError(`Unknown recommendation type: ${type}`, 400));
  }
  try {
    const recommendation = await GENERATORS[type]();
    if (!recommendation) {
      return next(new AppError(`Not enough data to generate ${type} recommendations.`, 400));
    }
    res.status(200).json({
      success: true,
      data: { recommendation },
    });
  } catch (err) {
    return next(new AppError(err.message || "Failed to generate recommendations", 500));
  }
});

module.exports = {
  getLatestRecommendation,
  getAllLatestRecommendations,
  regenerateRecommendation,
};
