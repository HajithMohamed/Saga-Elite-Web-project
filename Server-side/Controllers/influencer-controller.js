const mongoose = require("mongoose");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Influencer = require("../Models/Influencer");
const filterObj = require("../Utils/filter-object");

const FIELDS = [
  "name",
  "handle",
  "platform",
  "campaignName",
  "status",
  "notes",
  "contactEmail",
];

const listInfluencers = catchAsync(async (_req, res) => {
  const influencers = await Influencer.find()
    .sort({ createdAt: -1 })
    .populate("createdBy", "email")
    .lean();

  res.status(200).json({
    success: true,
    data: { influencers, count: influencers.length },
  });
});

const createInfluencer = catchAsync(async (req, res, next) => {
  const data = filterObj(req.body, ...FIELDS);
  if (!data.name) return next(new AppError("Name is required", 400));
  if (!data.handle) return next(new AppError("Handle is required", 400));
  if (!data.platform) return next(new AppError("Platform is required", 400));

  data.createdBy = req.userInfo?._id || req.userInfo?.id || null;

  try {
    const influencer = await Influencer.create(data);
    res.status(201).json({
      success: true,
      message: "Influencer added",
      data: { influencer },
    });
  } catch (err) {
    if (err?.code === 11000) {
      return next(
        new AppError(
          `${data.handle} on ${data.platform} is already tracked`,
          409
        )
      );
    }
    throw err;
  }
});

const updateInfluencer = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid influencer id", 400));
  }
  const update = filterObj(req.body, ...FIELDS);
  const influencer = await Influencer.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  });
  if (!influencer) return next(new AppError("Influencer not found", 404));
  res.status(200).json({
    success: true,
    message: "Influencer updated",
    data: { influencer },
  });
});

const deleteInfluencer = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid influencer id", 400));
  }
  const influencer = await Influencer.findByIdAndDelete(id);
  if (!influencer) return next(new AppError("Influencer not found", 404));
  res.status(200).json({
    success: true,
    message: "Influencer removed",
    data: { id },
  });
});

module.exports = {
  listInfluencers,
  createInfluencer,
  updateInfluencer,
  deleteInfluencer,
};
