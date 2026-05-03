const SiteConfig = require("../Models/SiteConfig");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");

const ABOUT_KEYS = [
  "about_brand_story",
  "about_stats",
  "about_values",
  "about_team_heading",
  "about_team_subtext",
];

exports.getConfig = catchAsync(async (req, res, next) => {
  const rawKey = (req.params.key || "").trim().toLowerCase();
  const doc = await SiteConfig.findOne({ key: rawKey });
  if (!doc) {
    return next(new AppError("Config not found", 404));
  }
  res.status(200).json({ success: true, data: doc.value });
});

exports.getAboutPageConfig = catchAsync(async (_req, res) => {
  const docs = await SiteConfig.find({ key: { $in: ABOUT_KEYS } });
  const result = {};
  docs.forEach((d) => {
    result[d.key] = d.value;
  });
  res.status(200).json({ success: true, data: result });
});

exports.upsertConfig = catchAsync(async (req, res, next) => {
  const rawKey = (req.params.key || "").trim().toLowerCase();
  const { value, label } = req.body;
  if (value === undefined) {
    return next(new AppError("value is required", 400));
  }
  const doc = await SiteConfig.findOneAndUpdate(
    { key: rawKey },
    { value, label, updatedBy: req.userInfo._id },
    { new: true, upsert: true, runValidators: true }
  );
  res.status(200).json({ success: true, data: doc });
});
