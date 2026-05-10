const mongoose = require("mongoose");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const ShippingZone = require("../Models/ShippingZone");
const filterObj = require("../Utils/filter-object");

const FIELDS = [
  "name",
  "provinces",
  "deliveryFee",
  "estimatedDays",
  "freeAbove",
  "displayOrder",
  "isActive",
];

/* Public — used by storefront */
const listPublicZones = catchAsync(async (_req, res) => {
  const zones = await ShippingZone.find({ isActive: true })
    .sort({ displayOrder: 1, name: 1 })
    .lean();
  res.status(200).json({
    success: true,
    data: { zones, count: zones.length },
  });
});

const listAdminZones = catchAsync(async (_req, res) => {
  const zones = await ShippingZone.find()
    .sort({ displayOrder: 1, name: 1 })
    .lean();
  res.status(200).json({
    success: true,
    data: { zones, count: zones.length },
  });
});

const createZone = catchAsync(async (req, res, next) => {
  const data = filterObj(req.body, ...FIELDS);
  if (!data.name) return next(new AppError("Zone name is required", 400));
  if (typeof data.deliveryFee !== "number" || data.deliveryFee < 0) {
    return next(new AppError("Delivery fee must be a non-negative number", 400));
  }
  const zone = await ShippingZone.create(data);
  res.status(201).json({
    success: true,
    message: "Shipping zone created",
    data: { zone },
  });
});

const updateZone = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid zone id", 400));
  }
  const update = filterObj(req.body, ...FIELDS);
  const zone = await ShippingZone.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  });
  if (!zone) return next(new AppError("Zone not found", 404));
  res.status(200).json({
    success: true,
    message: "Zone updated",
    data: { zone },
  });
});

module.exports = {
  listPublicZones,
  listAdminZones,
  createZone,
  updateZone,
};
