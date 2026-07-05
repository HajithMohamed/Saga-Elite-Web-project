const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Recommendation = require("../Models/Recommendation");
const { GENERATORS } = require("../Utils/recommendations-job");

// The six AI insight streams. Kept in sync with the Recommendation model enum
// and the cron generators in Utils/recommendations-job.js.
const REC_TYPES = [
  "reviews",
  "products",
  "drops",
  "analytics",
  "improvements",
  "ideas",
];

/*
|--------------------------------------------------------------------------
| GET /admin/recommendations — latest insight per type
|--------------------------------------------------------------------------
| The cron generates these overnight into the Recommendation collection. This
| returns the most recent document for each type so the admin AI Insights page
| can render every stream in one request. Returns null for streams not yet run.
*/
const getAllRecommendations = catchAsync(async (_req, res) => {
  const latest = await Promise.all(
    REC_TYPES.map((type) =>
      Recommendation.findOne({ type }).sort({ generatedAt: -1 }).lean()
    )
  );

  const data = {};
  REC_TYPES.forEach((type, index) => {
    data[type] = latest[index] || null;
  });

  res.status(200).json({
    success: true,
    data,
    aiConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
  });
});

/*
|--------------------------------------------------------------------------
| GET /admin/recommendations/:type — latest + short history for one stream
|--------------------------------------------------------------------------
*/
const getRecommendationByType = catchAsync(async (req, res, next) => {
  const type = String(req.params.type || "").toLowerCase();
  if (!REC_TYPES.includes(type)) {
    return next(new AppError("Unknown recommendation type", 400));
  }

  const history = await Recommendation.find({ type })
    .sort({ generatedAt: -1 })
    .limit(5)
    .lean();

  res.status(200).json({
    success: true,
    data: history[0] || null,
    history,
    aiConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
  });
});

/*
|--------------------------------------------------------------------------
| POST /admin/recommendations/:type/regenerate — run the generator on demand
|--------------------------------------------------------------------------
| Synchronous: the admin clicks and waits a few seconds for the Claude call.
| Fails clearly (503) when the key is missing, and returns a friendly message
| when the generator skips (not enough data yet) rather than treating it as an
| error.
*/
const regenerateRecommendation = catchAsync(async (req, res, next) => {
  const type = String(req.params.type || "").toLowerCase();
  if (!REC_TYPES.includes(type)) {
    return next(new AppError("Unknown recommendation type", 400));
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return next(
      new AppError(
        "Claude (Anthropic) is not configured. Add ANTHROPIC_API_KEY to the server environment to generate AI insights.",
        503
      )
    );
  }

  const generator = GENERATORS[type];
  let doc;
  try {
    doc = await generator();
  } catch (err) {
    return next(new AppError(`Insight generation failed: ${err.message}`, 502));
  }

  if (!doc) {
    return res.status(200).json({
      success: true,
      data: null,
      message:
        "Not enough recent data to generate this insight yet. Try again once there is more activity.",
    });
  }

  req.adminAction = `Regenerated ${type} AI insight`;

  res.status(201).json({
    success: true,
    data: doc,
    message: "Insight regenerated",
  });
});

module.exports = {
  getAllRecommendations,
  getRecommendationByType,
  regenerateRecommendation,
};
