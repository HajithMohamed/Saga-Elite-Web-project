const SmartAlert = require("../Models/SmartAlert");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const mongoose = require("mongoose");
const { runAllChecks } = require("../Utils/smart-alerts-job");

const listAlerts = catchAsync(async (req, res) => {
  const { countOnly, includeAcknowledged, kind } = req.query;
  const filter = {};
  if (!includeAcknowledged) filter.acknowledged = false;

  // Comma-separated list of kinds — used by the sidebar Products badge to
  // count only low-stock alerts (`?kind=low_stock_warning,low_stock_critical`).
  if (kind) {
    const kinds = String(kind)
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    if (kinds.length > 0) filter.kind = { $in: kinds };
  }

  if (countOnly === "true") {
    const count = await SmartAlert.countDocuments(filter);
    return res.status(200).json({ success: true, data: { count } });
  }

  const alerts = await SmartAlert.find(filter).sort({ severity: 1, createdAt: -1 }).lean();
  res.status(200).json({ success: true, data: { alerts } });
});

const acknowledgeAlert = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid alert id", 400));
  }
  const alert = await SmartAlert.findByIdAndUpdate(
    id,
    {
      acknowledged: true,
      acknowledgedAt: new Date(),
      acknowledgedBy: req.userInfo?._id || req.userInfo?.id || null,
    },
    { new: true }
  );
  if (!alert) return next(new AppError("Alert not found", 404));
  res.status(200).json({ success: true, data: { alert } });
});

const triggerCheck = catchAsync(async (req, res) => {
  // Manual trigger (useful for admin testing). Fire-and-forget so the request
  // doesn't block on long DB scans.
  runAllChecks().catch(() => {});
  res.status(202).json({ success: true, message: "Smart alert checks running in background" });
});

module.exports = { listAlerts, acknowledgeAlert, triggerCheck };
