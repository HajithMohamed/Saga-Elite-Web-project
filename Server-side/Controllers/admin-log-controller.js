const AdminLog = require("../Models/AdminLog");
const catchAsync = require("../Utils/catchAsync");
const { buildLogFilter } = require("../Utils/admin-log-query");

// GET /api/v1/admin/activity — permission-aware log feed.
// Mirrors super-admin getActivityLogs response shape so the frontend can
// reuse the same rendering, but filters categories the caller isn't
// permitted to see.
const listMyVisibleLogs = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const rawLimit = parseInt(req.query.limit, 10) || 50;
  const limit = Math.min(200, Math.max(1, rawLimit));
  const skip = (page - 1) * limit;

  const filter = buildLogFilter({ user: req.userInfo, query: req.query });

  const [logs, totalLogs] = await Promise.all([
    AdminLog.find(filter)
      .populate("adminId", "email role name subRole")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AdminLog.countDocuments(filter),
  ]);

  res.status(200).json({
    status: "success",
    results: logs.length,
    pagination: {
      total: totalLogs,
      page,
      pages: Math.max(1, Math.ceil(totalLogs / limit)),
      limit,
    },
    data: { logs },
  });
});

module.exports = { listMyVisibleLogs };
