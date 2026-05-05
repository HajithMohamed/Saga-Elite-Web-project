const Deal = require("../Models/Deal");
const catchAsync = require("../Utils/catchAsync");

exports.getActiveDeals = catchAsync(async (req, res, next) => {
  const now = new Date();

  // Find deals that are active, have started, and haven't ended yet
  const deals = await Deal.find({
    isActive: true,
    startsAt: { $lte: now },
    endsAt: { $gt: now },
  }).populate({
    path: "product",
    populate: { path: "images" }
  });

  res.status(200).json({
    status: "success",
    results: deals.length,
    data: { deals },
  });
});

exports.createDeal = catchAsync(async (req, res, next) => {
  const deal = await Deal.create(req.body);

  res.status(201).json({
    status: "success",
    data: { deal },
  });
});

exports.updateDeal = catchAsync(async (req, res, next) => {
  const deal = await Deal.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: { deal },
  });
});

exports.deleteDeal = catchAsync(async (req, res, next) => {
  await Deal.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});