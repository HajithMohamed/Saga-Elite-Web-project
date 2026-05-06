const mongoose = require("mongoose");
const Gift = require("../Models/Gift");
const Order = require("../Models/Order");
const Drop = require("../Models/Drop");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const filterObj = require("../Utils/filter-object");

const giftPayloadFields = [
  "name",
  "drop",
  "isActive",
  "condition",
  "minOrderValue",
  "description",
  "internalNotes",
  "imageUrl",
];

const normalizeDropValue = (value) => {
  if (value === undefined || value === null || value === "" || value === "global") {
    return null;
  }

  return value;
};

const enrichGift = async (giftDoc, orderCounts = new Map()) => {
  if (!giftDoc) return null;

  const gift = giftDoc.toObject ? giftDoc.toObject() : giftDoc;
  gift.orderCount = orderCounts.get(String(gift._id)) || 0;
  return gift;
};

exports.getAllGifts = catchAsync(async (_req, res) => {
  const gifts = await Gift.find({}).populate("drop", "name slug").sort({ createdAt: -1 });
  const counts = await Order.aggregate([
    { $match: { "gift.giftId": { $ne: null } } },
    { $group: { _id: "$gift.giftId", count: { $sum: 1 } } },
  ]);

  const orderCounts = new Map(counts.map((entry) => [String(entry._id), entry.count]));
  const data = await Promise.all(gifts.map((gift) => enrichGift(gift, orderCounts)));

  res.status(200).json({
    success: true,
    data,
  });
});

exports.getGiftOrders = catchAsync(async (req, res, next) => {
  const { giftId } = req.params;

  if (!giftId || !mongoose.isValidObjectId(giftId)) {
    return next(new AppError("Gift id is required", 400));
  }

  const gift = await Gift.findById(giftId).populate("drop", "name slug");
  if (!gift) {
    return next(new AppError("Gift not found", 404));
  }

  const orders = await Order.find({ "gift.giftId": gift._id })
    .sort({ createdAt: -1 })
    .populate("user", "email fullName userName")
    .populate("guest", "email");

  res.status(200).json({
    success: true,
    data: {
      gift: await enrichGift(gift),
      orders,
    },
  });
});

exports.createGift = catchAsync(async (req, res, next) => {
  const giftData = filterObj(req.body, ...giftPayloadFields);
  giftData.drop = normalizeDropValue(giftData.drop);

  if (!giftData.name || !String(giftData.name).trim()) {
    return next(new AppError("Gift name is required", 400));
  }

  if (giftData.drop && !mongoose.isValidObjectId(giftData.drop)) {
    return next(new AppError("Invalid drop id", 400));
  }

  if (giftData.drop) {
    const dropExists = await Drop.exists({ _id: giftData.drop });
    if (!dropExists) {
      return next(new AppError("Drop not found", 404));
    }
  }

  const gift = await Gift.create({
    ...giftData,
    minOrderValue: Number(giftData.minOrderValue || 0),
    isActive: giftData.isActive !== undefined ? giftData.isActive !== false : true,
  });

  res.status(201).json({
    success: true,
    data: gift,
  });
});

exports.updateGift = catchAsync(async (req, res, next) => {
  const { giftId } = req.params;

  if (!giftId || !mongoose.isValidObjectId(giftId)) {
    return next(new AppError("Gift id is required", 400));
  }

  const gift = await Gift.findById(giftId);
  if (!gift) {
    return next(new AppError("Gift not found", 404));
  }

  const giftData = filterObj(req.body, ...giftPayloadFields);
  if (Object.prototype.hasOwnProperty.call(giftData, "drop")) {
    giftData.drop = normalizeDropValue(giftData.drop);
    if (giftData.drop && !mongoose.isValidObjectId(giftData.drop)) {
      return next(new AppError("Invalid drop id", 400));
    }
    if (giftData.drop) {
      const dropExists = await Drop.exists({ _id: giftData.drop });
      if (!dropExists) {
        return next(new AppError("Drop not found", 404));
      }
    }
  }

  Object.assign(gift, {
    ...giftData,
    ...(giftData.minOrderValue !== undefined ? { minOrderValue: Number(giftData.minOrderValue || 0) } : {}),
  });

  await gift.save({ validateModifiedOnly: true });

  res.status(200).json({
    success: true,
    data: gift,
  });
});